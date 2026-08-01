#!/usr/bin/env bash
# Set EdgeOne Makers env vars from the local .env file (secrets never echoed).
#
# EdgeOne Makers 限制：变量名 ≤ 255 字节，变量值 ≤ 500 字节。
# WAFFO_PRIVATE_KEY（RSA PEM ~1700 字节）会自动分段为
# WAFFO_PRIVATE_KEY_PART_1..N（每段 ≤ 450 字节），应用运行时拼接。
#
# Usage: PAGES_SOURCE=skills bash scripts/set-makers-env.sh
#
# 注意：CLI v1.6.19 的 env 命令在部分环境（浏览器登录）可能静默失效，
# 若本脚本设置的变量在 `edgeone makers env ls` 中看不到，请在
# EdgeOne Makers 控制台 → 项目设置 → 环境变量 中手动配置（值同上，私钥分段）。

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
    echo "[warn] $key is ${bytes} bytes (>500). Use WAFFO_PRIVATE_KEY_PART_* for this value."
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
  WAFFO_MERCHANT_ID
  WAFFO_PRODUCT_PACK_100
  WAFFO_PRODUCT_PACK_500
  WAFFO_PRODUCT_PACK_1500
)
for key in "${KEYS[@]}"; do
  set_env "$key" "${!key}"
done

# Waffo 私钥：超 450 字节时按 450 字节分段（每段 < 500 字节上限）
if [ -n "$WAFFO_PRIVATE_KEY" ]; then
  if [ "${#WAFFO_PRIVATE_KEY}" -gt 450 ]; then
    local_key="$WAFFO_PRIVATE_KEY"
    i=1
    while [ -n "$local_key" ]; do
      part="${local_key:0:450}"
      set_env "WAFFO_PRIVATE_KEY_PART_$i" "$part"
      local_key="${local_key:450}"
      i=$((i + 1))
    done
    echo "[set]  WAFFO_PRIVATE_KEY -> split into $((i - 1)) parts (PART_1..PART_$((i - 1)))"
  else
    set_env "WAFFO_PRIVATE_KEY" "$WAFFO_PRIVATE_KEY"
  fi
fi

echo "Done."

