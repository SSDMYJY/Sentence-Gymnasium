# Debug Session: credits-not-credited

**Status:** [OPEN]
**Session ID:** `credits-not-credited`
**Created:** 2026-08-02

---

## 1. Problem Definition

**Bug Brief**

- **实际行为 (Actual):** 用户在 Waffo 托管支付页完成支付后，账户 Credits 数值没有增加。
- **期望行为 (Expected):** 支付成功（`order.completed` webhook）后，订单标记为 `completed`，用户 `credits` 原子性增加对应套餐数值，前端结果页轮询到 `completed` 后刷新余额。
- **已知背景:** 第一轮已修复 `domain endpoints match fail`（successUrl 固定为已验证域名），并加固了 webhook 幂等/事务。代码已提交 `50a784e` 并推送 `origin/main`。**是否已部署到 EdgeOne Makers 待确认。**

**Reproduction Steps**

1. 登录 → 充值页 `/recharge` → 选择套餐 → 点「支付 $x」
2. 在 Waffo 托管收银页完成支付（测试卡或真实支付）
3. 回到 `/recharge/success?orderId=...` 页面轮询订单状态
4. 观察：订单状态是否变为 `completed`？用户 Credits 是否增加？

**Impact Scope:** 所有充值用户。涉及文件：
- `server/api/webhooks/waffo.post.ts`（回调处理 + 入账）
- `server/api/credits/checkout.post.ts`（创建订单 + 会话）
- `server/api/credits/orders/[id].get.ts`（前端轮询）
- `pages/recharge.vue` / `pages/recharge/success.vue`（前端）
- 部署环境：EdgeOne Makers（远程）；Waffo Dashboard 侧配置

---

## 2. Hypotheses (A–F)

| ID | Hypothesis | Likelihood | Effort | Expected Signal |
|----|-----------|------------|--------|-----------------|
| A | Waffo Dashboard 未注册 webhook（或 URL/环境错误），`order.completed` 从未送达服务器 | High | Low | Dashboard 投递日志无记录 / 服务器无任何 webhook 请求日志 |
| B | Webhook 已送达但验签失败（body 被平台改动 / 签名头缺失），返回 401 | Medium | Low | Dashboard 投递日志显示 HTTP 401；服务器日志 `Invalid signature` |
| C | Webhook 已送达且验签通过，但订单定位失败（`orderMerchantExternalId` 缺失/不匹配） | Medium | Low | 服务器日志 `order not found` / `without any order reference` |
| D | Webhook 处理成功但数据库写入失败（事务异常 / 连接问题），返回 5xx 且重试耗尽 | Medium | Medium | 服务器日志 `credit grant failed, transaction rolled back`；Dashboard 显示 5xx |
| E | 上一轮修复未部署到 EdgeOne Makers（代码已提交但未 `pnpm deploy`） | High | Low | 生产行为仍为旧逻辑；部署记录无新版本 |
| F | Credits 已入账但前端展示未刷新（store.fetch 失败 / 轮询逻辑问题） | Low | Medium | 数据库 credits 已增加，但页面显示旧值 |

**验证优先级:** A(High/Low) → E(High/Low) → B(Med/Low) → C(Med/Low) → D(Med/Med) → F(Low/Med)

---

## 3. Instrumentation Points

由于 webhook 运行在远程 EdgeOne Makers，使用 `console.error`/`console.log` 输出（平台日志可见）+ Waffo Dashboard 投递日志作为证据来源：

| Point | Location | Hypothesis | Log msg |
|-------|----------|-----------|---------|
| P1 | `waffo.post.ts` 入口（验签前后） | B | `[DEBUG] webhook entry`, `signature_ok/INVALID` |
| P2 | 订单引用解析 | C | `orderRef=... waffoOrderId=... eventType=... eventId=...` |
| P3 | 幂等检查 | B/C | `duplicate=...` |
| P4 | 订单查找结果 | C | `order found/found=null` |
| P5 | 事务入账结果 | D | `updated.count=... credits=...` |

