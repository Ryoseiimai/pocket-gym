#!/usr/bin/env node
// 目的: X (conversation_id の返信・引用) と GitHub Issues/Discussions の新着コメントを集めて、
// LLMを使わずに正規化した「声」だけを autopilot/inbox/YYYY-MM-DD.json に書き出す。
// 意図的簡略化: X検索は無料の recent search (直近7日) のみ・1日最大100件・LLMはここでは一切呼ばない
// (返信本文は信用できない入力なので、鍵を持つこの段では要約・判断をしない)。
//
// 必要な環境変数:
//   X_CONSUMER_KEY, X_CONSUMER_SECRET  … app-only bearer をここで動的生成する（保存不要）
//   GH_TOKEN … gh CLI 用（Issues/Discussions 取得。読み取りのみ）
//
// 出力: autopilot/inbox/YYYY-MM-DD.json （無ければ作らない＝空なら何も書かない）
//       autopilot/threads.json のカーソルを更新（x_search_since_id / github_last_collect_at）

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const ROOT = new URL('../../', import.meta.url).pathname;
const THREADS_PATH = ROOT + 'autopilot/threads.json';
const MAX_X_ITEMS = 100;
const MAX_TEXT_LEN = 500;

function loadThreads() {
  return JSON.parse(readFileSync(THREADS_PATH, 'utf8'));
}
function saveThreads(state) {
  writeFileSync(THREADS_PATH, JSON.stringify(state, null, 2) + '\n');
}

// 本文だけを取り出し、URL・制御文字を除去して長さ制限する（プロンプトインジェクション対策の一部）。
function sanitizeText(raw) {
  if (!raw) return '';
  let t = String(raw);
  t = t.replace(/https?:\/\/\S+/g, '[URL除去]');
  // 制御文字除去（改行・タブは残す）
  t = t.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '');
  t = t.trim();
  if (t.length > MAX_TEXT_LEN) t = t.slice(0, MAX_TEXT_LEN) + '…(切り詰め)';
  return t;
}

async function getBearerToken() {
  const key = process.env.X_CONSUMER_KEY;
  const secret = process.env.X_CONSUMER_SECRET;
  if (!key || !secret) throw new Error('X_CONSUMER_KEY / X_CONSUMER_SECRET が未設定です');
  const basic = Buffer.from(`${encodeURIComponent(key)}:${encodeURIComponent(secret)}`).toString('base64');
  const res = await fetch('https://api.twitter.com/oauth2/token', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basic}`,
      'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
    },
    body: 'grant_type=client_credentials',
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`bearer token 取得失敗: ${res.status} ${body}`);
  }
  const json = await res.json();
  return json.access_token;
}

async function collectX(state) {
  const items = [];
  let bearer;
  try {
    bearer = await getBearerToken();
  } catch (e) {
    console.error('[X] bearer取得失敗、Xの収集をスキップ:', e.message);
    return { items, sinceId: state.x_search_since_id };
  }

  const convId = state.root_conversation_id;
  const params = new URLSearchParams({
    query: `conversation_id:${convId} -from:ryoseichan3160`,
    max_results: '100',
    'tweet.fields': 'author_id,created_at,conversation_id,referenced_tweets',
  });
  if (state.x_search_since_id) params.set('since_id', state.x_search_since_id);

  const url = `https://api.twitter.com/2/tweets/search/recent?${params.toString()}`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${bearer}` } });

  if (res.status === 402) {
    console.error('[X] 402 Payment Required: クレジット枯渇の可能性。ここで停止して報告用に印を残す。');
    writeFileSync(ROOT + 'autopilot/X_QUOTA_EXHAUSTED.flag', new Date().toISOString());
    return { items, sinceId: state.x_search_since_id };
  }
  if (!res.ok) {
    const body = await res.text();
    console.error(`[X] search失敗: ${res.status} ${body}`);
    return { items, sinceId: state.x_search_since_id };
  }

  const json = await res.json();
  const tweets = (json.data || []).slice(0, MAX_X_ITEMS);
  let newestId = state.x_search_since_id;
  for (const t of tweets) {
    if (!newestId || BigInt(t.id) > BigInt(newestId)) newestId = t.id;
    items.push({
      source: 'x',
      id: t.id,
      text: sanitizeText(t.text),
    });
  }
  return { items, sinceId: newestId };
}

