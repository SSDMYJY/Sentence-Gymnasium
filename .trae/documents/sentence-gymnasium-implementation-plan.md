# Sentence Gymnasium（句子健身房）— 实施计划

> 目标：用 Nuxt 3 (SSR) + Cloudflare Workers + D1 + Prisma + Sidebase Auth + OpenAI 兼容 AI，实现一个多语言（日/英/中）的句子翻译/改写/语法特训练习平台，含信用系统、题目缓存复用、答题历史与统计仪表板。
>
> **执行协议**：严格按下方 10 个步骤顺序推进，**每完成一个步骤即暂停并汇报进度，等待用户确认后再进入下一步**（依据用户原始需求："每一步完成后请说明当前进度，并等待我确认后再继续下一步"）。

---

## 1. 概述

三个练习板块：
- **Practice（练习）**：6 个语言方向互译（ja-en / en-ja / ja-zh / zh-ja / en-zh / zh-en）。
- **Paraphrase（改写）**：源语言为 ja 或 en，同语言改写。
- **Grammar Focus（语法特训）**：按语法点（te-form / present-perfect …）生成填空/选择/改错题。

信用与计费：
- 新用户赠送 **20 Credits**。
- **生成题目时扣 1 Credit**（无论对错，只要发题即扣）——服务端原子校验+扣减，前端不可绕过。
- Credits = 0 时禁止生成新题，提示充值（首期为模拟充值按钮）。

题目缓存复用：
- AI 生成的每道题立即落库（关联生成者，但对所有用户可见）。
- 后续同板块/语言/语法点的请求**优先从库中取**（按 `usedCount` 升序、随机偏移），库中无匹配再实时调用 AI 并保存。
- 每题有 `usedCount`，被做过 +1。

AI 集成：
- 统一 `aiService` 封装 OpenAI 兼容调用，`baseURL` / `model` / `apiKey` 走环境变量（可切 DeepSeek/Claude 兼容端点）。
- 生成与判题都强制 `response_format: json_object` 返回结构化 JSON，前端直接解析。

---

## 2. 当前状态分析

- 工作目录 `/workspace` 为**空**（仅有通用 `.gitignore`）。属于全新项目（greenfield）。
- 用户已确认技术选型：**Cloudflare D1 + Prisma adapter-d1**、**OpenAI 兼容（可切换）**、**邮箱+密码（Sidebase Auth credentials）**、**Cloudflare Workers 生态**。
- 参考站点 `sentencegym.com` 采用健身房隐喻（XP/等级/energy）。本计划**严格遵循用户需求规格**，不引入规格之外的 XP/等级/streak（避免过度设计）；仅保留 Credits、做题数、正确率、各板块统计。

---

## 3. 技术决策（已锁定）

| 关注点 | 决策 | 依据 |
|---|---|---|
| Nuxt 版本 | Nuxt 3（最新稳定，SSR） | 用户指定 |
| Nitro preset | `cloudflare-module` | Cloudflare 2025 统一 Workers；ES module worker，支持静态资源 |
| 本地 D1 绑定 | `nitro-cloudflare-dev`（Nitro plugin） | 在 `nuxt dev` 下经 workerd 提供 `event.context.cloudflare.env.DB` |
| D1 访问 | `event.context.cloudflare.env.DB` | Nitro + nitro-cloudflare-dev 约定 |
| ORM | Prisma + `@prisma/adapter-d1`（`PrismaD1`） | 用户指定 Prisma；D1 适配器 |
| Prisma 生成器 | `prisma-client-js`，`previewFeatures = ["driverAdapters"]` | Prisma 6.16 起 driver adapters GA；保留 flag 兼容更稳 |
| datasource | `provider = "sqlite"`，`url = env("DATABASE_URL")` | D1 是 SQLite 兼容；URL 仅 Prisma CLI 用 |
| 迁移 | `prisma migrate diff --script` 生成 SQL → `wrangler d1 migrations apply --local/--remote` | `prisma migrate deploy` 不支持 D1 |
| Workers Node 兼容 | `compatibility_flags: ["nodejs_compat"]` | Prisma 在 Workers 必需 |
| 认证 | `@sidebase/nuxt-auth` v1.3.x，`authjs` provider，`credentials` + JWT session | 用户指定 Sidebase；JWT 无需服务端 session 表，适配 edge |
| 密码哈希 | `bcryptjs`（纯 JS，Workers 可用） | 原生 `bcrypt` 在 Workers 不可用 |
| AI SDK | `openai` npm 包，`baseURL`/`model`/`apiKey` 走 env | OpenAI 兼容、可切换 |
| 状态管理 | Pinia（客户端 credits/进度镜像，服务端为唯一真源） | 用户指定 |
| UI | Tailwind CSS + Headless UI（Vue 版 `@headlessui/vue`） | 用户指定 |
| 包管理器 | pnpm | 速度与磁盘；可换 npm |
| 配置文件 | `wrangler.jsonc`（优于 toml） | 2025 推荐格式 |

