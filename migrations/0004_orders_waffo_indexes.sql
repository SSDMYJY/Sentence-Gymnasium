-- CreateIndex
-- Webhook 幂等去重查询（waffoEventId）与 Waffo 订单号回查（waffoOrderId）加速
CREATE INDEX `orders_waffoEventId_idx` ON `orders`(`waffoEventId`);
CREATE INDEX `orders_waffoOrderId_idx` ON `orders`(`waffoOrderId`);
