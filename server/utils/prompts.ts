// AI 提示词集合
// 集中管理三种训练模式（practice / paraphrase / grammar）的出题与判题 prompt。
// 所有 prompt 都要求模型以 JSON 格式返回，便于程序解析。

import type { Category, GrammarTag, LangCode, LanguagePair, UiLang } from '../types/ai'

// 语言代码 → 自然名称
const LANG_NAME: Record<LangCode, string> = {
  ja: '日本語',
  en: 'English',
  zh: '中文',
}

// 语言代码 → 母语者提示
const LANG_NATIVE: Record<LangCode, string> = {
  ja: 'Japanese',
  en: 'English',
  zh: 'Chinese',
}

// 语法标签 → 描述
const GRAMMAR_DESC: Record<GrammarTag, string> = {
  'te-form': '日语て形（te-form）',
  'present-perfect': '现在完成时',
  'passive': '被动语态',
  'conditionals': '条件句',
  'relative-clauses': '关系从句',
  'particles': '助词',
  'honorifics': '敬语',
}

// 语法标签 → 语言代码
const GRAMMAR_LANG: Record<GrammarTag, LangCode> = {
  'te-form': 'ja',
  'present-perfect': 'en',
  'passive': 'en',
  'conditionals': 'en',
  'relative-clauses': 'en',
  'particles': 'ja',
  'honorifics': 'ja',
}

// 界面语言代码 → 自然语言名称（用于 AI 提示词）
const UI_LANG_NAME: Record<UiLang, string> = {
  'zh-hans': 'Chinese (Simplified)',
  'zh-hant': 'Chinese (Traditional)',
  'en': 'English',
  'ja': 'Japanese',
}

// ---------- 系统 prompt ----------

const SYSTEM_BASE = `You are an expert language teacher and examiner for "Sentence Gymnasium", a multilingual sentence training platform.
You are fluent in Japanese, English, and Chinese, and deeply understand their grammar, nuance, and natural expression.

CRITICAL RULES:
1. You MUST respond with a single valid JSON object. No markdown, no code fences, no commentary outside JSON.
2. All string values inside the JSON must be properly escaped.
3. Keep explanations concise but insightful — students read them to learn.`

const SYSTEM_GENERATE = `${SYSTEM_BASE}
Your task is to GENERATE practice questions that are clear, fair, and pedagogically valuable.
Avoid culturally sensitive, political, or inappropriate content.
Sentences should reflect real-world usage.`

const SYSTEM_JUDGE = `${SYSTEM_BASE}
Your task is to JUDGE student answers. Be encouraging but fair.
Evaluate meaning preservation, grammatical correctness, and naturalness.
A perfect synonym or rephrasing that preserves meaning counts as correct.
Minor spelling/typo errors should not fully fail an otherwise correct answer.`

// ---------- Practice（翻译练习）----------

export function practiceGeneratePrompt(
  languagePair: LanguagePair,
  difficulty: 1 | 2 | 3 = 2,
): { system: string; user: string } {
  const [src, dst] = languagePair.split('-') as [LangCode, LangCode]
  const diffDesc = difficulty === 1 ? 'beginner (N5/easy)' : difficulty === 2 ? 'intermediate (N3/medium)' : 'advanced (N1/hard)'

  return {
    system: SYSTEM_GENERATE,
    user: `Generate a single translation exercise.

Requirements:
- Source language: ${LANG_NAME[src]} (${LANG_NATIVE[src]})
- Target language: ${LANG_NAME[dst]} (${LANG_NATIVE[dst]})
- Difficulty: ${diffDesc}
- The source sentence should be natural and commonly used.
- Provide the canonical correct translation in the target language.

Return ONLY this JSON shape:
{
  "questionText": "<source sentence in ${LANG_NATIVE[src]}>",
  "correctAnswer": "<canonical translation in ${LANG_NATIVE[dst]}>",
  "languagePair": "${languagePair}",
  "difficulty": ${difficulty}
}`,
  }
}