### 关键 gotchas（已在计划中规避）
1. **不要用原生 `bcrypt`** → 用 `bcryptjs`。
2. **`prisma migrate dev/deploy/db push` 对 D1 无效** → 用 `migrate diff --script` + `wrangler d1 migrations apply`。
3. **Workers 上 secret 不在 `process.env`** → 用 `event.context.cloudflare.env.*`，并通过 server plugin 注入 `useRuntimeConfig`。
4. **`PrismaClient` 不要做模块级单例** → 每请求基于 D1 binding 实例化（或缓存于 `event.context`）。
5. **`compatibility_date` 设为近期**（`2025-07-01`）。
6. **Credits 校验+扣减必须在服务端题目生成接口内原子完成**，前端只负责展示。

---

## 4. 项目结构（最终形态）

```
/workspace
├── nuxt.config.ts
├── wrangler.jsonc
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── app.vue
├── .dev.vars                    # 本地 secrets（gitignored）
├── .env.example
├── prisma/
│   └── schema.prisma
├── migrations/                  # wrangler d1 迁移（SQL 文件）
│   └── 0001_init.sql
├── assets/css/main.css
├── layouts/
│   └── default.vue
├── components/
│   ├── AppHeader.vue           # 顶栏：logo + 登录态 + Credits
│   ├── CreditBadge.vue
│   ├── QuestionCard.vue        # 通用题目展示壳
│   ├── FeedbackPanel.vue       # 通用反馈展示
│   └── StatCard.vue
├── composables/
│   └── useCredits.ts           # 客户端 credits 镜像（Pinia）
├── middleware/
│   └── auth.ts                 # 已登录守卫
├── pages/
│   ├── index.vue               # 首页：三板块入口
│   ├── login.vue
│   ├── register.vue
│   ├── dashboard.vue           # 仪表板统计
│   ├── practice.vue
│   ├── paraphrase.vue
│   ├── grammar.vue
│   └── history.vue
├── plugins/
│   └── pinia.client.ts
├── server/
│   ├── api/
│   │   ├── auth/[...].ts       # Sidebase nuxt-auth 入口
│   │   ├── register.post.ts    # 注册
│   │   ├── credits.get.ts      # 查询当前 credits
│   │   ├── credits/recharge.post.ts  # 模拟充值
│   │   ├── stats.get.ts        # 仪表板统计
│   │   ├── history.get.ts      # 答题历史
│   │   ├── questions/
│   │   │   ├── practice.post.ts    # 取/生成 practice 题（扣 credit）
│   │   │   ├── paraphrase.post.ts
│   │   │   └── grammar.post.ts
│   │   └── attempts.post.ts    # 提交答案 → AI 判题 + 落历史 + 更新统计
│   ├── utils/
│   │   ├── prisma.ts           # usePrisma(event)
│   │   ├── auth.ts             # getSessionUser(event) / requireAuth
│   │   ├── ai.ts               # aiService: generate/judge
│   │   ├── prompts.ts          # 各板块 system prompt 模板
│   │   ├── questionService.ts  # getOrGenerateQuestion（缓存优先）
│   │   └── credits.ts          # deductCredit / checkCredits
│   └── plugins/
│       └── 01-env.ts           # 把 cloudflare env 注入 runtimeConfig
├── stores/
│   └── user.ts                 # Pinia: credits/总题数/正确率镜像
└── types/
    └── ai.ts                   # AI 返回 JSON 的 TS 类型
```

