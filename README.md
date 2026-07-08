# Sentence Gymnasium · 句子健身房

[![Nuxt](https://img.shields.io/badge/Nuxt-4-00DC82?logo=nuxt)](https://nuxt.com)
[![Cloudflare Workers](https://img.shields.io/badge/Cloudflare%20Workers-deployed-F38020?logo=cloudflare)](https://workers.cloudflare.com)
[![Prisma](https://img.shields.io/badge/Prisma-D1-2D3748?logo=prisma)](https://prisma.io)
[![License](https://img.shields.io/badge/license-MIT-blue)](#license)

**AI 驱动的多语言句子训练平台。**  
翻译、改写、语法特训——三种训练方式，AI 出题、AI 判题、题目入库复用，形成完整闭环。

> **句子健身房 · 把每一句练到本能**  
> _Drill every sentence until it's instinct._

---

## 目录

- [概述](#概述)
- [功能特性](#功能特性)
- [技术栈](#技术栈)
- [快速开始](#快速开始)
  - [前置要求](#前置要求)
  - [安装](#安装)
  - [环境变量](#环境变量)
  - [数据库](#数据库)
  - [开发](#开发)
- [三种训练模式](#三种训练模式)
  - [① Practice 翻译练习](#-practice-翻译练习)
  - [② Paraphrase 同义改写](#-paraphrase-同义改写)
  - [③ Grammar Focus 语法特训](#-grammar-focus-语法特训)
- [训练闭环](#训练闭环)
- [项目结构](#项目结构)
- [部署](#部署)
- [多语言支持](#多语言支持)
- [贡献](#贡献)
- [许可](#许可)

---

## 概述

Sentence Gymnasium 是一个面向多语言学习者的在线训练平台。用户可以通过**翻译练习**、**同义改写**和**语法特训**三种模式，在日常场景中系统性地提升语言能力。

平台的每一道题目均由 AI 动态生成，作答后 AI 即时判题并提供详细的语法、用词和自然度反馈。优质题目自动入库，相同维度的题目可被复用，训练效率随使用量递增。

支持 **简体中文**、**繁体中文**、**英文** 和 **日文** 界面，训练覆盖 **日语 ↔ 英语 ↔ 中文** 之间的互译与改写。

---

## 功能特性

- **🤖 AI 出题 + AI 判题** — 基于 OpenAI 兼容接口，智能出题与多维反馈（正确性、自然度、语法）
- **🧠 三种训练模式** — 翻译练习 / 同义改写 / 语法特训，覆盖语言学习的核心维度
- **🗂️ 题目复用** — 所有生成题目入库，相同语言对 + 难度 + 场景下优先复用
- **📊 等级与经验系统** — 每次训练积累经验值，升级解锁新权益，连续训练保持连胜
- **🏆 排行榜** — 按做题总数和正确率排名
- **👤 用户认证** — 基于 JWT 的手写认证（jose + bcryptjs），无需第三方认证服务
- **🌐 多语言界面** — 简体中文 / 繁体中文 / 英文 / 日文，带 URL 前缀与 Cookie 记忆
- **⚡ Credits 经济系统** — 每次训练消耗 1 Credits，新用户赠送 20 Credits
- **📱 响应式设计** — 基于 Nuxt UI + Tailwind CSS，深色主题
- **☁️ Cloudflare 原生部署** — 全站运行在 Cloudflare Workers + D1，边缘友好

---

## 技术栈

| 层级 | 技术 |
|------|------|
| **前端** | Nuxt 4, Vue 3, Nuxt UI (v4), Pinia, Tailwind CSS, Headless UI |
| **后端** | Nitro (Nuxt 服务引擎), H3 |
| **部署环境** | Cloudflare Workers (ES Module) |
| **数据库** | Cloudflare D1 (SQLite) via Prisma + `@prisma/adapter-d1` |
| **AI** | OpenAI 兼容 API (可配置为 DeepSeek / GPT 等) |
| **认证** | 手写 JWT — `jose` (JWT 签发/验证) + `bcryptjs` (密码哈希) |
| **国际化** | `@nuxtjs/i18n` v10 — 策略: prefix, 4 个语言包 |
| **构建工具** | TypeScript, Wrangler CLI |

---

## 快速开始

### 前置要求

- [Node.js](https://nodejs.org) >= 18
- [pnpm](https://pnpm.io)（推荐）或 npm / yarn
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/)（本地 D1 开发与部署）
- [Cloudflare 账号](https://dash.cloudflare.com)（用于 D1 数据库和 Workers 部署）

### 安装

```bash
# 克隆仓库
git clone https://github.com/SSDMYJY/Sentence-Gymnasium.git
cd Sentence-Gymnasium

# 安装依赖
pnpm install
```

### 环境变量

在项目根目录创建 `.dev.vars` 文件（用于本地开发）：

```env
AI_API_KEY=your_openai_compatible_api_key
AUTH_SECRET=your_jwt_signing_secret_at_least_32_chars
```

> `AI_BASE_URL` 和 `AI_MODEL` 默认值可在 `wrangler.toml` 的 `[vars]` 中覆盖。

### 数据库

Sentence Gymnasium 使用 Cloudflare D1 作为数据库。本地开发使用 D1 的本地模拟。

```bash
# 初始化数据库（从 Prisma schema 生成迁移 SQL）
pnpm db:migrate:generate

# 应用到本地 D1
pnpm db:apply:local

# 生成 Prisma Client
pnpm db:generate
```

> 生产环境：创建远程 D1 数据库后运行 `pnpm db:apply:remote` 并更新 `wrangler.toml` 中的 `database_id`。

### 开发

```bash
# 启动开发服务器（带本地 D1 + Cloudflare 环境模拟）
pnpm dev
```

开发服务器默认运行在 `http://localhost:3000`。`nitro-cloudflare-dev` 模块会自动读取 `wrangler.toml` 和 `.dev.vars`。

---

## 三种训练模式

### ① Practice 翻译练习

**Bidirectional Translation** 双向互译训练，覆盖 4 个语言方向：

| 语言对 | 示例 |
|--------|------|
| `ja → en` | 日本語の文を英語に翻訳 |
| `en → ja` | Translate English to Japanese |
| `zh → ja` | 中文译日文 |
| `zh → en` | 中文译英文 |

- 支持 3 级难度（daily / fluent / professional）
- 内置多组生活场景（旅行、职场、科技等）
- 支持随机出题与 AI 动态生成

### ② Paraphrase 同义改写

在**同一语言内**换一种说法保留原意。源语言可选日语或英语。

- AI 评估**原意保留度**与**自然度**
- 适合中高级学习者训练表达能力
- 提供改写要点 hint 引导思考

### ③ Grammar Focus 语法特训

针对特定语法点的专项练习。支持的语法点：

| 标签 | 语言 | 说明 |
|------|------|------|
| `te-form` | 日语 | て形 |
| `particles` | 日语 | 助词 |
| `honorifics` | 日语 | 敬语 |
| `present-perfect` | 英语 | 现在完成时 |
| `passive` | 英语 | 被动语态 |
| `conditionals` | 英语 | 条件句 |
| `relative-clauses` | 英语 | 关系从句 |

- 三种题型：**填空 / 选择 / 改错**
- 每题附带语法点说明

---

## 训练闭环

一次完整的训练包含四个步骤：

```
① 出题 (Generate)
   AI 动态生成题目并写入数据库，
   相同维度优先复用已有题目。

② 作答 (Answer)
   用户在界面上作答（翻译/改写/选择）。

③ 判题 (Judge)
   AI 比对标准答案与用户作答，
   从正确性、自然度、语法三个维度评分。

④ 反馈 (Feedback)
   展示判题结果、错误分析、改进建议和示范句。
   数据计入用户统计与历史记录。
```

---

## 项目结构

```text
Sentence-Gymnasium/
├── app.config.ts              # 应用配置（Nuxt UI 主题色等）
├── app.vue                    # Nuxt 根组件
├── nuxt.config.ts             # Nuxt 主配置（模块、i18n、Nitro 等）
├── wrangler.toml              # Cloudflare Workers 配置
├── package.json
├── pnpm-workspace.yaml
├── tsconfig.json
│
├── assets/
│   └── css/main.css           # Tailwind + Nuxt UI 样式入口
│
├── components/                # Vue 组件
│   ├── AnswerCard.vue         # 通用答题卡片（三种模式复用）
│   ├── DifficultyLevelSwitcher.vue
│   ├── LanguageSwitcher.vue
│   ├── ScenarioDropdown.vue
│   └── EnglishOnlyTips.vue
│
├── composables/
│   └── useToast.ts
│
├── i18n/locales/              # 四个语言包
│   ├── zh-hans.json
│   ├── zh-hant.json
│   ├── en.json
│   └── ja.json
│
├── layouts/
│   └── default.vue            # 全局布局（导航栏 + 底部）
│
├── middleware/
│   ├── auth.ts                # 路由守卫（需登录的页面）
│   └── home.global.ts         # 全局中间件（已登录用户跳转仪表板）
│
├── pages/                     # 页面路由
│   ├── index.vue              # 首页营销页面
│   ├── dashboard.vue          # 用户仪表板（统计/等级/快捷入口）
│   ├── practice.vue           # 翻译练习
│   ├── paraphrase.vue         # 同义改写
│   ├── grammar.vue            # 语法特训
│   ├── history.vue            # 训练记录
│   ├── ranking.vue            # 排行榜
│   ├── login.vue              # 登录
│   ├── register.vue           # 注册
│   ├── health.vue             # 链路自检页面
│   ├── privacy.vue            # 隐私政策
│   └── terms.vue              # 服务条款
│
├── plugins/
│   ├── auth.client.ts         # 客户端首屏会话恢复
│   └── auth.server.ts         # SSR 阶段会话预填充（绕过 $fetch 直接调用 utils）
│
├── prisma/
│   ├── schema.prisma          # 数据模型：User / GeneratedQuestion / Attempt
│   └── prisma/                #（Prisma CLI 工作目录）
│
├── migrations/                # D1 迁移 SQL
│   ├── 0001_init.sql
│   ├── 0002_streak.sql
│   └── 0003_level.sql
│
├── public/                    # 静态资源（logo.svg 等）
│
├── server/
│   ├── api/
│   │   ├── health.get.ts      # 健康检查（D1 连通性验证）
│   │   ├── history.get.ts     # 训练记录（分页 + 筛选）
│   │   ├── ranking.get.ts     # 排行榜
│   │   ├── stats.get.ts       # 仪表板统计
│   │   ├── auth/              # 认证接口
│   │   │   ├── login.post.ts
│   │   │   ├── logout.post.ts
│   │   │   ├── register.post.ts
│   │   │   └── session.get.ts
│   │   ├── credits/
│   │   │   └── recharge.post.ts
│   │   ├── practice/
│   │   │   ├── generate.post.ts
│   │   │   └── judge.post.ts
│   │   ├── paraphrase/
│   │   │   ├── generate.post.ts
│   │   │   └── judge.post.ts
│   │   ├── grammar/
│   │   │   ├── generate.post.ts
│   │   │   └── judge.post.ts
│   │   └── ai/
│   │       └── health.get.ts  # AI API 连通性检查
│   ├── plugins/
│   │   └── cloudflare-env.ts  # 将 Cloudflare env vars 注入 runtimeConfig
│   ├── types/
│   │   └── ai.ts              # AI 类型定义（Category / Question / JudgeResult 等）
│   └── utils/
│       ├── ai.ts              # AI 服务封装（OpenAI SDK + edge fetch）
│       ├── auth.ts            # JWT 签发/验证 + cookie 管理
│       ├── prisma.ts          # 请求级 PrismaClient 工厂
│       └── prompts.ts         # 三种模式的 AI 出题/判题 prompt 模板
│
├── stores/
│   └── user.ts                # Pinia 用户状态管理
│
└── utils/
    └── practice-config.ts     # 共享配置（难度/场景定义 + 辅助函数）
```

---

## 部署

### 部署到 Cloudflare Workers

```bash
# 1. 创建远程 D1 数据库
npx wrangler d1 create sentence_gym
# → 复制输出的 database_id 到 wrangler.toml

# 2. 应用数据库迁移
pnpm db:apply:remote

# 3. 设置 Secrets
npx wrangler secret put AI_API_KEY
npx wrangler secret put AUTH_SECRET

# 4. 构建并部署
pnpm deploy
```

> 部署前请确保 `wrangler.toml` 中的 `database_id` 已更新为远程 D1 数据库的 ID。

---

## 多语言支持

平台内置 4 种界面语言，每种语言有独立的 URL 前缀：

| 代码 | 语言 | URL 前缀 |
|------|------|----------|
| `zh-hans` | 简体中文 | `/zh-hans/...` |
| `zh-hant` | 繁體中文 | `/zh-hant/...` |
| `en` | English | `/en/...` |
| `ja` | 日本語 | `/ja/...` |

- 首次访问 `/` 时自动根据浏览器偏好语言重定向
- 语言选择通过 Cookie 记忆
- SSR 阶段禁用服务端 i18n 检测（`nitroContextDetection: false`），避免 Cloudflare Workers 无状态模型下的竞态问题

---

## 数据模型

核心实体：

- **User** — 用户信息、积分、经验值、等级、连胜、统计
- **GeneratedQuestion** — AI 生成的题目（三种模式统一表，含语言对/语法标签/选项等）
- **Attempt** — 用户作答记录（关联题目与用户，含判题反馈）

> D1 基于 SQLite，JSON 字段以 String 存储，在代码层用 `JSON.parse` / `JSON.stringify` 处理。

---

## 贡献

欢迎提交 Issue 和 Pull Request。

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/amazing-feature`)
3. 提交改动 (`git commit -m 'feat: add some amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 提交 Pull Request

---

## 许可

本项目基于 MIT 许可协议。详见 [LICENSE](./LICENSE) 文件。

---

<p align="center">
  <strong>Sentence Gymnasium</strong> · © 2026 MFJip612<br/>
  <sub>Built with Nuxt, Cloudflare Workers, D1 & Prisma</sub>
</p>