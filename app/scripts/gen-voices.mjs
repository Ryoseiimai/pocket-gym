#!/usr/bin/env node
// コーチのセリフ音声をローカルの VOICEVOX ENGINE で生成する開発用スクリプト。
// 事前に `docker run -d --name voicevox-coach -p 50021:50021 voicevox/voicevox_engine:cpu-latest` で
// エンジンを起動しておくこと(colima が止まっていれば `colima start` してから)。
//
// 使い方: node scripts/gen-voices.mjs (app/ ディレクトリから実行)
// 出力: voice/<coachId>/<lineId>.m4a (モノラル・AAC 64kbps)
//
// アプリ本体(js/以下)は依存ゼロだが、このスクリプトは開発時にしか使わないビルドツールなので
// Node標準モジュール(fetch/fs/child_process)だけを使い、npm依存は追加しない。

import { spawn } from "node:child_process";
import { mkdir, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { allLines } from "../js/coach-lines.js";
import { COACHES } from "../js/coach-art.js";

const ENGINE_URL = process.env.VOICEVOX_URL || "http://localhost:50021";
const APP_DIR = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const VOICE_DIR = path.join(APP_DIR, "voice");

function run(cmd, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { stdio: ["ignore", "ignore", "pipe"] });
    let stderr = "";
    child.stderr.on("data", (d) => (stderr += d));
    child.on("error", reject);
    child.on("close", (code) => (code === 0 ? resolve() : reject(new Error(`${cmd} exited ${code}: ${stderr}`))));
  });
}

/** /speakers から「話者名+スタイル名」でスタイルIDを引く */
async function resolveStyleId(speakerName, styleName) {
  const res = await fetch(`${ENGINE_URL}/speakers`);
  if (!res.ok) throw new Error(`/speakers failed: ${res.status}`);
  const speakers = await res.json();
  const speaker = speakers.find((s) => s.name === speakerName);
  if (!speaker) throw new Error(`speaker not found: ${speakerName}`);
  const style = speaker.styles.find((s) => s.name === styleName);
  if (!style) throw new Error(`style not found: ${speakerName}/${styleName}`);
  return style.id;
}

async function synthesize(text, styleId) {
  const queryRes = await fetch(`${ENGINE_URL}/audio_query?text=${encodeURIComponent(text)}&speaker=${styleId}`, {
    method: "POST",
  });
  if (!queryRes.ok) throw new Error(`audio_query failed: ${queryRes.status} ${await queryRes.text()}`);
  const query = await queryRes.json();

  const synthRes = await fetch(`${ENGINE_URL}/synthesis?speaker=${styleId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(query),
  });
  if (!synthRes.ok) throw new Error(`synthesis failed: ${synthRes.status} ${await synthRes.text()}`);
  return Buffer.from(await synthRes.arrayBuffer());
}

async function main() {
  const styleIdByCoach = {};
  for (const coach of COACHES) {
    styleIdByCoach[coach.id] = await resolveStyleId(coach.voicevoxSpeaker, coach.voicevoxStyle);
    console.log(`${coach.id}: ${coach.voicevoxSpeaker}/${coach.voicevoxStyle} -> style ${styleIdByCoach[coach.id]}`);
  }

  const lines = allLines();
  console.log(`生成するセリフ: ${lines.length}件`);

  let ok = 0;
  for (const line of lines) {
    const styleId = styleIdByCoach[line.coachId];
    const wavPath = path.join(tmpdir(), `pocketgym-coach-${line.id}.wav`);
    const outDir = path.join(VOICE_DIR, line.coachId);
    const outPath = path.join(outDir, `${line.id}.m4a`);
    await mkdir(outDir, { recursive: true });
    try {
      const wav = await synthesize(line.text, styleId);
      await writeFile(wavPath, wav);
      // モノラル・64kbps AAC(セリフ音声には十分な音質・容量を抑える)
      await run("ffmpeg", ["-y", "-i", wavPath, "-ac", "1", "-b:a", "64k", outPath]);
      ok += 1;
      console.log(`OK  ${line.coachId}/${line.id}.m4a`);
    } catch (err) {
      console.error(`NG  ${line.coachId}/${line.id}: ${err.message}`);
    } finally {
      await rm(wavPath, { force: true });
    }
  }

  console.log(`完了: ${ok}/${lines.length}件`);
  if (ok < lines.length) process.exitCode = 1;
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