---

## 5. 数据库 Schema（`prisma/schema.prisma`）

```prisma
generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["driverAdapters"]
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

model User {
  id              String   @id @default(cuid())
  email           String   @unique
  passwordHash    String
  name            String?
  credits         Int      @default(20)
  totalAttempts   Int      @default(0)
  correctAttempts Int      @default(0)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  attempts        Attempt[]
  generatedQuestions GeneratedQuestion[]

  @@map("users")
}

model GeneratedQuestion {
  id            String   @id @default(cuid())
  category      String   // 'practice' | 'paraphrase' | 'grammar'
  languagePair  String?  // 'ja-en' 等；paraphrase 存源语言如 'ja'
  grammarTag    String?  // 'te-form' 等
  questionText  String   // 展示文本
  correctAnswer String   // 标准答案
  options       String?  // JSON 字符串（选择题）；SQLite 无原生 Json，用 String
  extraData     String?  // JSON 字符串（改写原文、语法说明等）
  usedCount     Int      @default(0)
  createdAt     DateTime @default(now())
  generatedById String?
  generatedBy   User?    @relation(fields: [generatedById], references: [id])
  attempts      Attempt[]

  @@index([category, languagePair, grammarTag])
  @@map("questions")
}

model Attempt {
  id         String   @id @default(cuid())
  userId     String
  questionId String
  userAnswer String
  isCorrect  Boolean
  feedback   String?  // JSON 字符串
  createdAt  DateTime @default(now())
  user       User     @relation(fields: [userId], references: [id])
  question   GeneratedQuestion @relation(fields: [questionId], references: [id])

  @@index([userId, createdAt])
  @@map("attempts")
}
```

> 说明：SQLite/D1 没有原生 `Json` 类型，Prisma 在 D1 适配器下对 `Json` 支持有限，故 `options`/`extraData`/`feedback` 用 `String?` 存 JSON 字符串，代码层 `JSON.parse/stringify`。`@@map` 给表加复数小写名，符合 SQL 惯例。

仪表板各板块统计通过 `Attempt` join `GeneratedQuestion.category` 用 `groupBy` 计算，无需冗余计数字段。

---

## 6. 关键服务端工具函数（贯穿后续步骤）

### `server/utils/prisma.ts`
```ts
import { PrismaClient } from '@prisma/client'
import { PrismaD1 } from '@prisma/adapter-d1'
import type { H3Event } from 'h3'

export function usePrisma(event: H3Event): PrismaClient {
  if ((event.context as any)._prisma) return (event.context as any)._prisma
  const binding = event.context.cloudflare?.env?.DB
  if (!binding) throw createError({ statusCode: 500, statusMessage: 'D1 binding missing' })
  const adapter = new PrismaD1(binding)
  ;(event.context as any)._prisma = new PrismaClient({ adapter })
  return (event.context as any)._prisma
}
```

### `server/utils/ai.ts`
```ts
import OpenAI from 'openai'
import type { H3Event } from 'h3'

export function useAI(event: H3Event) {
  const env = event.context.cloudflare?.env
  return new OpenAI({
    apiKey: env?.AI_API_KEY ?? '',
    baseURL: env?.AI_BASE_URL ?? 'https://api.openai.com/v1',
  })
}

export async function aiJSON<T>(event: H3Event, system: string, user: string): Promise<T> {
  const client = useAI(event)
  const model = event.context.cloudflare?.env?.AI_MODEL ?? 'gpt-4o-mini'
  const res = await client.chat.completions.create({
    model,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ],
  })
  return JSON.parse(res.choices[0].message.content ?? '{}') as T
}
```

