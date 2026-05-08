#!/bin/bash
set -Eeuo pipefail

REQUIRED_NODE_VERSION="${NODE24_VERSION:-24.11.1}"

major_version() {
  "$1" -p "Number(process.versions.node.split('.')[0])" 2>/dev/null || echo 0
}

is_node24() {
  local candidate="$1"
  [[ -x "${candidate}" ]] && [[ "$(major_version "${candidate}")" -ge 24 ]]
}

find_cached_node24() {
  local npm_cache_root="${HOME:-}/.npm/_npx"
  [[ -d "${npm_cache_root}" ]] || return 1

  while IFS= read -r candidate; do
    if is_node24 "${candidate}"; then
      echo "${candidate}"
      return 0
    fi
  done < <(find "${npm_cache_root}" -path "*/node_modules/node/bin/node" -type f 2>/dev/null)

  return 1
}

NODE24_BIN="${NODE24_BIN:-}"

if [[ -n "${NODE24_BIN}" ]]; then
  if ! is_node24 "${NODE24_BIN}"; then
    echo "NODE24_BIN does not point to Node 24+: ${NODE24_BIN}" >&2
    exit 1
  fi
elif command -v node >/dev/null 2>&1 && is_node24 "$(command -v node)"; then
  NODE24_BIN="$(command -v node)"
else
  NODE24_BIN="$(find_cached_node24 || true)"
fi

if [[ -z "${NODE24_BIN}" ]] && command -v npx >/dev/null 2>&1; then
  echo "Node 24 not found locally; attempting to fetch node@${REQUIRED_NODE_VERSION} with npx..." >&2
  npx --yes "node@${REQUIRED_NODE_VERSION}" --version >/dev/null
  NODE24_BIN="$(find_cached_node24 || true)"
fi

if [[ -z "${NODE24_BIN}" ]]; then
  echo "Node 24 is not available. Install Node 24, set NODE24_BIN, or allow npx to fetch node@${REQUIRED_NODE_VERSION}." >&2
  exit 1
fi

export PATH="$(dirname "${NODE24_BIN}"):${PATH}"

if [[ "$#" -eq 0 ]]; then
  node --version
  exit 0
fi

echo "Using $(node --version) from ${NODE24_BIN}" >&2
exec "$@"
