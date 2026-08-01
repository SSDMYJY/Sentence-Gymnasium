#!/usr/bin/env bash
# Set EdgeOne Makers env vars from the local .env file (secrets never echoed).
#
# EdgeOne Makers 限制：变量名 ≤ 255 字节，变量值 ≤ 500 字节。
# 注意：Waffo 支付配置（商户 ID / 私钥 / 产品 ID）已改为存数据库 app_config 表，
# 不走环境变量 — 请使用 `npx tsx scripts/seed-waffo-config.ts` 写入。
#
# Usage: PAGES_SOURCE=skills bash scripts/set-makers-env.sh
#
# 注意：CLI v1.6.19 的 env 命令在部分环境（浏览器登录）可能静默失效，
# 若本脚本设置的变量在 `edgeone makers env ls` 中看不到，请在
# EdgeOne Makers 控制台 → 项目设置 → 环境变量 中手动配置。

set -a
# shellcheck disable=SC1091
. ./.env
set +a

set_env() {
  local key="$1" val="$2"
  if [ -z "$val" ]; then
    echo "[skip] $key (empty)"
    return
  fi
  local bytes=${#val}
  if [ "$bytes" -gt 500 ]; then
    echo "[warn] $key is ${bytes} bytes (>500). Please configure in the console or store in the database."
    return
  fi
  local out
  out=$(PAGES_SOURCE=skills edgeone makers env set "$key" "$val" 2>&1 | tail -1)
  echo "[set]  $key (${bytes} bytes) -> $out"
}

# 普通环境变量
KEYS=(
  DATABASE_URL
  AI_API_KEY
  AI_BASE_URL
  AI_MODEL
  AUTH_SECRET
  NUXT_SECRET
  NUXT_PUBLIC_TURNSTILE_SITE_KEY
  NUXT_TURNSTILE_SECRET_KEY
)
for key in "${KEYS[@]}"; do
  set_env "$key" "${!key}"
done

echo "Done."