export function practiceJudgePrompt(
  questionText: string,
  correctAnswer: string,
  userAnswer: string,
  languagePair: LanguagePair,
  uiLang?: UiLang,
): { system: string; user: string } {
  const [, dst] = languagePair.split('-') as [LangCode, LangCode]
  const feedbackLang = uiLang ? UI_LANG_NAME[uiLang] : LANG_NATIVE[dst]

  return {
    system: SYSTEM_JUDGE,
    user: `Judge this translation attempt.

Source sentence: ${questionText}
Reference answer: ${correctAnswer}
Student's answer: ${userAnswer}
Target language: ${LANG_NAME[dst]}

Evaluation criteria:
- Does the answer preserve the core meaning of the source?
- Is the grammar correct in ${LANG_NATIVE[dst]}?
- Is the expression natural (not awkward or machine-translated)?

CRITICAL: Respond in ${feedbackLang}. The feedback, suggestion, and errors fields MUST be in ${feedbackLang}, matching the user's interface language.

Return ONLY this JSON shape:
{
  "isCorrect": boolean,
  "score": number (0-10),
  "verdict": "correct" | "partial" | "incorrect",
  "feedback": "<concise explanation in ${feedbackLang}>",
  "suggestion": "<a better way to express it, or null if already great>",
  "errors": ["<specific error 1>", "<specific error 2>"]
}`,
  }
}

// ---------- Paraphrase（同义改写）----------

export function paraphraseGeneratePrompt(
  sourceLang: LangCode,
  difficulty: 1 | 2 | 3 = 2,
): { system: string; user: string } {
  const diffDesc = difficulty === 1 ? 'simple vocabulary, short sentence' : difficulty === 2 ? 'moderate complexity' : 'rich vocabulary, complex structure'

  return {
    system: SYSTEM_GENERATE,
    user: `Generate a single paraphrase exercise.

Requirements:
- Language: ${LANG_NAME[sourceLang]} (${LANG_NATIVE[sourceLang]})
- Difficulty: ${diffDesc}
- Provide an original sentence and a natural rephrased version that preserves meaning.
- The rephrase should differ in structure/wording but keep the same semantics.

Return ONLY this JSON shape:
{
  "questionText": "<original sentence in ${LANG_NATIVE[sourceLang]}>",
  "correctAnswer": "<rephrased version in ${LANG_NATIVE[sourceLang]}>",
  "sourceLang": "${sourceLang}",
  "hint": "<brief hint about what kind of rephrasing to try>"
}`,
  }
}

export function paraphraseJudgePrompt(
  questionText: string,
  correctAnswer: string,
  userAnswer: string,
  sourceLang: LangCode,
  uiLang?: UiLang,
): { system: string; user: string } {
  const feedbackLang = uiLang ? UI_LANG_NAME[uiLang] : LANG_NATIVE[sourceLang]

  return {
    system: SYSTEM_JUDGE,
    user: `Judge this paraphrase attempt.

Original sentence: ${questionText}
Reference paraphrase: ${correctAnswer}
Student's paraphrase: ${userAnswer}
Language: ${LANG_NAME[sourceLang]} (${LANG_NATIVE[sourceLang]})

Evaluation criteria:
- Does the paraphrase preserve the original meaning?
- Is the grammar correct?
- Is the expression natural and different enough from the original?
- Award credit for valid alternative phrasings, not just the reference answer.

CRITICAL: Respond in ${feedbackLang}. The feedback, suggestion, and errors fields MUST be in ${feedbackLang}, matching the user's interface language.

Return ONLY this JSON shape:
{
  "isCorrect": boolean,
  "score": number (0-10),
  "verdict": "correct" | "partial" | "incorrect",
  "feedback": "<concise explanation in ${feedbackLang}>",
  "suggestion": "<an even better paraphrase, or null>",
  "errors": ["<specific issue 1>"]
}`,
  }
}

// ---------- Grammar（语法特训）----------

export function grammarGeneratePrompt(
  grammarTag: GrammarTag,
  questionType: 'fill-blank' | 'choice' | 'error-correction' = 'fill-blank',
  difficulty: 1 | 2 | 3 = 2,
): { system: string; user: string } {
  const tagDesc = GRAMMAR_DESC[grammarTag]
  const typeDesc = {
    'fill-blank': 'fill-in-the-blank (replace ___ with the correct form)',
    'choice': 'multiple choice (provide 4 options, only 1 correct)',
    'error-correction': 'error correction (sentence contains one grammatical error to fix)',
  }[questionType]

  return {
    system: SYSTEM_GENERATE,
    user: `Generate a single grammar exercise.

Requirements:
- Grammar point: ${tagDesc}
- Question type: ${typeDesc}
- Difficulty: ${difficulty === 1 ? 'basic' : difficulty === 2 ? 'intermediate' : 'advanced'}
- The sentence should clearly test the target grammar point.

Return ONLY this JSON shape:
{
  "questionText": "<the exercise sentence, with ___ for fill-blank>",
  "correctAnswer": "<the correct answer>",
  "grammarTag": "${grammarTag}",
  "questionType": "${questionType}",
  ${questionType === 'choice' ? '"options": ["opt1", "opt2", "opt3", "opt4"],' : ''}
  "explanation": "<brief explanation of the grammar rule in Chinese>"
}`,
  }
}

