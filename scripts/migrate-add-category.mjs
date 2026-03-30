import { createClient } from "@libsql/client";

const TURSO_URL = process.env.TURSO_DATABASE_URL;
const TURSO_TOKEN = process.env.TURSO_AUTH_TOKEN;

if (!TURSO_URL || !TURSO_TOKEN) {
  console.error("TURSO_DATABASE_URL と TURSO_AUTH_TOKEN を環境変数に設定してください");
  process.exit(1);
}

const client = createClient({ url: TURSO_URL, authToken: TURSO_TOKEN });

try {
  await client.execute(
    `ALTER TABLE "Task" ADD COLUMN "category" TEXT NOT NULL DEFAULT 'INTERNAL'`
  );
  console.log("✓ カテゴリカラムを Task テーブルに追加しました");
} catch (err) {
  const msg = err?.message ?? String(err);
  if (msg.includes("duplicate column") || msg.includes("already exists")) {
    console.log("✓ カラムは既に存在しています（スキップ）");
  } else {
    console.error("マイグレーション失敗:", err);
    process.exit(1);
  }
} finally {
  client.close();
}
