// Tursoデータベースにテーブルを作成してシードデータを投入するスクリプト
import { createClient } from "@libsql/client";
import bcrypt from "bcryptjs";

const TURSO_URL = process.env.TURSO_DATABASE_URL;
const TURSO_TOKEN = process.env.TURSO_AUTH_TOKEN;

if (!TURSO_URL || !TURSO_TOKEN) {
  console.error("TURSO_DATABASE_URL と TURSO_AUTH_TOKEN を設定してください");
  process.exit(1);
}

const client = createClient({ url: TURSO_URL, authToken: TURSO_TOKEN });

async function createTables() {
  console.log("テーブルを作成中...");

  await client.execute(`
    CREATE TABLE IF NOT EXISTS "User" (
      "id"        TEXT NOT NULL PRIMARY KEY,
      "name"      TEXT NOT NULL,
      "email"     TEXT NOT NULL UNIQUE,
      "password"  TEXT NOT NULL,
      "role"      TEXT NOT NULL DEFAULT 'MEMBER',
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS "Task" (
      "id"          TEXT NOT NULL PRIMARY KEY,
      "title"       TEXT NOT NULL,
      "description" TEXT,
      "priority"    TEXT NOT NULL DEFAULT 'MEDIUM',
      "status"      TEXT NOT NULL DEFAULT 'TODO',
      "deadline"    DATETIME,
      "progress"    INTEGER NOT NULL DEFAULT 0,
      "assigneeId"  TEXT REFERENCES "User"("id") ON DELETE SET NULL,
      "createdById" TEXT NOT NULL REFERENCES "User"("id"),
      "createdAt"   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt"   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS "SubTask" (
      "id"          TEXT NOT NULL PRIMARY KEY,
      "title"       TEXT NOT NULL,
      "isCompleted" INTEGER NOT NULL DEFAULT 0,
      "order"       INTEGER NOT NULL,
      "deadline"    DATETIME,
      "taskId"      TEXT NOT NULL REFERENCES "Task"("id") ON DELETE CASCADE,
      "createdAt"   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt"   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  console.log("✅ テーブル作成完了");
}

function cuid() {
  return "c" + Math.random().toString(36).slice(2, 9) + Date.now().toString(36);
}

async function seed() {
  console.log("シードデータを投入中...");

  const adminPassword = await bcrypt.hash("admin1234", 10);
  const adminId = cuid();
  const now = new Date().toISOString();

  await client.execute({
    sql: `INSERT OR IGNORE INTO "User" (id, name, email, password, role, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    args: [adminId, "管理者 田中", "admin@example.com", adminPassword, "ADMIN", now, now],
  });

  const memberPassword = await bcrypt.hash("member1234", 10);
  const memberIds = [cuid(), cuid(), cuid(), cuid()];
  const memberData = [
    [memberIds[0], "佐藤 花子", "sato@example.com"],
    [memberIds[1], "鈴木 一郎", "suzuki@example.com"],
    [memberIds[2], "山田 美咲", "yamada@example.com"],
    [memberIds[3], "伊藤 健太", "ito@example.com"],
  ];

  for (const [id, name, email] of memberData) {
    await client.execute({
      sql: `INSERT OR IGNORE INTO "User" (id, name, email, password, role, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      args: [id, name, email, memberPassword, "MEMBER", now, now],
    });
  }

  const day = 24 * 60 * 60 * 1000;
  const tasks = [
    {
      title: "新入社員研修資料の作成",
      desc: "4月入社向けの研修コンテンツ一式を作成する",
      priority: "HIGH", status: "IN_PROGRESS",
      deadline: new Date(Date.now() + 7 * day).toISOString(),
      progress: 40, assignee: memberIds[0],
      subtasks: [
        { title: "①案だし", done: true, order: 1 },
        { title: "②アウトライン策定", done: true, order: 2 },
        { title: "③中間確認", done: false, order: 3 },
        { title: "④構成・デザイン", done: false, order: 4 },
        { title: "⑤最終確認", done: false, order: 5 },
        { title: "⑥クライアントへ提出", done: false, order: 6 },
      ],
    },
    {
      title: "Q2マーケティング企画書",
      desc: "第2四半期のマーケティング戦略をまとめた企画書を作成",
      priority: "MEDIUM", status: "TODO",
      deadline: new Date(Date.now() + 14 * day).toISOString(),
      progress: 0, assignee: memberIds[1],
      subtasks: [
        { title: "①市場調査", done: false, order: 1 },
        { title: "②競合分析", done: false, order: 2 },
        { title: "③施策案の検討", done: false, order: 3 },
        { title: "④予算策定", done: false, order: 4 },
        { title: "⑤承認・提出", done: false, order: 5 },
      ],
    },
    {
      title: "月次報告書の作成",
      desc: "先月分の業績報告書をまとめる",
      priority: "HIGH", status: "IN_PROGRESS",
      deadline: new Date(Date.now() - 2 * day).toISOString(),
      progress: 60, assignee: memberIds[2],
      subtasks: [
        { title: "①データ収集", done: true, order: 1 },
        { title: "②集計・分析", done: true, order: 2 },
        { title: "③レポート作成", done: true, order: 3 },
        { title: "④上司確認", done: false, order: 4 },
        { title: "⑤提出", done: false, order: 5 },
      ],
    },
  ];

  for (const t of tasks) {
    const taskId = cuid();
    await client.execute({
      sql: `INSERT INTO "Task" (id, title, description, priority, status, deadline, progress, assigneeId, createdById, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [taskId, t.title, t.desc, t.priority, t.status, t.deadline, t.progress, t.assignee, adminId, now, now],
    });
    for (const st of t.subtasks) {
      await client.execute({
        sql: `INSERT INTO "SubTask" (id, title, isCompleted, "order", taskId, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        args: [cuid(), st.title, st.done ? 1 : 0, st.order, taskId, now, now],
      });
    }
  }

  console.log("✅ シードデータ投入完了");
  console.log("管理者: admin@example.com / admin1234");
  console.log("メンバー: sato@example.com / member1234");
}

await createTables();
await seed();
await client.close();
