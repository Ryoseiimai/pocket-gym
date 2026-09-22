#!/usr/bin/env node
// 目的: マージ後のPocket Gym本番を撮影し、募集ポストのスレッドに「Day N: <title>」で返信する。
// 1日1投稿まで（threads.jsonのposts[].dateが今日と一致すれば何もしない）。
// LLMは使わない（文言はPRのautopilot JSONからテンプレで組む）。
//
// 環境変数: X_CONSUMER_KEY, X_CONSUMER_SECRET, X_ACCESS_TOKEN, X_ACCESS_TOKEN_SECRET
// 引数: --title "..." --summary "..." --screenshot-url "https://ryoseiimai.github.io/pocket-gym/app/" --dry-run

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { buildOAuthHeader } from './oauth1.mjs';
import { chromium } from 'playwright';

const ROOT = new URL('../../', import.meta.url).pathname;
const THREADS_PATH = ROOT + 'autopilot/threads.json';

function parseArgs() {
  const args = process.argv.slice(2);
  const out = { dryRun: false };
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--title') out.title = args[++i];
    else if (args[i] === '--summary') out.summary = args[++i];
    else if (args[i] === '--screenshot-url') out.screenshotUrl = args[++i];
    else if (args[i] === '--dry-run') out.dryRun = true;
  }
  return out;
}

function loadThreads() {
  return JSON.parse(readFileSync(THREADS_PATH, 'utf8'));
}
function saveThreads(state) {
  writeFileSync(THREADS_PATH, JSON.stringify(state, null, 2) + '\n');
}

function creds() {
  const c = {
    consumerKey: process.env.X_CONSUMER_KEY,
    consumerSecret: process.env.X_CONSUMER_SECRET,
    token: process.env.X_ACCESS_TOKEN,
    tokenSecret: process.env.X_ACCESS_TOKEN_SECRET,
  };
  for (const [k, v] of Object.entries(c)) {
    if (!v) throw new Error(`X認証情報が不足しています: ${k}`);
  }
  return c;
}

async function screenshot(url, outPath) {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 430, height: 932 } });
  await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: outPath });
  await browser.close();
}

async function uploadMedia(pngBuffer, cred) {
  const url = 'https://upload.twitter.com/1.1/media/upload.json';
  const authHeader = buildOAuthHeader({ method: 'POST', url, params: {}, ...cred });

  const form = new FormData();
  form.append('media', new Blob([pngBuffer], { type: 'image/png' }), 'screenshot.png');

  const res = await fetch(url, {
    method: 'POST',
    headers: { Authorization: authHeader },
    body: form,
  });
  const json = await res.json();
  if (!res.ok) throw new Error(`media upload失敗: ${res.status} ${JSON.stringify(json)}`);
  return json.media_id_string;
}

async function postTweet({ text, mediaId, replyToId, cred }) {
  const url = 'https://api.twitter.com/2/tweets';
  const authHeader = buildOAuthHeader({ method: 'POST', url, params: {}, ...cred });

  const body = { text };
  if (mediaId) body.media = { media_ids: [mediaId] };
  if (replyToId) body.reply = { in_reply_to_tweet_id: replyToId };

  const res = await fetch(url, {
    method: 'POST',
    headers: { Authorization: authHeader, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  if (res.status === 402) throw new Error('402 Payment Required: X APIクレジット枯渇');
  if (!res.ok) throw new Error(`tweet投稿失敗: ${res.status} ${JSON.stringify(json)}`);
  return json.data;
}

async function main() {
  const args = parseArgs();
  const state = loadThreads();
  const todayStr = new Date().toISOString().slice(0, 10);

  if ((state.posts || []).some((p) => p.date === todayStr)) {
    console.log('[announce] 本日は投稿済みのため終了します。');
    return;
  }

  const dayNumber = (state.day_count || 1) + 1;
  const title = args.title || '改善しました';
  const summary = args.summary ? `\n${args.summary}` : '';
  const text = `Day ${dayNumber}: ${title}${summary}`.slice(0, 260);
  const screenshotUrl = args.screenshotUrl || 'https://ryoseiimai.github.io/pocket-gym/app/';
  const replyToId = state.posts?.length ? state.posts[state.posts.length - 1].tweet_id : state.root_tweet_id;

  console.log(`[announce] Day ${dayNumber} / reply_to=${replyToId}`);
  console.log(`[announce] 本文:\n${text}`);

  const shotPath = ROOT + 'autopilot/latest-screenshot.png';
  await screenshot(screenshotUrl, shotPath);
  console.log(`[announce] スクショ保存: ${shotPath}`);

  if (args.dryRun) {
    console.log('[announce] dry-run のため投稿はしません。');
    return;
  }

  const cred = creds();
  const pngBuffer = readFileSync(shotPath);
  const mediaId = await uploadMedia(pngBuffer, cred);
  console.log(`[announce] media_id=${mediaId}`);

  const tweet = await postTweet({ text, mediaId, replyToId, cred });
  console.log(`[announce] 投稿完了: https://x.com/ryoseichan3160/status/${tweet.id}`);

  state.day_count = dayNumber;
  state.posts = state.posts || [];
  state.posts.push({ day: dayNumber, tweet_id: tweet.id, date: todayStr, title });
  saveThreads(state);
}

main().catch((e) => {
  console.error('[announce] 致命的エラー:', e.message);
  process.exit(1);
});
