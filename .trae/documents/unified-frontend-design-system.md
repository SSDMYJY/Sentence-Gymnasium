# 统一网站前端设计规范 — 实施计划

> Status: APPROVED
> Source: 用户请求（建立统一前端设计规范并应用于全站）
> Mode: (default) — 完整 Planner → Architect → Critic loop
> Iterations: 2 / 3
> Author: user
> Last updated: 2026-08-01

## Requirements summary

本计划服务一个需求：为 Sentence Gymnasium（Nuxt 4 + @nuxt/ui v4 + Tailwind v4 的多语言句子练习平台）建立统一的前端设计规范，消除全站视觉割裂感，并将全部 14 个页面迁移至新规范。规范覆盖五大维度：主题色彩系统、UI 组件库、排版系统、图标规范、布局网格系统。用户已确认两点关键决策：(1) 范围为「规范 + 全站迁移」；(2) 圆角策略为「保持锐角编辑风」。

## Acceptance criteria

- AC-1 `assets/css/main.css` 的 `@theme static` 块包含完整的语义化 Token：色彩（主色/辅助色/中性色/状态色）、排版（字阶/行高/字重/字距）、圆角、阴影、间距节奏，且每个 Token 在 dark/light 两套主题下均有对应值或自动继承。
- AC-2 存在一组 Tailwind v4 `@utility` 组件类（卡片/眉头标签/分隔线/表单标签/输入框等），作为单一来源，消除模板里重复的 `rounded-2xl border border-white/10 bg-ink-900/50 p-6` 式硬编码。
- AC-3 全站按钮统一为「主按钮=accent 实底」「次按钮=outline」「幽灵按钮=ghost」三类，不再出现 `bg-white text-ink-950`（白色主按钮）与 accent 主按钮并存的情况。
- AC-4 全站装饰性圆角类（`rounded-2xl/xl/lg/full` 用于卡片/按钮/输入框/徽章）被移除，统一锐角；仅保留功能性圆形（SVG 进度环、状态圆点）。
- AC-5 导航与功能图标统一使用 `@iconify-json/lucide`（经 Nuxt UI `icon` prop / `UIcon`），不再使用 emoji 充当功能图标；emoji 仅保留在等级徽章等游戏化装饰场景，并在规范中显式标注例外。
- AC-6 状态色（成功/警告/危险）使用 Token（如 `text-success`、`bg-danger/5`、`border-success/30`），不再硬编码 `green-500/yellow-500/red-500`。
- AC-7 `layouts/default.vue` 及全部 14 个 `pages/*.vue` 与 6 个 `components/*.vue` 完成迁移：无残留 `text-stone-*`（作为前景色时）、`border-white/10`（作为语义边框时）、`bg-ink-900/50`（作为卡片底时）等绕过 Token 的写法。
- AC-8 产出一份设计规范文档 `DESIGN_SYSTEM.md`（项目根），记录全部 Token、组件类、图标映射表、布局网格规则与使用守则，可作新增页面的唯一参考。
- AC-9 `pnpm build`（`prisma generate && nuxt build`）通过，无类型/构建错误。
- AC-10 明暗主题切换后，所有页面色彩/边框/状态色表现一致，无残留仅暗色场景下硬编码的白色透明度值。

## Current State Analysis（基于实际代码探索）

**技术栈**：Nuxt 4.4 + @nuxt/ui v4.9（Tailwind v4 + Headless UI）+ Pinia + @nuxtjs/i18n（zh-hans/zh-hant/en/ja）+ GSAP + Cloudflare Workers/D1/Prisma。`@iconify-json/lucide` 已在 devDependencies 但仅 `ThemeToggle.vue` 使用。

**已有基础**（`assets/css/main.css`）：
- `@theme static` 定义了 ink/paper/accent 色板、`--font-sans`(Inter)/`--font-display`(Space Grotesk)、`--tracking-tightest`。
- `:root` / `html.dark` / `html.light` 三套语义 CSS 变量：`--bg-*`、`--text-*`、`--border-*`、`--accent-*`、`--header-bg`、`--mobile-nav-bg` 等。明暗切换 + 渐变擦除动画已可用。
- `--ui-radius: 0rem` 已强制 Nuxt UI 组件锐角。