---

## 4. Evidence Log

**2026-08-02 证据收集：**

1. **数据库证据**（scripts/_check-orders.mjs）：
   - 9 个订单全部 `pending`，`waffoEventId` 全部 `null`
   - checkoutSessionId 均已写入 → checkout API 正常
   - 用户 credits 保持默认 20，从未入账
   → ✅ 假设 D 排除（无事务失败痕迹）；指向 webhook 从未成功送达

2. **生产环境验证**：
   - 实际生产域名 = `https://sentencegym.waterspo.top`（用户确认）
   - EdgeOne Makers env 已正确设置 `NUXT_PUBLIC_SITE_URL=https://sentencegym.waterspo.top`
   - `sentencegym.waterspo.top/api/health` → 200；`/api/webhooks/waffo` 无签名 POST → 401（正确）
   - `sentence.waterspo.top` → 连接失败；Waffo DNS 无法解析（`no such host`）

3. **Waffo 侧证据**（scripts/_diag-waffo-webhooks.mjs，GraphQL `storeWebhooks` + `webhookDeliveries`）：
   - store `STO_1uST3bSsAzAPFS88ZE1Ljo`（Sentence Gymnasium）已注册 webhook（id=`45aa0a83-...`，testMode=true，订阅全部事件）
   - **但 URL 错误：`https://sentence.waterspo.top/api/webhooks/waffo`（缺 `gym`）**
   - 7 次投递全部失败：`Schedule failed: invalid destination url: unable to resolve host: lookup sentence.waterspo.top ...: no such host`

## 5. Root Cause & Fix

**根因（已确认）：** Waffo Dashboard 中注册的 webhook URL 域名错误——`sentence.waterspo.top` 缺了 `gym`，该域名不存在、DNS 无法解析。Waffo 支付成功后投递 `order.completed` 到该 URL 全部失败（无法调度），服务器从未收到回调，订单停留 `pending`，Credits 永不增加。

**修复（已应用）：**
1. ✅ **2026-08-02 已通过 SDK `client.webhooks.update` 将 webhook URL 修正为** `https://sentencegym.waterspo.top/api/webhooks/waffo`（回读验证成功，事件订阅保留）
2. ✅ checkout 切换为**认证式收银台** `client.checkout.authenticated.create`（buyerIdentity=userId）——已提交 `d02819a` 并推送，EdgeOne Makers GitHub 集成自动部署
3. ✅ 统一默认域名：`nuxt.config.ts` / `useSeo.ts` / `useSchemas.ts` / `robots.txt` / `.env.example` / `README.md` 中 `sentence-gymnasium.ai` → `sentencegym.waterspo.top`
4. ✅ **历史订单补入账**：6 笔 Waffo 侧 `completed` 的订单已原子补发 credits（共 1000），订单标记 `completed` 并记录 `waffoOrderId`；用户 credits 20 → 1020

**遗留（需人工）**：
- 2 笔 Waffo 订单无 `orderMerchantExternalId`（`ORD_3WYKKCe6FfgkTNKFxY2a8y` / `ORD_30UbuSnXwpuKy3A8Om1YN7`，各 1500 credits），无法定位本地用户，需在 Dashboard 查看买家邮箱后人工处理
- 3 笔本地 `pending` 订单（`cmsbahk8`/`cmsb98e7`/`cmsb91ls`）从未完成支付，无需处理

**部署说明**：项目 Provider 为 GitHub，`edgeone makers deploy` 不支持直传；需 push 到 main 触发 GitHub 集成自动部署。

## 6. Verification

- [x] Pre-fix 复现证据（7 次投递失败日志 + DB 9 pending）
- [x] Fix 应用（webhook URL 已修正；代码已推送 d02819a）
- [x] 6 笔历史订单补入账（1000 credits，DB 验证 20→1020）
- [ ] Post-fix 验证：新支付或 Dashboard Send Test Event 后 credits 自动到账（待用户操作确认）
