import { fileURLToPath, pathToFileURL } from "url";
import { dirname, join } from "path";
import bcrypt from "bcryptjs";
import { PrismaLibSql } from "@prisma/adapter-libsql";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const clientPath = join(__dirname, "../src/generated/prisma/client.ts");
const { PrismaClient } = await import(pathToFileURL(clientPath).href);

const dbAbsPath = join(__dirname, "../dev.db");
const adapter = new PrismaLibSql({ url: `file:${dbAbsPath}` });
const prisma = new PrismaClient({ adapter });

async function main() {
  const adminPassword = await bcrypt.hash("admin1234", 10);
  const admin = await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: {},
    create: {
      name: "管理者 田中",
      email: "admin@example.com",
      password: adminPassword,
      role: "ADMIN",
    },
  });

  const memberPassword = await bcrypt.hash("member1234", 10);
  const members = await Promise.all([
    prisma.user.upsert({
      where: { email: "sato@example.com" },
      update: {},
      create: { name: "佐藤 花子", email: "sato@example.com", password: memberPassword, role: "MEMBER" },
    }),
    prisma.user.upsert({
      where: { email: "suzuki@example.com" },
      update: {},
      create: { name: "鈴木 一郎", email: "suzuki@example.com", password: memberPassword, role: "MEMBER" },
    }),
    prisma.user.upsert({
      where: { email: "yamada@example.com" },
      update: {},
      create: { name: "山田 美咲", email: "yamada@example.com", password: memberPassword, role: "MEMBER" },
    }),
    prisma.user.upsert({
      where: { email: "ito@example.com" },
      update: {},
      create: { name: "伊藤 健太", email: "ito@example.com", password: memberPassword, role: "MEMBER" },
    }),
  ]);

  await prisma.task.create({
    data: {
      title: "新入社員研修資料の作成",
      description: "4月入社向けの研修コンテンツ一式を作成する",
      priority: "HIGH",
      status: "IN_PROGRESS",
      deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      progress: 40,
      assigneeId: members[0].id,
      createdById: admin.id,
      subTasks: {
        create: [
          { title: "①案だし", isCompleted: true, order: 1 },
          { title: "②アウトライン策定", isCompleted: true, order: 2 },
          { title: "③中間確認", isCompleted: false, order: 3 },
          { title: "④構成・デザイン", isCompleted: false, order: 4 },
          { title: "⑤最終確認", isCompleted: false, order: 5 },
          { title: "⑥クライアントへ提出", isCompleted: false, order: 6 },
        ],
      },
    },
  });

  await prisma.task.create({
    data: {
      title: "Q2マーケティング企画書",
      description: "第2四半期のマーケティング戦略をまとめた企画書を作成",
      priority: "MEDIUM",
      status: "TODO",
      deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      progress: 0,
      assigneeId: members[1].id,
      createdById: admin.id,
      subTasks: {
        create: [
          { title: "①市場調査", isCompleted: false, order: 1 },
          { title: "②競合分析", isCompleted: false, order: 2 },
          { title: "③施策案の検討", isCompleted: false, order: 3 },
          { title: "④予算策定", isCompleted: false, order: 4 },
          { title: "⑤承認・提出", isCompleted: false, order: 5 },
        ],
      },
    },
  });

  await prisma.task.create({
    data: {
      title: "月次報告書の作成",
      description: "先月分の業績報告書をまとめる",
      priority: "HIGH",
      status: "IN_PROGRESS",
      deadline: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      progress: 60,
      assigneeId: members[2].id,
      createdById: admin.id,
      subTasks: {
        create: [
          { title: "①データ収集", isCompleted: true, order: 1 },
          { title: "②集計・分析", isCompleted: true, order: 2 },
          { title: "③レポート作成", isCompleted: true, order: 3 },
          { title: "④上司確認", isCompleted: false, order: 4 },
          { title: "⑤提出", isCompleted: false, order: 5 },
        ],
      },
    },
  });

  await prisma.task.create({
    data: {
      title: "チームミーティングの議事録作成",
      description: "3月定例ミーティングの議事録",
      priority: "LOW",
      status: "DONE",
      deadline: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      progress: 100,
      assigneeId: members[3].id,
      createdById: admin.id,
      subTasks: {
        create: [
          { title: "①議事録下書き", isCompleted: true, order: 1 },
          { title: "②参加者へ確認送付", isCompleted: true, order: 2 },
          { title: "③最終版を共有フォルダに保存", isCompleted: true, order: 3 },
        ],
      },
    },
  });

  await prisma.task.create({
    data: {
      title: "採用面接の調整",
      description: "来週の採用候補者との面接日程を調整する",
      priority: "MEDIUM",
      status: "TODO",
      deadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      progress: 0,
      assigneeId: members[0].id,
      createdById: admin.id,
    },
  });

  console.log("シードデータの投入が完了しました");
  console.log("管理者: admin@example.com / admin1234");
  console.log("メンバー: sato@example.com / member1234 (他3名も同じパスワード)");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