**割裂点（实测）**：
1. 语义变量 vs 原始类混用：`default.vue` scoped 样式用 `var(--text-tertiary)`，但模板内大量 `text-stone-400/500`、`border-white/10`、`bg-ink-900/50`。
2. 按钮三套写法并存：主按钮时而 `bg-white text-ink-950`（`dashboard.vue:99`、`AnswerCard.vue:264`）时而 `bg-accent text-ink-950`（`index.vue:131`）；outline 按钮 hover 规则不一（`dashboard.vue:109` 用 `hover:border-accent`，`AnswerCard.vue:268` 用 `hover:border-white/30`）。
3. 圆角冲突：`--ui-radius:0rem`（Nuxt UI 锐角）与模板 `rounded-2xl`（卡片/输入框）共存于同一界面。
4. 图标四套体系：lucide（ThemeToggle）/ emoji 导航（🏠⚡🔄◎📝🔖🏆）/ emoji 等级（🌱📚🔥💎👑）/ unicode 状态（✓✗◐→）。
5. 排版无字阶：`text-3xl/4xl/5xl/7xl/8xl` 随意出现；`tracking-[0.28em/0.3em/0.32em]` 三个近似值。
6. 状态色硬编码：`green-500/yellow-500/red-500` 散布于 `AnswerCard.vue:168-171`、`dashboard.vue:143-149`。
7. 卡片模式 `rounded-2xl border border-white/10 bg-ink-900/50 p-6` 在 `dashboard.vue` 重复 6+ 次。

**已读文件**：`main.css`、`layouts/default.vue`、`app.config.ts`、`nuxt.config.ts`、`composables/useTheme.ts`、`components/AnswerCard.vue`、`components/ThemeToggle.vue`、`pages/index.vue`、`pages/dashboard.vue`、`package.json`。

## RALPLAN-DR

### Principles

1. **不假设、基于现状增量**：在现有 `@theme static` + 语义 CSS 变量体系上扩展，不推翻重写 `main.css`。
2. **最小代码、单一来源**：用 Tailwind v4 `@utility` 组件类封装重复模式，模板层只消费语义类，减少散落硬编码。
3. **外科手术式改动**：每个 Token/组件类有明确文件落点；页面迁移逐文件进行，每文件可独立验证。
4. **锐角编辑风一致性**：圆角统一为 0，仅 SVG 进度环/状态圆点保留功能性圆形。
5. **可验证成功标准**：构建通过 + 明暗双主题视觉一致 + grep 不到绕过 Token 的残留写法。

### Decision drivers

1. **视觉一致性（最高）**：用户核心诉求是消除割裂感，Token 必须是单一来源。
2. **维护成本**：14 页 + 6 组件迁移后，新增页面应能照抄规范，不再自由发挥。
3. **构建兼容性**：Cloudflare Workers 部署，CSS 不能引入运行时不支持的特性。
4. **团队熟悉度**：延续已有 Tailwind v4 + @nuxt/ui 范式，不引入新 CSS 框架/预处理器。

### Viable options

**Option A: Token-first + `@utility` 组件类（CSS 单一来源）**
- 思路：在 `main.css` 扩展 `@theme static`（补全状态色/字阶/行高/阴影/间距 Token）+ 用 Tailwind v4 `@utility` 定义 `.ds-card`/`.ds-eyebrow`/`.ds-label`/`.ds-input`/`.ds-divider`/`.ds-heading-*` 组件类；按钮统一走 Nuxt UI `UButton` 配合 `app.config.ts` 与少量工具类约定。页面迁移=把硬编码替换为语义类/Token。
- 改动文件：`assets/css/main.css`（核心）、`app.config.ts`、`layouts/default.vue`、`pages/*.vue`(14)、`components/*.vue`(6)、新增 `DESIGN_SYSTEM.md`。
- Pros：单一来源在 CSS；模板大幅瘦身；新增页只需用 `.ds-*` 即可保证一致；与现有体系无缝衔接。
- Cons：需 upfront 定义组件类；`@utility` 在 Tailwind v4 的写法需正确（`@utility name { ... }`）。

