// AI 服务封装
// 统一通过 OpenAI 兼容接口调用，强制 JSON 返回。
// 在 Cloudflare Workers edge runtime 下运行，使用 fetch API。

import OpenAI from 'openai'
import type { H3Event } from 'h3'
import type {
  AIRequest,
  AIResponse,
  Category,
  GeneratedQuestion,
  JudgeResult,
  PracticeQuestion,
  ParaphraseQuestion,
  GrammarQuestion,
  LanguagePair,
  LangCode,
  GrammarTag,
} from '../types/ai'
import { getGeneratePrompt, getJudgePrompt } from './prompts'

// ---------- 配置 ----------

interface AIConfig {
  apiKey: string
  baseUrl: string
  model: string
}

/** 从 runtimeConfig 获取 AI 配置 */
function getAIConfig(event: H3Event): AIConfig {
  const config = useRuntimeConfig()
  // 在 Cloudflare Workers 上，secrets 通过 event.context.cloudflare.env 注入。
  // 本地 dev 时，nitro-cloudflare-dev 将 .dev.vars 注入到同一位置。
  const env = event.context.cloudflare?.env as Record<string, string> | undefined

  const apiKey = env?.AI_API_KEY || config.aiApiKey
  const baseUrl = env?.AI_BASE_URL || config.aiBaseUrl
  const model = env?.AI_MODEL || config.aiModel

  if (!apiKey) {
    throw createError({
      statusCode: 500,
      statusMessage: 'AI API key is not configured. Set AI_API_KEY in .dev.vars or Cloudflare secrets.',
    })
  }

  return { apiKey, baseUrl, model }
}

/** 获取 OpenAI 客户端（不复用单例，因为配置可能随请求变化） */
function createClient(config: AIConfig): OpenAI {
  return new OpenAI({
    apiKey: config.apiKey,
    baseURL: config.baseUrl,
    // Workers edge runtime 不支持 Node.js 的 http 模块，需用 fetch
    fetch: globalThis.fetch,
  })
}

// ---------- 核心：调用 AI 并强制 JSON 返回 ----------

/**
 * 调用 AI 接口，强制返回 JSON。
 * 通过 system prompt 指示 + response_format: json_object 双重保障。
 */
export async function callAI<T = unknown>(
  event: H3Event,
  request: AIRequest,
): Promise<AIResponse<T>> {
  const config = getAIConfig(event)
  const client = createClient(config)

  const temperature = request.temperature ?? 0.8
  const maxTokens = request.maxTokens ?? 1024

  // 强化 JSON 输出：system 末尾追加指令
  const systemPrompt = `${request.system}

IMPORTANT: Respond with ONLY a valid JSON object. Do not include any text before or after the JSON. Do not wrap it in markdown code fences.`

  try {
    const completion = await client.chat.completions.create({
      model: config.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: request.user },
      ],
      temperature,
      max_tokens: maxTokens,
      // OpenAI 兼容接口的 JSON 模式
      response_format: { type: 'json_object' },
    })

    const raw = completion.choices[0]?.message?.content ?? ''

    if (!raw) {
      throw createError({
        statusCode: 502,
        statusMessage: 'AI returned empty response',
      })
    }

    // 解析 JSON —— 尝试提取 JSON 块（兼容模型偶尔包裹 markdown 的情况）
    const data = parseJSON<T>(raw)

    return {
      data,
      raw,
      usage: {
        promptTokens: completion.usage?.prompt_tokens,
        completionTokens: completion.usage?.completion_tokens,
        totalTokens: completion.usage?.total_tokens,
      },
    }
  } catch (err: any) {
    // 已经是 createError 抛出的，直接透传
    if (err.statusCode) throw err

    throw createError({
      statusCode: 502,
      statusMessage: `AI request failed: ${err.message || 'Unknown error'}`,
    })
  }
}

// ---------- JSON 解析 ----------