### `server/utils/questionService.ts`（步骤 8 完善）
```ts
// 伪代码：步骤 5 先实现"只生成"分支；步骤 8 加入"缓存优先"分支
export async function getOrGenerateQuestion(event, params) {
  const prisma = usePrisma(event)
  // 步骤 8 注入：先按 category+languagePair+grammarTag 查库，usedCount 升序 + 随机
  // const cached = await prisma.generatedQuestion.findMany({ where, orderBy: {usedCount:'asc'}, take: 10 })
  // if (cached.length) return pickRandom(cached)
  // 步骤 5：直接调 AI 生成并落库
  const ai = await aiJSON(event, buildPrompt(params), buildUser(params))
  const q = await prisma.generatedQuestion.create({ data: { ...ai, generatedById: userId } })
  return q
}
```

---

## 7. 实施步骤（10 步，每步完成后暂停汇报）

### 步骤 1：项目骨架 + Tailwind + Prisma + D1 接通

**What**：搭建可跑的 Nuxt 3 SSR 项目，部署目标 Cloudflare Workers，本地 D1 经 `nitro-cloudflare-dev` 接通，Prisma 客户端能在 server route 里查到 D1。

**Why**：所有后续功能的地基；先把"dev server → D1 binding → Prisma"链路打通，避免后期返工。

**How / 文件**：
- `package.json`：deps = `nuxt`, `@sidebase/nuxt-auth`, `@pinia/nuxt`, `pinia`, `@prisma/client`, `@prisma/adapter-d1`, `openai`, `bcryptjs`, `@headlessui/vue`；devDeps = `prisma`, `wrangler`, `nitro-cloudflare-dev`, `@cloudflare/workers-types`, `tailwindcss`, `postcss`, `autoprefixer`。
- `nuxt.config.ts`：`modules: ['@nuxtjs/tailwindcss','@pinia/nuxt','@sidebase/nuxt-auth']`；`nitro.preset='cloudflare-module'`；`nitro.plugins:['nitro-cloudflare-dev']`；`nitro.cloudflare.configPath='./wrangler.jsonc'`；`compatibilityDate:'2025-07-01'`；`runtimeConfig` 占位。
- `wrangler.jsonc`：`name`、`main:'./.output/server/index.mjs'`、`compatibility_date:'2025-07-01'`、`compatibility_flags:['nodejs_compat']`、`assets:{directory:'./.output/public',binding:'ASSETS'}`、`d1_databases:[{binding:'DB',database_name:'sentence_gym',database_id:'<占位>',migrations_dir:'migrations'}]`。
- `prisma/schema.prisma`：先放 `User` 一张表（最小），用于验证链路。
- `migrations/0001_init.sql`：由 `npx prisma migrate diff --from-empty --to-schema-datamodel ./prisma/schema.prisma --script --output ./migrations/0001_init.sql` 生成。
- `.dev.vars` / `.env.example`：`AI_API_KEY`、`AI_BASE_URL`、`AI_MODEL`、`DATABASE_URL="file:./prisma/dev.db"`、`NUXT_SECRET`、`AUTH_SECRET`。
- `tailwind.config.ts` + `assets/css/main.css` + `app.vue`（首页占位）。
- 临时验证接口 `server/api/health.get.ts`：`return { ok:true, users: await prisma.user.count() }`。

**Verify**：
- `pnpm install` 成功。
- `npx wrangler d1 migrations apply sentence_gym --local` 成功。
- `pnpm dev` → `GET /api/health` 返回 `{ok:true, users:0}`。
- 改 schema 重跑 migrate diff → 再次 apply --local 生效。

**完成后暂停汇报**。

---

### 步骤 2：用户认证（注册/登录）

**What**：实现邮箱+密码注册、登录、登出、会话保持、路由守卫。

**Why**：信用与做题历史都依赖用户身份。