**Option B: 纯 Tailwind 语义工具类（无组件类）**
- 思路：只扩展 `@theme` Token（让 `text-primary`/`bg-card`/`border-default`/`text-success` 等成为可用工具类），不定义组件类；每处卡片仍写 `border border-default bg-card p-6`（去掉 rounded）。
- 改动文件：同上但 `main.css` 不加 `@utility` 段。
- Pros：最纯 Tailwind，无自定义类层；灵活。
- Cons：`border border-[var(--border-default)] bg-[var(--bg-card)] p-6` 式长串在 14 页重复 30+ 次，一致性靠人肉保证，正是当前割裂根源；维护与一致性收益弱。

**Option C: 深度 Nuxt UI theming**
- 思路：把卡片/标签等也纳入 @nuxt/ui v4 的 `app.config.ts` slots 体系。
- Pros：与 UI 库对齐。
- Cons：@nuxt/ui v4 的 theming 主要服务其自有组件，自定义 `.ds-eyebrow`/section 标题/眉头等无对应组件；强行套用会混入两套范式，复杂度高、收益低。**被否决**。

**Invalidation rationale**：Option B 的「无组件类」直接违背 Decision driver #1（一致性）—— 当前割裂正源于散落工具类；Option C 对非 Nuxt UI 元素无能为力。故选 Option A。

### Implementation steps（基于 Option A，favored）

> 所有步骤 cite 具体文件。Tailwind v4 `@utility` 语法：`@utility ds-card { ... }` 定义后可在模板用 `class="ds-card"`。

#### 阶段 0 — 工作区准备
1. 运行 `git status --short` 与 `git branch --show-current`；若 working tree 干净且在 `main`/`master`，建议建 worktree：`git worktree add -b feat/design-system ../sentence-gym-design`。若 dirty，先保护现有改动。

#### 阶段 1 — Token 系统扩展（`assets/css/main.css`）
2. 在 `main.css:8` 的 `@theme static` 块内补全色彩 Token：
   - 状态色：`--color-success`、`--color-success-soft`、`--color-warning`、`--color-warning-soft`、`--color-danger`、`--color-danger-soft`（dark 默认值，如 success `#22c55e`/soft `#4ade80`）。
   - 排版：`--text-display-xl`、`--text-display-lg`、`--text-display-md`、`--text-display-sm`、`--leading-tight`、`--leading-snug`、`--leading-relaxed`、`--tracking-eyebrow: 0.28em`（统一三处近似值）。
   - 圆角：`--radius-sharp: 0px`、`--radius-pill: 9999px`（功能性圆）。
   - 阴影：`--shadow-sm`、`--shadow-md`、`--shadow-lg`。
3. 在 `main.css:28` 的 `:root`/`html.dark`（`:59`）补状态语义变量：`--success`、`--warning`、`--danger` 及其 soft/fg，使 `@theme` 原始色与语义层解耦。
4. 在 `main.css:90` 的 `html.light` 补 light 态状态色（success `#16a34a` 等）与 light 态 stone 反相映射已有，确认状态色在亮色下对比度达标。
5. 修正 `--ui-radius`：保持 `0rem`，并在 `app.config.ts:1` 的 `defineAppConfig.ui` 补 `ui.radius` 约定（如不需要可不动），确保 Nuxt UI 组件锐角。

