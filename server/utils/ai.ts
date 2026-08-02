// AI 服务封装
// 统一通过 OpenAI 兼容接口调用，强制 JSON 返回。
// 在 Node.js 运行时（EdgeOne Makers Cloud Functions）下运行，使用 fetch API。

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
  UiLang,
  PracticeDifficulty,
  ScenarioValue,
} from '../types/ai'
import { getGeneratePrompt, getJudgePrompt } from './prompts'

// ---------- 配置 ----------

interface AIConfig {
  apiKey: string
  baseUrl: string
  model: string
}

/** 从 runtimeConfig 获取 AI 配置（NUXT_AI_API_KEY / NUXT_AI_BASE_URL / NUXT_AI_MODEL 环境变量自动注入） */
function getAIConfig(_event: H3Event): AIConfig {
  const config = useRuntimeConfig()

  const apiKey = config.aiApiKey
  const baseUrl = config.aiBaseUrl
  const model = config.aiModel

  if (!apiKey) {
    throw createError({
      statusCode: 500,
      statusMessage: 'AI API key is not configured. Set NUXT_AI_API_KEY (or AI_API_KEY) in your environment.',
    })
  }

  return { apiKey, baseUrl, model }
}

/** 获取 OpenAI 客户端（不复用单例，因为配置可能随请求变化） */
function createClient(config: AIConfig): OpenAI {
  return new OpenAI({
    apiKey: config.apiKey,
    baseURL: config.baseUrl,
  })
}

/** 提取 OpenAI 兼容接口返回的文本内容，兼容 string 和 content parts 两种格式。 */
export function extractAIContent(message: unknown): string {
  if (!message || typeof message !== 'object') return ''

  const content = (message as { content?: unknown }).content
  if (typeof content === 'string') return content.trim()
  if (!Array.isArray(content)) return ''

  return content
    .map((part) => {
      if (typeof part === 'string') return part
      if (part && typeof part === 'object' && typeof (part as { text?: unknown }).text === 'string') {
        return (part as { text: string }).text
      }
      return ''
    })
    .join('')
    .trim()
}

/** 从完整 completion 中安全提取文本，兼容 choices 缺失或为空的网关响应。 */
export function extractCompletionContent(completion: unknown): string {
  if (!completion || typeof completion !== 'object') return ''

  const choices = (completion as { choices?: unknown }).choices
  if (!Array.isArray(choices)) return ''

  const firstChoice = choices[0]
  if (!firstChoice || typeof firstChoice !== 'object') return ''

  return extractAIContent((firstChoice as { message?: unknown }).message)
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
    const requestCompletion = (useJsonMode: boolean) => client.chat.completions.create({
        model: config.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: request.user },
        ],
        temperature,
        max_tokens: maxTokens,
        ...(useJsonMode ? { response_format: { type: 'json_object' as const } } : {}),
      })

    let completion = await requestCompletion(true)
    let raw = extractCompletionContent(completion)
    // 部分兼容网关不支持 JSON mode 或偶发返回空 content，去掉 response_format 重试一次。
    if (!raw) {
      completion = await requestCompletion(false)
      raw = extractCompletionContent(completion)
    }

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
  language?: 'ja' | 'en'
  languagePair?: LanguagePair
  sourceLang?: LangCode
  grammarTag?: GrammarTag
  questionType?: 'fill-blank' | 'error-correction'
  difficulty?: 1 | 2 | 3
  practiceDifficulty?: PracticeDifficulty
  scenario?: ScenarioValue
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
  questionType?: 'fill-blank' | 'error-correction'
  uiLang?: UiLang
}

/**
 * 将模型返回的分数统一归一为 10 分制整数。
 * 兼容模型偶发返回的 100 分制、0-1 小数制等情况。
 */
function normalizeToTenScale(score: number): number {
  if (!Number.isFinite(score)) return 0

  let normalized = score

  // 常见异常：百分制（0-100）
  if (normalized > 10 && normalized <= 100) {
    normalized = normalized / 10
  }

  // 常见异常：0-1 小数制
  if (normalized > 0 && normalized <= 1) {
    normalized = normalized * 10
  }

  // 限定在 0-10，并取整为分值
  normalized = Math.max(0, Math.min(10, normalized))
  return Math.round(normalized)
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
  if (typeof result.score !== 'number') {
    result.score = result.isCorrect ? 10 : 0
  } else {
    result.score = normalizeToTenScale(result.score)
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