/**
 * 健壮的 JSON 解析。
 * 1. 直接 JSON.parse
 * 2. 失败则尝试提取 { ... } 块
 * 3. 仍失败则抛错
 */
function parseJSON<T>(text: string): T {
  // 方式1：直接解析
  try {
    return JSON.parse(text) as T
  } catch {
    // 继续
  }

  // 方式2：提取第一个 { ... } 块
  const match = text.match(/\{[\s\S]*\}/)
  if (match) {
    try {
      return JSON.parse(match[0]) as T
    } catch {
      // 继续
    }
  }

  // 方式3：去除 markdown 代码块后再试
  const cleaned = text
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim()
  try {
    return JSON.parse(cleaned) as T
  } catch {
    throw createError({
      statusCode: 502,
      statusMessage: `AI response is not valid JSON. First 200 chars: ${text.slice(0, 200)}`,
    })
  }
}

// ---------- 业务层：出题 ----------

export interface GenerateParams {
  category: Category
  languagePair?: LanguagePair
  sourceLang?: LangCode
  grammarTag?: GrammarTag
  questionType?: 'fill-blank' | 'choice' | 'error-correction'
  difficulty?: 1 | 2 | 3
}

/**
 * 生成一道题目。返回对应模式的题目数据。
 */
export async function generateQuestion(
  event: H3Event,
  params: GenerateParams,
): Promise<GeneratedQuestion> {
  const { system, user } = getGeneratePrompt(params.category, params)

  // 根据模式确定期望的返回类型
  type ExpectedData = PracticeQuestion | ParaphraseQuestion | GrammarQuestion

  const response = await callAI<ExpectedData>(event, {
    system,
    user,
    temperature: 0.8,
    maxTokens: 1024,
  })

  // 基础字段校验
  const data = response.data
  if (!data || typeof data !== 'object') {
    throw createError({ statusCode: 502, statusMessage: 'AI returned invalid question data' })
  }

  return {
    category: params.category,
    data: data as ExpectedData,
  } as GeneratedQuestion
}

// ---------- 业务层：判题 ----------

export interface JudgeParams {
  category: Category
  questionText: string
  correctAnswer: string
  userAnswer: string
  languagePair?: LanguagePair
  sourceLang?: LangCode
  grammarTag?: GrammarTag
  questionType?: 'fill-blank' | 'choice' | 'error-correction'
  uiLang?: UiLang
}

/**
 * 判题。返回判题结果（isCorrect / score / feedback 等）。
 */
export async function judgeAnswer(
  event: H3Event,
  params: JudgeParams,
): Promise<JudgeResult> {
  const { system, user } = getJudgePrompt(params.category, {
    questionText: params.questionText,
    correctAnswer: params.correctAnswer,
    languagePair: params.languagePair,
    sourceLang: params.sourceLang,
    grammarTag: params.grammarTag,
    questionType: params.questionType,
    uiLang: params.uiLang,
  }, params.userAnswer)

  const response = await callAI<JudgeResult>(event, {
    system,
    user,
    temperature: 0.2, // 判题需要确定性，低温度
    maxTokens: 768,
  })

  const result = response.data

  // 字段校验 & 兜底
  if (typeof result.isCorrect !== 'boolean') {
    throw createError({ statusCode: 502, statusMessage: 'AI judge result missing isCorrect field' })
  }
  if (typeof result.score !== 'number' || result.score < 0 || result.score > 10) {
    result.score = result.isCorrect ? 10 : 0
  }
  if (!result.verdict || !['correct', 'partial', 'incorrect'].includes(result.verdict)) {
    result.verdict = result.isCorrect ? 'correct' : 'incorrect'
  }
  if (typeof result.feedback !== 'string') {
    result.feedback = ''
  }

  return result
}

// ---------- 工具函数 ----------

/**
 * 快速检测 AI 配置是否就绪（不发送请求）。
 * 用于 health check 或前端提示。
 */
export function isAIConfigured(event: H3Event): boolean {
  try {
    getAIConfig(event)
    return true
  } catch {
    return false
  }
}