#### 阶段 2 — 组件类与按钮统一（`assets/css/main.css` + `app.config.ts`）
6. 在 `main.css` 末尾用 `@utility` 定义组件类（Tailwind v4 语法）：
   - `@utility ds-card { ... }`：`border border-[var(--border-default)] bg-[var(--bg-card)] p-6`（无圆角）。
   - `@utility ds-card-elevated { ... }`：用 `--bg-elevated` + `--shadow-sm`。
   - `@utility ds-eyebrow { ... }`：`text-xs uppercase tracking-[var(--tracking-eyebrow)] text-[var(--accent-soft)]`。
   - `@utility ds-label { ... }`：`text-xs uppercase tracking-wide text-[var(--text-muted)]`。
   - `@utility ds-divider { ... }`：`border-t border-[var(--border-subtle)]`。
   - `@utility ds-input { ... }`：表单输入基础样式（border/bg/focus）。
   - `@utility ds-heading-display { ... }`：`font-display font-bold tracking-tight`。
7. 按钮统一（`app.config.ts:1`）：在 `ui.button` slots 设默认 variant 样式；约定主按钮=accent 实底（`bg-accent text-ink-950`）、次按钮=`variant="outline"`（hover→accent）、幽灵=`variant="ghost"`。移除「白色主按钮」`bg-white text-ink-950` 写法。

#### 阶段 3 — 图标规范落地
8. 确认 `@iconify-json/lucide` 已装（`package.json:34` ✓）。建立图标映射表写入 `DESIGN_SYSTEM.md`：
   - 🏠→`i-lucide-home`、⚡→`i-lucide-zap`、🔄→`i-lucide-refresh-cw`、◎→`i-lucide-circle`、📝→`i-lucide-file-text`、🔖→`i-lucide-bookmark`、🏆→`i-lucide-trophy`、✓→`i-lucide-check`、✗→`i-lucide-x`、→→`i-lucide-arrow-right`、◐→`i-lucide-circle-dashed`。
9. `layouts/default.vue:137-144`（navItems icon）、`:147-154`（mobileTabs icon）改为 lucide 名称，模板用 `UIcon` 或 `<UButton :icon>` 渲染。
10. 例外：等级图标 🌱📚🔥💎👑（`pages/dashboard.vue:338-345`）保留 emoji（游戏化装饰），在 `DESIGN_SYSTEM.md` 标注为「装饰性 emoji 例外」。

#### 阶段 4 — 布局迁移（`layouts/default.vue`）
11. `layouts/default.vue`：scoped 样式已大量用语义变量（良好），仅需把模板内 `text-sm font-medium` 等与 Token 对齐；nav-link active 用 `--accent`（已有）。确认 footer/header/bottom-nav 均走语义变量。

#### 阶段 5 — 页面迁移（14 个 `pages/*.vue`）
12. `pages/index.vue`：`border-white/10`→`ds-divider`/语义 border；`bg-ink-900/40`→语义；`bg-accent text-ink-950` 保留（已是主按钮规范）；`text-stone-400/500`→`text-[var(--text-tertiary/muted)]` 或定义 `ds-body-muted`；移除 `rounded-2xl`（hero 无；boards 卡片边框无圆角）；emoji-free。
13. `pages/dashboard.vue`：6+ 处 `rounded-2xl border border-white/10 bg-ink-900/50 p-6`→`ds-card`；`bg-white text-ink-950`(主按钮 `:99`)→`bg-accent text-ink-950`；`green-500/yellow-500/red-500`(`:143-149`)→`success/warning/danger` Token；emoji→lucide；`rounded-full`(进度环 SVG)保留。
14. `pages/practice.vue`、`paraphrase.vue`、`grammar.vue`：经 `components/AnswerCard.vue` 收敛（见步骤 16）；页面自身卡片→`ds-card`，按钮→统一规范。
15. `pages/review.vue`、`bookmarks.vue`、`history.vue`、`ranking.vue`：卡片→`ds-card`；列表分隔→`ds-divider`；状态色→Token；emoji→lucide。
16. `pages/login.vue`、`register.vue`：表单→`ds-input`/`ds-label`；按钮→统一；`UTextarea`/`UInput` 的 `:ui` 覆盖对齐 Token。
17. `pages/health.vue`、`privacy.vue`、`terms.vue`：内容型页面，标题→`ds-heading-display`，正文→`ds-body`，容器→统一 `max-w`。