**How / 文件**：
- `prisma/schema.prisma`：补全 `User` 全字段（含 `passwordHash`、`credits@default(20)`、`totalAttempts`、`correctAttempts`）。重新 `migrate diff` → `0002_users_fields.sql` → apply。
- `nuxt.config.ts`：`auth.baseUrl='/api/auth'`、`auth.provider.type='authjs'`、`secret` 走 `AUTH_SECRET`。
- `server/api/auth/[...].ts`：`NuxtAuthHandler`，`session:{strategy:'jwt'}`，`providers:[CredentialsProvider({ authorize })]`。
- `server/utils/auth.ts`：`bcryptjs.compare/hash`；`requireAuth(event)` 用 `getServerSession` 取用户。
- `server/api/register.post.ts`：校验邮箱唯一 → `bcryptjs.hash` → `prisma.user.create({data:{email,passwordHash,credits:20}})`。
- `pages/login.vue`、`pages/register.vue`：表单 + `useAuth().signIn('credentials',{...})` / 调 `/api/register`。
- `middleware/auth.ts`：未登录跳 `/login`。
- `layouts/default.vue` + `AppHeader.vue`：登录态展示。

**Verify**：注册 → 自动登录 → 刷新仍登录 → 登出 → 访问 `/dashboard` 被重定向到 `/login`。数据库 `users` 表有一条记录，`passwordHash` 已哈希。

**完成后暂停汇报**。

---

### 步骤 3：信用模型 + 仪表板统计（含初始数据）

**What**：仪表板展示剩余 Credits、总做题数、正确率、各板块做题数与正确率；`/api/credits`、`/api/stats`；Pinia 镜像。

**Why**：用户能感知账户状态；为后续做题流程提供 stats 更新入口。

**How / 文件**：
- `stores/user.ts`：Pinia store，`credits`、`totalAttempts`、`correctAttempts`、`fetch()` 调 `/api/credits`、`/api/stats`。
- `server/api/credits.get.ts`：`requireAuth` → 返回 `{credits, totalAttempts, correctAttempts}`。
- `server/api/stats.get.ts`：`requireAuth` → 用 `prisma.attempt.groupBy({by:['questionId'],...})` 实际是按 category 聚合（需 join），改用 `findMany` 取用户 attempts 再在服务端按 `question.category` 分桶，返回 `{ total, correct, perBoard:{practice:{total,correct}, paraphrase:{...}, grammar:{...}} }`。（此步 attempts 表暂空，返回 0 即可，验证聚合逻辑正确。）
- `pages/dashboard.vue`：`StatCard` 组件展示总数/正确率/Credits + 三个板块卡片。
- `server/api/credits/recharge.post.ts`：模拟充值 +20（仅演示，无支付）。
- `composables/useCredits.ts`：封装对 store 的便捷访问。

**Verify**：登录后 `/dashboard` 显示 Credits=20、各统计=0；点"模拟充值"→ Credits=40；刷新页面数据持久。

**完成后暂停汇报**。

---

### 步骤 4：AI 服务封装（生成题目 & 判题）

**What**：`server/utils/ai.ts` + `server/utils/prompts.ts` + `types/ai.ts`，封装生成与判题两类调用，强制 JSON 返回；加日志。

**Why**：三个板块复用同一 AI 通道，先抽象好。

**How / 文件**：
- `types/ai.ts`：定义 `GeneratePracticeResult`、`GenerateParaphraseResult`、`GenerateGrammarResult`、`JudgeResult` 接口。
- `server/utils/prompts.ts`：6 个语言对的翻译生成 prompt、改写生成 prompt、语法生成 prompt、判题 prompt（每个都明确"输出 JSON 字段"）。
- `server/utils/ai.ts`：`useAI(event)` + `aiJSON<T>(event, system, user)`（见第 6 节）。
- `server/utils/aiLogger.ts`：简单 `console.log`（Workers 上落到 `observability`），记录模型、耗时、token 估算。
- 临时接口 `server/api/_dev/ai-test.post.ts`（仅 dev）：传一段文本调判题，验证 JSON 解析。

