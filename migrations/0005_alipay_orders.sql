-- 支付宝电脑网站支付：订单表新增 Alipay 专属字段
-- outTradeNo      业务订单号（alipay.trade.page.pay 的 out_trade_no），全局唯一
-- alipayTradeNo   支付宝交易号（trade_no，异步通知回填）
-- alipayNotifyId  异步通知 ID（notify_id，幂等去重）

ALTER TABLE `orders`
  ADD COLUMN `outTradeNo` VARCHAR(64) NULL,
  ADD COLUMN `alipayTradeNo` VARCHAR(64) NULL,
  ADD COLUMN `alipayNotifyId` VARCHAR(64) NULL;

-- out_trade_no 唯一索引（支付宝要求全局唯一；既有 Waffo 订单该字段为 NULL，MySQL 允许多个 NULL）
CREATE UNIQUE INDEX `orders_outTradeNo_key` ON `orders`(`outTradeNo`);
-- 异步通知幂等去重 / 交易号回查加速
CREATE INDEX `orders_alipayTradeNo_idx` ON `orders`(`alipayTradeNo`);
CREATE INDEX `orders_alipayNotifyId_idx` ON `orders`(`alipayNotifyId`);