#### 阶段 6 — 组件迁移（6 个 `components/*.vue`）
18. `components/AnswerCard.vue`：核心收敛点。`rounded-2xl border border-white/10 bg-ink-900/50 p-6`(4 处)→`ds-card`；`bg-white text-ink-950`(`:264,278`)→`bg-accent text-ink-950`；`border-green-500/30 bg-green-500/5`(`:168-171`)→`border-success/30 bg-success/5`；`text-red-400`/`text-yellow-400`→Token；`text-accent-soft` 保留；unicode ✓✗→lucide。
19. `components/ThemeToggle.vue`：已良好，仅确认 border/color 走语义变量（已是）。
20. `components/DifficultyLevelSwitcher.vue`、`ScenarioDropdown.vue`、`LanguageSwitcher.vue`、`EnglishOnlyTips.vue`：卡片/按钮/下拉对齐 `ds-*` 与统一按钮规范。

#### 阶段 7 — 规范文档
21. 新建 `DESIGN_SYSTEM.md`（项目根）：记录 Token 全表（色彩/排版/圆角/阴影/间距）、组件类清单、按钮三变体、图标映射表、布局网格规则（容器 `max-w-7xl/5xl/2xl` + `px-6`、section `py-24 sm:py-32`）、锐角守则、emoji 例外清单、明暗主题对照。

#### 阶段 8 — 验证
22. `pnpm build`（= `prisma generate && nuxt build`）通过。
23. grep 残留：`border-white/10`、`bg-ink-900/50`、`bg-white text-ink-950`、`rounded-2xl`、`text-stone-4`、`green-500` 在 `pages/`+`components/`+`layouts/` 应为 0（白名单除外）。
24. 明暗双主题逐页肉眼/截图核对。

### Workspace setup

- 实施前运行 `git status --short` 和 `git branch --show-current`。
- 本 plan 修改 `main.css`/`app.config.ts`/14 页/6 组件/新增文档，属多文件改动。若 working tree 干净且在 `main`/`master`，推荐 worktree：`git worktree add -b feat/design-system ../sentence-gym-design`。
- 若 working tree 已 dirty，先保护现有改动，勿混入本 plan。

## Architect challenge

### Steelman against favored option（Option A）

**最强反驳**：Option A 引入自定义 `@utility` 组件类层，本质是在 Tailwind 之上再造一套语义层。反方论点：Tailwind v4 的 `@theme` 已能让 `bg-card`/`text-primary`/`border-default` 直接成为可用工具类——只要把语义变量注册进 `@theme`，模板里写 `bg-card border-default p-6` 即可，无需 `.ds-card`。加 `.ds-*` 层增加了「学一套自定义类名」的认知负担，且 `@utility` 在 Tailwind v4 中是静态定义、不支持像组件 props 那样灵活组合 variant，遇到「卡片但无内边距」「卡片+elevated」等变体时反而要再开 `ds-card-flush`/`ds-card-elevated`，类爆炸。

**若反驳成立，plan 应改成**：Option B——只注册 `@theme` 语义 Token，不做 `@utility` 组件类，卡片写成 `border border-default bg-card p-6`（工具类组合）。一致性靠「Token 唯一」而非「组件类唯一」保证。

### Tradeoff tensions

1. **一致性 vs 灵活组合**：`.ds-card` 强一致但变体需扩类；纯工具类灵活但长串重复。取舍依据：当前割裂根源正是「重复长串靠人肉保证一致」，故一致性优先级 > 灵活，Option A 的组件类值得。但应控制 `ds-*` 数量（≤8 个核心类），变体用 `ds-card` + 额外 utility 叠加（如 `ds-card p-0`）而非无限扩类。
2. **upfront 设计成本 vs 迁移顺畅**：先定义 Token/组件类再迁移页面，upfront 重但迁移变成机械替换；边迁边定义则每页都要决策。取舍：先做阶段 1-3（Token+组件类+图标），再批量迁移页面，符合「单一来源」原则。

