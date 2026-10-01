#!/usr/bin/env bash
# 用法: scripts/deploy.sh [remote|local] [rollback]
#   环境变量 DEPLOY_HOST / DEPLOY_PORT / DEPLOY_DIR 可覆盖预设，SKIP_BUILD=1 跳过构建
set -euo pipefail

target=${1:-remote}
action=${2:-deploy}

case $target in
  remote) host=user@deploy-host.example;   port=22;   dir=/var/www/app ;;
  local)  host=user@127.0.0.1;  port=22; dir=/var/www/app ;;
  *) echo "未知目标: $target（可选 remote / local）" >&2; exit 1 ;;
esac
host=${DEPLOY_HOST:-$host}
port=${DEPLOY_PORT:-$port}
dir=${DEPLOY_DIR:-$dir}

ssh_run() { ssh -p "$port" -o ConnectTimeout=10 "$host" "$@"; }

if [[ $action == rollback ]]; then
  echo "==> 回滚 $host:$dir"
  ssh_run "set -e; test -d '$dir.bak' || { echo '没有可回滚的备份' >&2; exit 1; }
    rm -rf '$dir.new'; mv '$dir' '$dir.new'; mv '$dir.bak' '$dir'; mv '$dir.new' '$dir.bak'"
  echo "==> 已回滚（当前版本与上一版本已互换）"
  exit 0
fi

cd "$(dirname "$0")/.."

if [[ ${SKIP_BUILD:-} != 1 ]]; then
  echo "==> 构建"
  pnpm build
fi
test -f dist/index.html || { echo "dist/index.html 不存在，请先构建" >&2; exit 1; }

echo "==> 上传到 $host:$dir（端口 $port）"
tar -C dist -czf - . | ssh_run "set -e
  rm -rf '$dir.new' && mkdir -p '$dir.new'
  tar -xzf - --no-same-owner -C '$dir.new'
  chmod -R a+rX '$dir.new'
  rm -rf '$dir.bak'
  if [ -d '$dir' ]; then mv '$dir' '$dir.bak'; fi
  mv '$dir.new' '$dir'"

echo "==> 部署完成，上一版本保留在 $dir.bak（回滚: scripts/deploy.sh $target rollback）"
