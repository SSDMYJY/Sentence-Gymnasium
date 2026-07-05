// AI 服务类型定义
// 统一描述三种训练模式（practice / paraphrase / grammar）的出题与判题数据结构。

// ---------- 通用 ----------

/** 训练模式 */
export type Category = 'practice' | 'paraphrase' | 'grammar'

/** 支持的语言代码 */
export type LangCode = 'ja' | 'en' | 'zh'

/** 语言对，如 'ja-en'（日译英） */
export type LanguagePair = `${LangCode}-${LangCode}`

/** 语法标签（可扩展） */
export type GrammarTag =
  | 'te-form'
  | 'present-perfect'
  | 'passive'
  | 'conditionals'
  | 'relative-clauses'
  | 'particles'
  | 'honorifics'

// ---------- 出题 ----------

/** Practice（翻译练习）出题结果 */
export interface PracticeQuestion {
  /** 展示给用户的题目文本（源语言句子） */
  questionText: string
  /** 标准参考答案（目标语言） */
  correctAnswer: string
  /** 语言对，如 'ja-en' */
  languagePair: LanguagePair
  /** 难度等级 1-3 */
  difficulty: 1 | 2 | 3
  /** 备选干扰项（可选，用于选择题型） */
  options?: string[]
}

/** Paraphrase（同义改写）出题结果 */
export interface ParaphraseQuestion {
  /** 原文（源语言） */
  questionText: string
  /** 参考改写（同语言） */
  correctAnswer: string
  /** 源语言 */
  sourceLang: LangCode
  /** 改写要点提示 */
  hint?: string
}

/** Grammar（语法特训）出题结果 */
export interface GrammarQuestion {
  /** 题目文本（含填空 ___ 或完整句子） */
  questionText: string
  /** 正确答案 */
  correctAnswer: string
  /** 语法标签 */
  grammarTag: GrammarTag
  /** 题型：填空 / 选择 / 改错 */
  questionType: 'fill-blank' | 'choice' | 'error-correction'
  /** 选择题选项（questionType='choice' 时必填） */
  options?: string[]
  /** 语法点说明 */
  explanation?: string
}

/** 统一出题结果联合类型 */
export type GeneratedQuestion =
  | { category: 'practice'; data: PracticeQuestion }
  | { category: 'paraphrase'; data: ParaphraseQuestion }
  | { category: 'grammar'; data: GrammarQuestion }

// ---------- 判题 ----------

/** 判题结果 */
export interface JudgeResult {
  /** 是否正确 */
  isCorrect: boolean
  /** 0-100 分数（部分正确可给分） */
  score: number
  /** 简短评价（正确/部分正确/错误） */
  verdict: 'correct' | 'partial' | 'incorrect'
  /** 详细反馈（语法、用词、自然度等） */
  feedback: string
  /** 改进建议（更好的表达方式） */
  suggestion?: string
  /** 指出的具体错误点 */
  errors?: string[]
}

// ---------- AI 调用底层 ----------

/** AI 请求参数 */
export interface AIRequest {
  /** 系统提示词 */
  system: string
  /** 用户提示词 */
  user: string
  /** 期望返回的 JSON schema 描述（用于强化 JSON 输出） */
  jsonSchemaHint?: string
  /** 温度（0-2），出题默认 0.8，判题默认 0.2 */
  temperature?: number
  /** 最大 token 数 */
  maxTokens?: number
}

/** AI 响应结果（已解析为 JSON） */
export interface AIResponse<T = unknown> {
  /** 解析后的 JSON 数据 */
  data: T
  /** 模型实际返回的原始文本（调试用） */
  raw: string
  /** 使用的 token 数（如果 API 返回） */
  usage?: {
    promptTokens?: number
    completionTokens?: number
    totalTokens?: number
  }
}