### Synthesis path

采纳反方部分合理处：**Token 注册进 `@theme` 使语义工具类可用（`bg-card`/`text-primary`/`border-default`/`text-success`）**，同时**保留少量高价值 `@utility` 组件类（仅 `.ds-card`/`.ds-eyebrow`/`.ds-label`/`.ds-divider`/`.ds-input`/`.ds-heading-display`，共 6 个）**用于「几乎每次都一起出现」的组合。这样既有单一来源（Token），又对最高频组合有组件类收敛，且类数受控。变体用 `ds-card` + 工具类叠加（`ds-card p-0`、`ds-card bg-[var(--bg-elevated)]`）。

## Critic verdict

| 维度 | 状态 | 备注 |
|---|---|---|
| Principle-option consistency | ✓ | 选 A 与「单一来源/最小代码/外科手术」一致；synthesis 后保留受控组件类不违 Principle #2 |
| Fair alternative exploration | ✓ | A/B/C 三选项有真差异，C 有 invalidation rationale |
| Risk mitigation clarity | ✓ | 见下表，每条有 mitigation |
| AC testability | ✓ | AC-9 构建命令、AC-23 grep 残留、AC-10 双主题核对均二值可验证 |
| Verification concreteness | ✓ | `pnpm build` + grep + 截图核对，可执行 |
| File/line coverage | ✓ | 步骤 cite `main.css:8/28/59/90`、`app.config.ts:1`、`default.vue:137`、`dashboard.vue:99/143/338`、`AnswerCard.vue:168/264` 等 |
| Pre-mortem present | N/A | 非 deliberate 模式 |
| Expanded test plan present | N/A | 非 deliberate 模式 |

### Verdict: APPROVED（应用 Synthesis 改进）

### Reservations（必填）

1. **保留**：`@utility ds-card` 的变体策略（`ds-card p-0` 叠加）依赖 Tailwind v4 允许 `@utility` 类与普通工具类同元素共存——需在阶段 2 步骤 6 先做一个最小验证（写一个 `@utility` + 模板叠加 `p-0`，确认 `pnpm build` 不报错且样式生效），否则可能需要改用 `@layer components` 写法。
2. **保留**：步骤 12-17 的页面迁移工作量被低估——14 页逐文件替换 + 明暗双主题核对，单次构建周期可能掩盖局部样式回归。Mitigation：每迁移 3-4 页跑一次 `pnpm build` + grep，分段验证而非全部改完再验。
3. **保留**：`DESIGN_SYSTEM.md` 作为「新增页面唯一参考」无强制力（纯文档）。若后续页面不遵守，规范仍会被绕过。Mitigation：在 `DESIGN_SYSTEM.md` 顶部写明「新增页须用 `ds-*` 与语义 Token，PR 审查 checklist 含 grep 残留项」。

## 应用的改进（来自 Architect + Critic）

1. Token 同时注册进 `@theme` 使 `bg-card`/`text-primary`/`border-default`/`text-success` 等语义工具类可用（synthesis）。
2. 组件类控制在 6 个（`.ds-card`/`.ds-eyebrow`/`.ds-label`/`.ds-divider`/`.ds-input`/`.ds-heading-display`），变体用工具类叠加。
3. 阶段 2 步骤 6 增加 `@utility` 最小验证；页面迁移分段验证（每 3-4 页一次 build+grep）。

## Risks & mitigations

| Risk | Mitigation |
|---|---|
| Tailwind v4 `@utility` 与工具类叠加不兼容 | 阶段 2 先做最小验证；不兼容则改 `@layer components` |
| 14 页迁移量大、易遗漏 | 分段验证（每 3-4 页 build+grep）；保留 grep 白名单 |
| 明暗主题下状态色对比度不足 | light 态状态色用更深的 success/warning/danger 值；肉眼核对 |
| `bg-white text-ink-950` 主按钮迁移到 `bg-accent` 后视觉变化大 | 这是预期统一效果；在迁移页确认 accent 主按钮在双主题下可读 |
| emoji→lucide 后导航图标语义/权重变化 | 用 `UIcon` 统一尺寸；i18n label 不变 |
| `--ui-radius:0` 下 Nuxt UI 组件（弹层/下拉）锐角是否合理 | 确认 `ScenarioDropdown`/popover 锐角符合编辑风；不合理处单独处理 |

