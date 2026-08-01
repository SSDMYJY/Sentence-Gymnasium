# Sentence Gymnasium 统一前端设计规范

> 版本：1.0 · 生效日期：2026-08-01
> 适用范围：全站 14 个 `pages/*.vue`、6 个 `components/*.vue`、`layouts/default.vue`
> 技术栈：Nuxt 4 + @nuxt/ui v4 + Tailwind v4 + @iconify-json/lucide
> 单一来源：[assets/css/main.css](file:///workspace/assets/css/main.css)

---

## 0. 设计哲学

| 原则 | 说明 |
|---|---|
| **锐角编辑风** | 所有容器/控件圆角为 0；`--ui-radius: 0rem` 强制 Nuxt UI 锐角。仅 SVG 进度环、状态圆点、spinner 等物理圆形可使用 `rounded-full`。 |
| **明暗双主题** | 所有颜色经语义 Token 引用运行时 CSS 变量，主题切换自动响应，禁止在模板层硬编码 `text-stone-*` / `bg-white/5` / `border-white/10` 等绝对值。 |
| **单一来源** | Token 与组件类只在 `main.css` 定义一次，模板层只消费，不重复组合。 |
| **游戏化例外** | 等级徽章 emoji（🌱📚⚡🔥💎👑🏆）、streak 庆祝 toast 的 🔥 属情感化文案，保留；功能图标一律用 lucide。 |

---

## 1. 主题色彩系统

### 1.1 主色（Accent）

| Token | 暗色值 | 亮色值 | 用途 |
|---|---|---|---|
| `--accent-color` | `#f59e0b`（amber-500） | `#d97706`（amber-600） | 主按钮底色、聚焦环、链接强调 |
| `--accent-soft` | `#fbbf24`（amber-400） | `#f59e0b`（amber-500） | 强调文字、眉头标签、次级强调 |
| `--accent-fg` | `var(--color-ink-950)` | `#ffffff` | 主按钮前景文字 |

**使用规则**：
- 主按钮：`bg-accent text-accent-fg`（暗色下文字近黑，亮色下文字白）
- 强调文字：`text-accent-soft`（不直接用 `text-accent`，避免暗色下偏暗）
- 聚焦环：`focus-visible:ring-accent/30`
- 选中态：`bg-accent/10 text-accent-soft`

### 1.2 中性色（文字 / 背景 / 边框）

| 语义 Token | 暗色 | 亮色 | Tailwind 类 |
|---|---|---|---|
| `--text-primary` | stone-100 | `#1c1917` | `text-primary` |
| `--text-secondary` | stone-200 | `#292524` | `text-secondary` |
| `--text-tertiary` | stone-400 | `#57534e` | `text-tertiary` |
| `--text-muted` | stone-500 | `#78716c` | `text-muted` |
| `--bg-primary` | ink-950 | `#faf8f5` | `bg-surface` |
| `--bg-secondary` | ink-900 | `#f5f2ed` | `bg-secondary` |
| `--bg-card` | ink-900 | `#f5f2ed` | `bg-card` |
| `--bg-elevated` | ink-800 | `#ffffff` | `bg-elevated` |
| `--border-subtle` | `rgba(255,255,255,.05)` | `rgba(0,0,0,.05)` | `border-line-subtle` |
| `--border-default` | `rgba(255,255,255,.10)` | `rgba(0,0,0,.08)` | `border-line-default` |
| `--border-strong` | `rgba(255,255,255,.15)` | `rgba(0,0,0,.12)` | `border-line-strong` |
| `--hover-subtle` | `rgba(255,255,255,.05)` | `rgba(0,0,0,.04)` | `bg-hover-subtle` |

**层级规则**：
- 页面背景 = `bg-surface`（带渐变，见 [main.css](file:///workspace/assets/css/main.css) `html` 选择器）
- 卡片 = `bg-card` + `border-line-default`
- 弹层/悬浮 = `bg-elevated` + `border-line-default` + `shadow-lg`
- hover 反馈 = `hover:bg-hover-subtle`（跨主题一致，禁止 `hover:bg-white/5`）

### 1.3 状态色

| Token | 暗色 | 亮色 | 语义 |
|---|---|---|---|
| `--success` / `--success-soft` | `#22c55e` / `#4ade80` | `#16a34a` / `#22c55e` | 正确、完成 |
| `--warning` / `--warning-soft` | `#eab308` / `#facc15` | `#ca8a04` / `#eab308` | 部分正确、待办 |
| `--danger` / `--danger-soft` | `#ef4444` / `#f87171` | `#dc2626` / `#ef4444` | 错误、危险 |

**使用规则**：一律用 `text-success` / `bg-danger/15` / `border-success/30`，禁止 `green-500/yellow-500/red-500`。

### 1.4 场景应用速查

| 场景 | 文字 | 背景 | 边框 |
|---|---|---|---|
| 卡片标题 | `text-primary` | — | — |
| 卡片正文 | `text-secondary` | `bg-card` | `border-line-default` |
| 辅助说明 | `text-tertiary` | — | — |
| 标签/序号 | `text-muted` | — | — |
| 眉头章节标 | `text-accent-soft`（用 `ds-eyebrow`） | — | — |
| 表单标签 | `text-muted`（用 `ds-label`） | — | — |
| 输入框 | `text-primary` | `bg-surface` | `border-line-default` |
| 主按钮 | `text-accent-fg` | `bg-accent` | — |
| 次按钮 | `text-tertiary`→hover`text-primary` | 透明 | `border-line-strong` |
| 幽灵按钮 | `text-tertiary`→hover`text-primary` | 透明→`bg-hover-subtle` | — |

---

## 2. UI 组件库

### 2.1 组件类（`@utility`，定义于 [main.css](file:///workspace/assets/css/main.css)）

| 类名 | 用途 | 关键样式 |
|---|---|---|
| `ds-card` | 卡片容器 | `border:1px solid var(--border-default); background:var(--bg-card); padding:1.5rem` |
| `ds-eyebrow` | 章节眉头小标 | `0.75rem uppercase letter-spacing:.28em color:accent-soft` |
| `ds-label` | 表单/列表小标签 | `0.75rem uppercase letter-spacing:.025em color:muted` |
| `ds-divider` | 分隔线 | `border-top:1px solid var(--border-subtle)` |
| `ds-input` | 表单输入基础 | 边框/底色/聚焦环/占位符全套 |
| `ds-heading-display` | 展示标题 | `font-display 700 tracking:-.04em leading:.95` |

> 变体用工具类叠加，如 `ds-card p-0 overflow-hidden`。

### 2.2 按钮（统一三态）

| 类型 | 写法 | 用途 |
|---|---|---|
| 主按钮 | `<UButton class="bg-accent text-accent-fg hover:bg-accent-soft">` | 关键 CTA、开始练习、提交 |
| 次按钮 | `<UButton variant="outline" class="border-line-strong text-tertiary hover:border-accent hover:text-primary">` | 取消、次要操作 |
| 幽灵按钮 | `<UButton variant="ghost" class="text-tertiary hover:text-primary">` | 导航、过滤、链接式操作 |

**禁止**：`bg-white text-ink-950`（白色主按钮）、`hover:border-white/30`（绝对值 hover）。

### 2.3 表单

- 输入框：用 `ds-input`，或 `<UInput class="ds-input">`。聚焦自动出现 `accent` 环。
- 标签：用 `ds-label`，置于输入框上方。
- 校验反馈：错误用 `text-danger`，成功用 `text-success`。

### 2.4 卡片

- 标准卡片：`<div class="ds-card">`
- 列表条目卡片：`<div class="ds-card p-0 overflow-hidden">` + 内部分区用 `border-line-subtle`
- 禁止 `rounded-2xl border border-white/10 bg-ink-900/50 p-6` 式重复组合

### 2.5 导航（`layouts/default.vue`）

- 顶栏背景：`var(--header-bg)`（半透明 + backdrop-blur）
- 顶栏下边框：`var(--header-border)`
- 移动端抽屉：`var(--mobile-nav-bg)`
- 激活态：`text-accent-soft` + `bg-accent/10`
- 非激活：`text-tertiary` → hover `text-primary`

---

## 3. 排版系统

### 3.1 字体

| Token | 字体栈 | 用途 |
|---|---|---|
| `--font-sans` | Inter, ui-sans-serif, system-ui | 正文、UI |
| `--font-display` | Space Grotesk, Inter | 标题、数字、品牌 |

### 3.2 字阶（`@theme static`）

| Token | 值 | 用途 |
|---|---|---|
| `--text-display-xl` | 6rem | 首页主标题 |
| `--text-display-lg` | 4.5rem | 大型展示 |
| `--text-display-md` | 3rem | 章节大标题 |
| `--text-display-sm` | 2rem | 子章节标题 |
| Tailwind 默认 | text-sm/base/lg/xl/2xl/3xl/4xl/5xl | 正文与常规标题 |

**规则**：页面主标题用 `text-3xl sm:text-4xl` 或 `text-4xl sm:text-5xl`；章节用 `text-3xl sm:text-5xl`；正文 `text-sm/base`；辅助 `text-xs`。

### 3.3 行高

| Token | 值 | 用途 |
|---|---|---|
| `--leading-tight` | 0.95 | 展示标题（`ds-heading-display`） |
| `--leading-snug` | 1.25 | 常规标题 |
| `--leading-normal` | 1.5 | UI 文字 |
| `--leading-relaxed` | 1.75 | 长正文（`leading-relaxed`） |

### 3.4 字距

| Token | 值 | 用途 |
|---|---|---|
| `--tracking-tightest` | -0.04em | 展示标题 |
| `--tracking-eyebrow` | 0.28em | 眉头大写小标 |
| Tailwind `tracking-wide` | 0.025em | 列表小标签 |

**禁止**：模板里出现 `tracking-[0.28em]` / `tracking-[0.3em]` / `tracking-[0.32em]` 三个近似值，统一用 `tracking-[var(--tracking-eyebrow)]` 或 `ds-eyebrow`。

### 3.5 字重

- 标题：`font-semibold`（600）或 `font-bold`（700）
- 正文：`font-medium`（500）或默认 400
- 标签：`font-medium`

### 3.6 段落间距

- 章节之间：`mt-10` / `py-24 sm:py-32`（首页大节）
- 卡片之间：`mt-6`
- 标题与正文：`mt-4`
- 列表条目：`py-4` + `border-line-subtle` 分隔

---

## 4. 图标规范

### 4.1 图标库

统一使用 `@iconify-json/lucide`，经 Nuxt UI `icon` prop 或 `<UIcon name="i-lucide-xxx" />` 调用。

### 4.2 常用图标映射

| 场景 | 图标 |
|---|---|
| 开始练习 / 能量 | `i-lucide-zap` |
| 连续打卡 | `i-lucide-flame` |
| 正确率 / 目标 | `i-lucide-target` |
| 总数 / 成就 | `i-lucide-trophy` |
| 语法专项 | `i-lucide-circle` |
| 复习 / 重做 | `i-lucide-rotate-cw` |
| 正确 | `i-lucide-check` |
| 错误 | `i-lucide-x` |
| 箭头 | `i-lucide-arrow-right` / `arrow-up` / `arrow-down` |
| 主题切换 | `i-lucide-sun` / `i-lucide-moon` |
| 语言 | `i-lucide-languages` |

### 4.3 禁止与例外

- **禁止**：emoji 充当功能图标（🏠⚡🔄◎📝🔖🏆 这类导航/按钮图标）
- **禁止**：unicode 字符充当状态图标（✓ ✗ ◐ →），用 lucide 替代
- **例外**：等级徽章 emoji（🌱📚⚡🔥💎👑🏆）、streak toast 的 🔥 属游戏化情感化文案，保留
- **例外**：CSS 圆点（`rounded-full bg-accent-soft`）用于状态指示，非图标

---

## 5. 页面布局网格系统

### 5.1 容器宽度

| 场景 | 类 | 最大宽度 |
|---|---|---|
| 首页大节 | `mx-auto max-w-7xl px-6 py-24 sm:py-32` | 1280px |
| 内容页（仪表盘/历史/排名等） | `mx-auto max-w-5xl px-6 pb-24 pt-28` | 1024px |
| 表单页（登录/注册） | `mx-auto max-w-md px-6` | 448px |
| 文本阅读页（条款/隐私） | `mx-auto max-w-3xl px-6 py-16` | 768px |

### 5.2 栅格

- 主栅格：`grid grid-cols-1 lg:grid-cols-{n}`，断点 `lg` 切换
- 卡片网格：`grid grid-cols-1 md:grid-cols-3`（首页 boards 三栏）
- 统计卡片：`grid grid-cols-2 sm:grid-cols-4` + `gap-px` + `bg-line-default` 间隙作边框
- 顶部内边距：`pt-28`（避开固定头栏 `h-20`）

### 5.3 间距节奏

- 基础单位 4px（Tailwind 默认）
- 卡片内边距：`1.5rem`（`ds-card`）
- 章节间距：`mt-6`（紧凑）/ `mt-10`（常规）/ `py-24 sm:py-32`（首页大节）
- 列表条目：`py-4` + `border-b border-line-subtle`

---

## 6. 主题切换

- 实现：[composables/useTheme.ts](file:///workspace/composables/useTheme.ts) + [components/ThemeToggle.vue](file:///workspace/components/ThemeToggle.vue)
- 切换动画：全屏渐变擦除（`main.css` `.theme-gradient-transition`）
- 类名：`html.dark` / `html.light`（默认暗色）
- 所有颜色经语义变量自动响应，模板层无需关心当前主题

---

## 7. 新增页面 Checklist

新建 `pages/xxx.vue` 时，逐项核对：

- [ ] 容器用 `mx-auto max-w-{5xl/7xl/md/3xl} px-6`
- [ ] 顶部留 `pt-28` 避开头栏
- [ ] 卡片用 `ds-card`，不重复 `rounded-2xl border border-white/10 bg-ink-900/50 p-6`
- [ ] 文字色用 `text-primary/secondary/tertiary/muted`，不写 `text-stone-*`
- [ ] 边框用 `border-line-subtle/default/strong`，不写 `border-white/10`
- [ ] hover 用 `hover:bg-hover-subtle`，不写 `hover:bg-white/5`
- [ ] 按钮三态之一：主 `bg-accent text-accent-fg` / 次 `variant="outline"` / 幽灵 `variant="ghost"`
- [ ] 状态色用 `text-success/warning/danger`，不写 `green-500/yellow-500/red-500`
- [ ] 功能图标用 `<UIcon name="i-lucide-xxx" />`，不用 emoji / unicode
- [ ] 眉头小标用 `ds-eyebrow`，字距 `tracking-[var(--tracking-eyebrow)]`
- [ ] 表单输入用 `ds-input`，标签用 `ds-label`
- [ ] 圆角：除 spinner / 进度环 / 状态圆点外，不出现 `rounded-*`
- [ ] 暗色 + 亮色两种主题下视觉一致（手动切换验证）

---

## 8. 维护

- Token / 组件类的**唯一来源**是 [assets/css/main.css](file:///workspace/assets/css/main.css)
- 新增 Token：先在 `@theme static`（不随主题变）或 `:root`/`html.dark`/`html.light`（随主题变）定义，再在 `@theme` 块注册成 Tailwind 工具类
- 新增组件类：用 `@utility ds-xxx { ... }`，单一职责，变体交给模板层
- 本规范与代码漂移时，以代码为准并同步更新本文档