export function grammarJudgePrompt(
  questionText: string,
  correctAnswer: string,
  userAnswer: string,
  grammarTag: GrammarTag,
  questionType: 'fill-blank' | 'choice' | 'error-correction',
  uiLang?: UiLang,
): { system: string; user: string } {
  const lang = GRAMMAR_LANG[grammarTag]
  const feedbackLang = uiLang ? UI_LANG_NAME[uiLang] : LANG_NATIVE[lang]

  return {
    system: SYSTEM_JUDGE,
    user: `Judge this grammar exercise answer.

Question: ${questionText}
Correct answer: ${correctAnswer}
Student's answer: ${userAnswer}
Grammar point: ${GRAMMAR_DESC[grammarTag]}
Question type: ${questionType}
Language: ${LANG_NATIVE[lang]}

Evaluation criteria:
- Is the answer grammatically correct for the target grammar point?
- For fill-blank: exact match or valid alternative form?
- For choice: must match the correct option.
- For error-correction: did the student correctly identify and fix the error?

CRITICAL: Respond in ${feedbackLang}. The feedback, suggestion, and errors fields MUST be in ${feedbackLang}, matching the user's interface language.

Return ONLY this JSON shape:
{
  "isCorrect": boolean,
  "score": number (0-10),
  "verdict": "correct" | "partial" | "incorrect",
  "feedback": "<concise explanation in ${feedbackLang}>",
  "suggestion": "<a correct alternative if applicable, or null>",
  "errors": ["<specific error 1>"]
}`,
  }
}

// ---------- 统一导出 ----------

export interface GeneratePromptResult {
  system: string
  user: string
}

/** 根据训练模式获取对应的出题 prompt */
export function getGeneratePrompt(
  category: Category,
  params: {
    languagePair?: LanguagePair
    sourceLang?: LangCode
    grammarTag?: GrammarTag
    questionType?: 'fill-blank' | 'choice' | 'error-correction'
    difficulty?: 1 | 2 | 3
  },
): GeneratePromptResult {
  switch (category) {
    case 'practice':
      if (!params.languagePair) throw new Error('practice 需要 languagePair 参数')
      return practiceGeneratePrompt(params.languagePair, params.difficulty ?? 2)
    case 'paraphrase':
      if (!params.sourceLang) throw new Error('paraphrase 需要 sourceLang 参数')
      return paraphraseGeneratePrompt(params.sourceLang, params.difficulty ?? 2)
    case 'grammar':
      if (!params.grammarTag) throw new Error('grammar 需要 grammarTag 参数')
      return grammarGeneratePrompt(params.grammarTag, params.questionType ?? 'fill-blank', params.difficulty ?? 2)
  }
}

/** 根据训练模式获取对应的判题 prompt */
export function getJudgePrompt(
  category: Category,
  question: {
    questionText: string
    correctAnswer: string
    languagePair?: LanguagePair
    sourceLang?: LangCode
    grammarTag?: GrammarTag
    questionType?: 'fill-blank' | 'choice' | 'error-correction'
    uiLang?: UiLang
  },
  userAnswer: string,
): GeneratePromptResult {
  switch (category) {
    case 'practice':
      if (!question.languagePair) throw new Error('practice 判题需要 languagePair')
      return practiceJudgePrompt(question.questionText, question.correctAnswer, userAnswer, question.languagePair, question.uiLang)
    case 'paraphrase':
      if (!question.sourceLang) throw new Error('paraphrase 判题需要 sourceLang')
      return paraphraseJudgePrompt(question.questionText, question.correctAnswer, userAnswer, question.sourceLang, question.uiLang)
    case 'grammar':
      if (!question.grammarTag || !question.questionType) throw new Error('grammar 判题需要 grammarTag 和 questionType')
      return grammarJudgePrompt(question.questionText, question.correctAnswer, userAnswer, question.grammarTag, question.questionType, question.uiLang)
  }
}