function ghApi(args) {
  try {
    return execFileSync('gh', ['api', ...args], { encoding: 'utf8' });
  } catch (e) {
    console.error('[gh api] 失敗:', args.join(' '), e.message);
    return null;
  }
}

function collectGithub(state) {
  const items = [];
  const repo = process.env.GH_REPO || 'Ryoseiimai/pocket-gym';
  // 初回実行(state未設定)は直近24時間分だけ拾う。固定の絶対日付をハードコードしない。
  const since = state.github_last_collect_at || new Date(Date.now() - 24 * 3600 * 1000).toISOString();

  // Issueコメント（新規Issue本文も含む: issuesエンドポイントで created>=since のものを拾う）
  const issuesRaw = ghApi([
    `repos/${repo}/issues`,
    '-X', 'GET',
    '-f', 'state=all',
    '-f', 'since=' + since,
    '-f', 'per_page=50',
  ]);
  if (issuesRaw) {
    try {
      const issues = JSON.parse(issuesRaw);
      for (const it of issues) {
        if (it.pull_request) continue; // PRは除外
        items.push({
          source: 'github_issue',
          id: `issue-${it.number}`,
          text: sanitizeText(`${it.title}\n${it.body || ''}`),
        });
      }
    } catch (e) {
      console.error('[gh] issues parse失敗:', e.message);
    }
  }

  // Discussions は GraphQL が必要。存在すれば拾う（失敗時は無視）。
  const discRaw = ghApi([
    'graphql',
    '-f', `query=query($owner:String!,$name:String!){repository(owner:$owner,name:$name){discussions(first:20, orderBy:{field:UPDATED_AT,direction:DESC}){nodes{number title body updatedAt}}}}`,
    '-f', `owner=${repo.split('/')[0]}`,
    '-f', `name=${repo.split('/')[1]}`,
  ]);
  if (discRaw) {
    try {
      const parsed = JSON.parse(discRaw);
      const nodes = parsed?.data?.repository?.discussions?.nodes || [];
      for (const d of nodes) {
        if (new Date(d.updatedAt) < new Date(since)) continue;
        items.push({
          source: 'github_discussion',
          id: `discussion-${d.number}`,
          text: sanitizeText(`${d.title}\n${d.body || ''}`),
        });
      }
    } catch (e) {
      console.error('[gh] discussions parse失敗:', e.message);
    }
  }

  return items;
}

async function main() {
  const state = loadThreads();
  const dateStr = new Date().toISOString().slice(0, 10);

  const { items: xItems, sinceId } = await collectX(state);
  const ghItems = collectGithub(state);

  const allItems = [...xItems, ...ghItems];
  console.log(`[collect] X: ${xItems.length}件 / GitHub: ${ghItems.length}件`);

  state.x_search_since_id = sinceId;
  state.github_last_collect_at = new Date().toISOString();
  saveThreads(state);

  if (allItems.length === 0) {
    console.log('[collect] 新着なし。inboxファイルは作成しません。');
    return;
  }

  const outPath = `${ROOT}autopilot/inbox/${dateStr}.json`;
  let existing = [];
  if (existsSync(outPath)) {
    existing = JSON.parse(readFileSync(outPath, 'utf8'));
  }
  writeFileSync(outPath, JSON.stringify(existing.concat(allItems), null, 2) + '\n');
  console.log(`[collect] 書き出し: ${outPath}`);
}

main().catch((e) => {
  console.error('[collect] 致命的エラー:', e);
  process.exit(1);
});