**Verify**：临时接口传 `question="猫が寝ている。"`、`correctAnswer="The cat is sleeping."`、`userAnswer="A cat is sleeping."` → 返回 `{isCorrect:..., explanation:..., suggestion:..., correctAnswer:...}` 且可被 `JSON.parse`。

**完成后暂停汇报**。

---

### 步骤 5：Practice 板块完整流程

**What**：用户选语言方向 → 点"生成题目"扣 1 Credit → AI 生成翻译题并落库 → 展示 → 提交 → AI 判题 → 落 Attempt + 更新统计 → 展示反馈。

**Why**：第一个端到端板块，确立后续两板块可复用的范式。

**How / 文件**：
- `server/api/questions/practice.post.ts`：
  1. `requireAuth` → 取 userId。
  2. `checkCredits`（credits>0）→ 否则 402。
  3. `deductCredit`（原子：`update where id && credits>0 { decrement:1 }`，affected=0 则 402）。
  4. 调 `aiJSON` 生成题 → `prisma.generatedQuestion.create`（含 `generatedById`）。
  5. 返回 `{questionId, questionText, languagePair}`（不返回 `correctAnswer`，防作弊）。
  - **注**：此步 `getOrGenerateQuestion` 仅"生成"分支；缓存优先在步骤 8 加入。
- `server/api/attempts.post.ts`：
  1. `requireAuth` → 取 userId。
  2. 入参 `{questionId, userAnswer}`。
  3. 取题目（含 `correctAnswer`、`category`、`languagePair`、`extraData`）。
  4. 调 `aiJSON` 判题（传 question/correctAnswer/userAnswer/languagePair）。
  5. **事务**：`prisma.$transaction([ create Attempt, update Question.usedCount+1, update User.totalAttempts+1 且若 correct 则 correctAttempts+1 ])`。
  6. 返回 `{isCorrect, explanation, suggestion, correctAnswer?}`。
- `pages/practice.vue`：方向选择器 + "生成新题"按钮（显示 Credits）+ 题目卡 + 输入框 + 提交 + `FeedbackPanel`；Credits=0 时按钮禁用并提示。
- `components/QuestionCard.vue`、`FeedbackPanel.vue`：通用，后续板块复用。

**Verify**：选 ja-en → 生成题（Credits 20→19）→ 提交答案 → 看到对/错反馈与解释 → 刷新 `/dashboard` 总题数=1、正确率正确、practice 板块计数+1；数据库 `questions` 与 `attempts` 各增一条。

**完成后暂停汇报**。

---

### 步骤 6：Paraphrase 板块完整流程

**What**：源语言（ja/en）→ AI 生成原句 → 用户同语言改写 → AI 评价（原意/自然度/建议/示范）→ 落库与统计。

**How / 文件**：
- `server/utils/prompts.ts`：补改写生成 prompt（输出 `{question, correctAnswer}`，其中 `correctAnswer` 为"参考改写"）与改写判题 prompt（输出 `{isCorrect, explanation, suggestion, correctAnswer}`，`isCorrect` 表示是否保留原意且自然）。
- `server/api/questions/paraphrase.post.ts`：同 practice 模式（扣 credit → 生成 → 落库，`category='paraphrase'`，`languagePair` 存源语言如 `'ja'`，原句存 `extraData.originalText`）。
- 复用 `server/api/attempts.post.ts`（按 `question.category` 选对应判题 prompt）。
- `pages/paraphrase.vue`：源语言选择 + 生成 + 原句展示 + 改写输入 + 提交 + 反馈。

**Verify**：选 en → 生成原句 → 改写提交 → 反馈含原意保留/自然度评价 → dashboard paraphrase 计数+1。

**完成后暂停汇报**。

---

### 步骤 7：Grammar Focus 板块完整流程

**What**：选语法点（或 AI 随机选）→ AI 生成填空/选择/改错题 → 作答 → AI 解析语法点+判题+例句 → 落库统计。

