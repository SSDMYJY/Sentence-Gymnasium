#!/usr/bin/env bash
# Print the Waffo private key split into EdgeOne-Makers-safe parts (≤ 450 chars
# each, under the 500-byte env value limit) for pasting into the console.
# Usage: bash scripts/waffo-key-parts.sh
set -a
# shellcheck disable=SC1091
. ./.env
set +a

if [ -z "$WAFFO_PRIVATE_KEY" ]; then
  echo "WAFFO_PRIVATE_KEY is empty in .env" >&2
  exit 1
fi

key="$WAFFO_PRIVATE_KEY"
i=1
while [ -n "$key" ]; do
  part="${key:0:450}"
  echo "WAFFO_PRIVATE_KEY_PART_${i}=${part}"
  key="${key:450}"
  i=$((i + 1))
done
echo "# Total parts: $((i - 1)) (key length: ${#WAFFO_PRIVATE_KEY})"