## Verification steps

- 验 AC-1/2：读 `assets/css/main.css`，确认 `@theme static` 含状态色/字阶/圆角/阴影 Token；存在 6 个 `@utility ds-*`。
- 验 AC-3：`grep -rn "bg-white text-ink-950" pages/ components/ layouts/` 应为 0。
- 验 AC-4：`grep -rn "rounded-2xl\|rounded-xl\|rounded-lg" pages/ components/ layouts/` 应为 0（白名单：SVG 进度环 `rounded-full` 保留）。
- 验 AC-5：`grep -rn "🏠\|⚡\|🔄\|◎\|📝\|🔖\|🏆" layouts/ pages/ components/` 应为 0（等级 emoji 白名单除外）。
- 验 AC-6：`grep -rn "green-500\|yellow-500\|red-500" pages/ components/` 应为 0。
- 验 AC-7：`grep -rn "border-white/10\|bg-ink-900/50\|text-stone-4" pages/ components/ layouts/` 应为 0。
- 验 AC-8：`DESIGN_SYSTEM.md` 存在且含 Token 表/组件类/图标映射/布局规则。
- 验 AC-9：`pnpm build` 退出码 0。
- 验 AC-10：明暗切换逐页截图核对。
- 验 AC-1 `@utility` 叠加：阶段 2 最小验证 `pnpm build` 通过。

## ADR

- **Decision**：在现有 `@theme static` + 语义 CSS 变量体系上扩展完整 Token（色彩/排版/圆角/阴影），并定义 6 个受控 `@utility` 组件类（`.ds-card`/`.ds-eyebrow`/`.ds-label`/`.ds-divider`/`.ds-input`/`.ds-heading-display`）收敛最高频组合；按钮统一为 accent 实底/outline/ghost 三变体；图标统一 lucide；圆角统一锐角；迁移全部 14 页 + 6 组件 + 布局；产出 `DESIGN_SYSTEM.md`。
- **Drivers**：视觉一致性（#1）决定「单一来源」必须用 Token+组件类而非散落工具类；维护成本（#2）决定需文档化；构建兼容性（#3）决定沿用 Tailwind v4 `@utility` 不引新框架。
- **Alternatives considered**：Option B（纯语义工具类无组件类）—rejected，因重复长串正是当前割裂根源；Option C（深度 Nuxt UI theming）—rejected，对自定义元素无能为力且混范式。
- **Why chosen**：Option A + synthesis 兼顾单一来源（Token）与高频收敛（组件类），延续现有体系，迁移可机械执行。
- **Consequences**：正向——全站一致、新增页有规可循、模板瘦身；负向——`bg-white` 主按钮视觉变化（预期）、`ds-*` 类需团队认知、文档无强制力需 PR checklist 补足。
- **Follow-ups**：PR 审查 checklist 含 grep 残留项；若 `@utility` 叠加不兼容则迁 `@layer components`（已在风险中）；等级 emoji 是否后续也 lucide 化留作 backlog。

## Review trail

- Planner draft v1：选 Option A（Token + `@utility` 组件类），列 A/B/C 三选项，14 页逐文件迁移步骤。
- Architect challenge v1：steelman 指出 `@utility` 是再造语义层、类爆炸风险；tension「一致性 vs 灵活」；synthesis=Token 注册进 `@theme` + 6 个受控组件类。
- Critic verdict v1：APPROVED with synthesis applied；3 条 reservations（`@utility` 叠加兼容性/迁移量被低估/文档无强制力）。
- 改进合入：synthesis 采纳；组件类限 6 个；阶段 2 加最小验证；迁移分段验证。
- Final iterations: 2 / 3
