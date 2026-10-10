#!/usr/bin/env bash
# LP と app の禁止パターン検査。ci.yml と autopilot の自動マージ判定の両方から使う（引数: 検査するフォルダ。既定はカレント）
set -e
cd "${1:-.}"
TARGETS="app/js app/index.html index.html lp.css"

echo "-- innerHTML代入の検出 --"
if grep -RnE 'innerHTML\s*=' $TARGETS; then
  echo "innerHTML への代入が見つかりました。禁止です。"
  exit 1
fi

echo "-- outerHTML代入の検出 --"
if grep -RnE 'outerHTML\s*=' $TARGETS; then
  echo "outerHTML への代入が見つかりました。禁止です。"
  exit 1
fi

echo "-- insertAdjacentHTML の検出 --"
if grep -RnE 'insertAdjacentHTML' $TARGETS; then
  echo "insertAdjacentHTML() の使用が見つかりました。禁止です。"
  exit 1
fi

echo "-- srcdoc の検出 --"
if grep -RnE 'srcdoc' $TARGETS; then
  echo "srcdoc の使用が見つかりました。禁止です。"
  exit 1
fi

echo "-- HTML属性形式のインラインイベントハンドラの検出(onclick= 等) --"
if grep -RnE '\bon[a-z]+\s*=\s*["'"'"']' $TARGETS; then
  echo "HTML属性形式のインラインイベントハンドラが見つかりました。禁止です。"
  exit 1
fi

echo "-- setAttribute(\"onXXX\", ...) の検出 --"
if grep -RnE 'setAttribute\(\s*["'"'"']on' $TARGETS; then
  echo "setAttribute()でのイベントハンドラ属性設定が見つかりました。禁止です。"
  exit 1
fi

echo "-- 'inner'+'HTML' 等の連結によるinnerHTML/outerHTML迂回の検出 --"
if grep -RnE '["'"'"']inner["'"'"']\s*\+|\+\s*["'"'"']HTML["'"'"']' $TARGETS; then
  echo "innerHTML/outerHTMLを文字列連結で組み立てている箇所が見つかりました。禁止です。"
  exit 1
fi

echo "-- eval の検出 --"
if grep -RnE 'eval\(' $TARGETS; then
  echo "eval() の使用が見つかりました。禁止です。"
  exit 1
fi

echo "-- new Function の検出 --"
if grep -RnE 'new Function' $TARGETS; then
  echo "new Function() の使用が見つかりました。禁止です。"
  exit 1
fi

echo "-- document.write の検出 --"
if grep -RnE 'document\.write' $TARGETS; then
  echo "document.write() の使用が見つかりました。禁止です。"
  exit 1
fi

echo "-- 外部URLの検出(SVG名前空間 w3.org/2000/svg とGitHubリンクは許可) --"
if grep -RnE 'https?://' app/js app/index.html | grep -v 'w3\.org/2000/svg'; then
  echo "app/ に外部URLが見つかりました。依存/CDN/フォント等の外部参照は禁止です。"
  exit 1
fi
if grep -RnE 'https?://' index.html | grep -v 'github\.com'; then
  echo "LP に github.com 以外の外部URLが見つかりました。"
  exit 1
fi

echo "-- CSPメタタグの存在チェック(LP + app) --"
for f in index.html app/index.html; do
  if ! grep -q "default-src 'none'" "$f"; then
    echo "$f に想定のCSPが見つかりません。"
    exit 1
  fi
done

echo "-- improve.yml の allowedTools に危険な全体ワイルドカードがないかの検出 --"
# improve.yml は不特定多数が書いたX返信・Issue本文を「信用できない入力」として
# 書き込み権限ありのAIエージェントに読ませる。Bash(gh:*)/Bash(git:*)/Bash(node:*) のような
# 全体ワイルドカードを許すと、プロンプト注入で gh secret / gh api / gh workflow run /
# gh pr merge / node -e 等の任意実行まで通ってしまうため禁止する。
if [ -f .github/workflows/improve.yml ] && grep -nE '^\s*claude_args:' .github/workflows/improve.yml | grep -qE 'Bash\((gh|git|node):\*\)'; then
  grep -nE '^\s*claude_args:' .github/workflows/improve.yml
  echo "improve.yml の allowedTools に Bash(gh:*)/Bash(git:*)/Bash(node:*) のような全体ワイルドカードが見つかりました。禁止です。"
  exit 1
fi

echo "OK: 禁止パターンは検出されませんでした"