**How / 文件**：
- `server/utils/prompts.ts`：语法生成 prompt（输出 `{question, correctAnswer, options?, grammarTag}`，题型在 `extraData.type` 标 `fillblank|choice|correct`）；语法判题 prompt（输出 `{isCorrect, explanation, suggestion, correctAnswer, extraExamples:[]}`）。
- `server/api/questions/grammar.post.ts`：入参 `{grammarTag?}`（空则 prompt 让 AI 自选并回填 `grammarTag`）；`category='grammar'`，`languagePair` 存目标语言（如 `'ja'` for te-form）。
- `pages/grammar.vue`：语法点下拉（预设 te-form / present-perfect / n5-grammar 等若干）+ "随机"按钮 + 生成 + 题目卡（选择题渲染 `options`）+ 提交 + 反馈（含额外例句）。

**Verify**：选 te-form → 生成填空/选择题 → 作答 → 反馈含语法解析与例句 → dashboard grammar 计数+1。

**完成后暂停汇报**。

---

### 步骤 8：题目缓存逻辑（优先查库）

**What**：把 `getOrGenerateQuestion` 改造为**缓存优先**：先按 `category+languagePair+grammarTag` 查库，按 `usedCount` 升序取若干条随机选一条；无匹配再调 AI 生成并落库。三板块统一受益。

**Why**：节省 AI 成本、降低延迟、避免重复题。

**How / 文件**：
- `server/utils/questionService.ts`（重写）：
  ```ts
  export async function getOrGenerateQuestion(event, params) {
    const prisma = usePrisma(event)
    const where = { category: params.category,
                    languagePair: params.languagePair ?? null,
                    grammarTag: params.grammarTag ?? null }
    const pool = await prisma.generatedQuestion.findMany({
      where, orderBy: { usedCount: 'asc' }, take: 20 })
    if (pool.length) return pool[Math.floor(Math.random()*pool.length)]
    // 落到 AI 生成 + create（同步骤 5 的生成分支）
    ...
  }
  ```
- 改写三个 `questions/*.post.ts` 改为调用 `getOrGenerateQuestion`（扣 credit 仍在外层）。
- 确认 `usedCount` 仅在 `attempts.post.ts` 事务里 +1（步骤 5 已做），缓存命中不再额外加。
- 加一个 dev 接口 `server/api/_dev/cache-stats.get.ts`：返回各 category/languagePair 的题目数，便于观察缓存命中。

**Verify**：连续两次选 ja-en 生成题 → 第二次大概率返回库中已有题（同题）；`cache-stats` 显示 practice/ja-en 计数=1；AI 调用日志只在第一次出现。注：缓存命中时仍扣 1 Credit（生成题目即扣费的规则不变）。

**完成后暂停汇报**。

---

### 步骤 9：答题历史记录 + 统计更新完善

**What**：`/history` 页面分页展示用户答题记录（题目、答案、对错、反馈、时间）；仪表板统计接真实数据并验证事务一致性。

**How / 文件**：
- `server/api/history.get.ts`：`requireAuth` → `prisma.attempt.findMany({where:{userId}, include:{question:true}, orderBy:{createdAt:'desc'}, take:50, skip})` 支持分页。
- `pages/history.vue`：列表 + 分页 + 点击展开反馈 JSON。
- 复核 `server/api/stats.get.ts`：用 `findMany({include:{question:{select:{category:true}}}})` 在服务端按 category 聚合，返回各板块 total/correct。
- 复核 `server/api/attempts.post.ts` 事务：确保 `totalAttempts`/`correctAttempts` 与 `Attempt` 行数始终一致（事务原子）。
- 加一个一致性检查 dev 接口 `server/api/_dev/consistency.get.ts`：对比 `User.totalAttempts` 与 `Attempt` 实际行数。

**Verify**：做 5 题（对错混合）→ `/history` 显示 5 条 → `/dashboard` 总数=5、正确率与历史一致、各板块计数正确；一致性检查接口返回 `mismatch:false`。

