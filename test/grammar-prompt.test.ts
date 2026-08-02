import assert from 'node:assert/strict'
import test from 'node:test'
import { extractAIContent, extractCompletionContent } from '../server/utils/ai'
import { grammarGeneratePrompt } from '../server/utils/prompts'

test('English grammar prompts explicitly require English exercise content', () => {
  const prompt = grammarGeneratePrompt('present-perfect', 'fill-blank', 2, 'en')

  assert.match(prompt.user, /Generate a single grammar exercise in English/)
  assert.match(prompt.user, /All content \(question text, correct answer\) must be in English/)
  assert.match(prompt.user, /"language": "en"/)
})

test('Japanese grammar prompts explicitly require Japanese exercise content', () => {
  const prompt = grammarGeneratePrompt('te-form', 'fill-blank', 2, 'ja')

  assert.match(prompt.user, /Generate a single grammar exercise in Japanese/)
  assert.match(prompt.user, /All content \(question text, correct answer\) must be in Japanese/)
})

test('AI content extraction accepts OpenAI-compatible content parts', () => {
  assert.equal(
    extractAIContent({ content: [{ type: 'text', text: '{"questionText":"I have eaten."}' }] }),
    '{"questionText":"I have eaten."}',
  )
})

test('AI completion extraction treats missing or whitespace content as empty', () => {
  assert.equal(extractCompletionContent({ choices: [] }), '')
  assert.equal(extractCompletionContent({ choices: [{ message: { content: '   ' } }] }), '')
})
