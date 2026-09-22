#!/usr/bin/env bash
# app/ が正本。iOS には実行に必要な Web ファイルだけを同期する。
set -euo pipefail
cd "$(dirname "$0")/.."

mkdir -p www-ios
rsync -a --delete --delete-excluded \
  --include='/index.html' \
  --include='/css/' --include='/css/***' \
  --include='/js/' --include='/js/***' \
  --include='/icon.svg' \
  --include='/manifest.webmanifest' \
  --exclude='*' \
  app/ www-ios/

npx cap sync ios