**完成后暂停汇报**。

---

### 步骤 10：UI/UX 完善 + 错误处理 + 加载状态

**What**：统一视觉（健身/训练主题，但克制）、骨架屏/加载态、错误提示 toast、Credits=0 引导、移动端响应式、AI 调用失败重试/降级。

**How / 文件**：
- `tailwind.config.ts`：定主题色板（深色为主 + 活力强调色，呼应"健身房"但不抄袭 sentencegym.com）。
- 全局：`AppHeader` 优化、`CreditBadge` 动画、按钮 loading 态、空状态插画（用 emoji/SVG，不用外部图）。
- `composables/useToast.ts`：轻量 toast（Headless UI Dialog/Transition）。
- 各 `pages/*.vue`：加 `pending`/`error` 状态；AI 失败时 toast 并允许重试；Credits=0 时显眼引导到 `/dashboard` 充值。
- `error.vue`：全局错误页。
- 移除所有 `_dev/*` 临时接口（或加环境守卫，仅 `NODE_ENV==='development'` 暴露）。
- README 不创建（遵循"不主动建文档"）。

**Verify**：全流程在移动端窄屏可用；断网/AI 报错时优雅提示；Credits=0 时按钮禁用且引导清晰；无 console error。

**完成后暂停汇报 + 整体交付总结**。

---

## 8. 假设与决策

1. **包管理器**：默认 `pnpm`（用户可指定 npm/yarn）。
2. **D1 database_id**：步骤 1 用占位 `<to-be-filled>`；真实部署需 `npx wrangler d1 create sentence_gym` 取回填入 `wrangler.jsonc`。本地 `--local` 不需要真实 id。
3. **AI 默认模型**：`gpt-4o-mini`（OpenAI 官方）。切 DeepSeek：`AI_BASE_URL=https://api.deepseek.com`、`AI_MODEL=deepseek-chat`。切 Claude 兼容网关同理。
4. **密码哈希**：`bcryptjs`，cost=10（Workers 上够用且不太慢）。
5. **Credits 扣费时机**：题目生成接口内原子扣减（生成即扣），不在提交时扣。与需求"只要生成题目即扣费"一致。
6. **防作弊**：生成接口不返回 `correctAnswer`；判题以库中 `correctAnswer` + AI 判断为准。
7. **`options`/`extraData`/`feedback` 存储**：用 `String?` 存 JSON（D1/SQLite 无原生 Json），代码层 parse/stringify。
8. **统计聚合**：不维护冗余计数字段，运行时按 `Attempt` join `Question.category` 聚合，避免一致性问题。
9. **不引入 XP/等级/streak**：参考站有但用户规格未要求，避免过度设计。
10. **`_dev/*` 接口**：开发期辅助验证，步骤 10 加守卫或移除。
11. **不创建 README/文档文件**：遵循"不主动建文档"指令。
12. **暂停节奏**：每步骤完成 → 汇报 → 等用户确认 → 下一步。用户随时可调整方向。

---

## 9. 验证总览（端到端）

最终交付后，端到端冒烟用例：
1. 注册新用户 → 自动登录 → Credits=20。
2. `/practice` 选 ja-en → 生成题（Credits 19）→ 答对 → 反馈鼓励 + 语法贴士 → dashboard practice 1/1=100%。
3. 再生成 ja-en → 命中缓存（同题，AI 未再调用）→ Credits 18 → 答错 → 反馈给正确答案与建议 → practice 1/2=50%。
4. `/paraphrase` 选 en → 生成原句 → 改写 → 评价。
5. `/grammar` 选 te-form → 生成选择题 → 作答 → 语法解析+例句。
6. `/history` 看到全部 4 条记录。
7. `/dashboard` 总数=4、各板块计数正确、正确率正确。
8. 模拟充值 → Credits +20。
9. 移动端窄屏全流程可用；AI 异常时优雅降级。
10. `wrangler deploy` 前本地 `pnpm build` 通过；`--remote` 迁移可应用。
