import type React from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isAdmin } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import Header from "@/components/layout/Header";
import Link from "next/link";
import DeadlineBadge from "@/components/ui/DeadlineBadge";
import ProgressBar from "@/components/ui/ProgressBar";
import Avatar from "@/components/ui/Avatar";
import { TASK_STATUS_LABELS, TASK_STATUS_COLORS } from "@/types";

function StatCard({
  label,
  value,
  color,
  icon,
  bg,
}: {
  label: string;
  value: number;
  color: string;
  icon: React.ReactNode;
  bg: string;
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 flex items-center gap-4">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${bg}`}>
        {icon}
      </div>
      <div>
        <p className="text-xs text-gray-500 mb-0.5">{label}</p>
        <p className={`text-2xl font-bold ${color}`}>{value}</p>
      </div>
    </div>
  );
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  const admin = isAdmin(session);

  const where = admin ? {} : { assigneeId: session?.user?.id };

  const [tasks, overdueCount, soonCount] = await Promise.all([
    prisma.task.findMany({
      where,
      include: {
        assignee: { select: { id: true, name: true, email: true } },
        subTasks: { orderBy: { order: "asc" } },
      },
      orderBy: { updatedAt: "desc" },
      take: 10,
    }),
    prisma.task.count({
      where: {
        ...where,
        deadline: { lt: new Date() },
        status: { not: "DONE" },
      },
    }),
    prisma.task.count({
      where: {
        ...where,
        deadline: {
          gte: new Date(),
          lt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        },
        status: { not: "DONE" },
      },
    }),
  ]);

  const total = await prisma.task.count({ where });
  const done = tasks.filter((t) => t.status === "DONE").length;
  const inProgress = tasks.filter((t) => t.status === "IN_PROGRESS").length;

  const alertTasks = await prisma.task.findMany({
    where: {
      ...where,
      deadline: { lt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) },
      status: { not: "DONE" },
    },
    include: { assignee: { select: { id: true, name: true, email: true } } },
    orderBy: { deadline: "asc" },
    take: 5,
  });

  // サブタスク期限アラート（3日以内 or 超過、かつ未完了）
  const alertSubTasks = await prisma.subTask.findMany({
    where: {
      isCompleted: false,
      deadline: { lt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) },
      task: admin ? {} : { assigneeId: session?.user?.id },
    },
    include: {
      task: {
        select: {
          id: true,
          title: true,
          assignee: { select: { id: true, name: true, email: true } },
        },
      },
    },
    orderBy: { deadline: "asc" },
    take: 5,
  });

  return (
    <div className="flex flex-col h-full">
      <Header title="ダッシュボード" />
      <div className="flex-1 overflow-auto p-6">
        {/* あいさつバナー */}
        <div className="flex items-center justify-between bg-white border border-emerald-100 rounded-2xl px-6 py-4 mb-6 shadow-sm overflow-hidden relative">
          <div>
            <p className="text-gray-500 text-sm">おかえりなさい 👋</p>
            <p className="text-xl font-bold text-gray-800 mt-0.5">
              {session?.user?.name} さん
            </p>
          </div>
          {/* キャラクター（ロゴ上部をクロップして表示） */}
          <div className="w-20 h-20 overflow-hidden shrink-0 select-none">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/unpis-logo.png"
              alt=""
              className="w-full"
              style={{ height: "160%", objectFit: "cover", objectPosition: "center 5%" }}
            />
          </div>
        </div>

        {/* 統計カード */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            label="総タスク数"
            value={total}
            color="text-gray-800"
            bg="bg-gray-100"
            icon={
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            }
          />
          <StatCard
            label="進行中"
            value={inProgress}
            color="text-sky-700"
            bg="bg-sky-100"
            icon={
              <svg className="w-5 h-5 text-sky-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            }
          />
          <StatCard
            label="期限間近（3日以内）"
            value={soonCount}
            color="text-amber-700"
            bg="bg-amber-100"
            icon={
              <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
          <StatCard
            label="期限超過"
            value={overdueCount}
            color="text-red-700"
            bg="bg-red-100"
            icon={
              <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            }
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* タスク期限アラート */}
          {alertTasks.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <h2 className="font-semibold text-gray-700 mb-4 flex items-center gap-2">
                <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                タスク期限アラート
              </h2>
              <div className="space-y-3">
                {alertTasks.map((task) => (
                  <Link key={task.id} href={`/tasks/${task.id}`} className="flex items-center justify-between gap-3 hover:bg-gray-50 rounded-lg p-2 -mx-2 transition-colors">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      {task.assignee && <Avatar name={task.assignee.name} size="sm" />}
                      <span className="text-sm text-gray-700 truncate">{task.title}</span>
                    </div>
                    <DeadlineBadge deadline={task.deadline} />
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* サブタスク（ステップ）期限アラート */}
          {alertSubTasks.length > 0 && (
            <div className="bg-white border border-orange-200 rounded-xl p-5">
              <h2 className="font-semibold text-gray-700 mb-4 flex items-center gap-2">
                <svg className="w-4 h-4 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
                ステップ期限アラート
              </h2>
              <div className="space-y-3">
                {alertSubTasks.map((sub) => (
                  <Link key={sub.id} href={`/tasks/${sub.task.id}`} className="flex items-center justify-between gap-3 hover:bg-orange-50 rounded-lg p-2 -mx-2 transition-colors">
                    <div className="flex flex-col flex-1 min-w-0">
                      <span className="text-xs text-gray-400 truncate">{sub.task.title}</span>
                      <div className="flex items-center gap-1.5">
                        <svg className="w-3 h-3 text-orange-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                        </svg>
                        <span className="text-sm text-gray-700 truncate">{sub.title}</span>
                      </div>
                    </div>
                    <DeadlineBadge deadline={sub.deadline} />
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* 最近のタスク */}
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-700">最近のタスク</h2>
              <Link href="/tasks" className="text-xs text-emerald-600 hover:underline">
                すべて見る
              </Link>
            </div>
            <div className="space-y-3">
              {tasks.slice(0, 6).map((task) => (
                <Link key={task.id} href={`/tasks/${task.id}`} className="flex items-center gap-3 hover:bg-gray-50 rounded-lg p-2 -mx-2 transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-700 truncate font-medium">{task.title}</p>
                    {task.subTasks.length > 0 && (
                      <div className="mt-1">
                        <ProgressBar value={task.progress} showLabel={false} />
                      </div>
                    )}
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${TASK_STATUS_COLORS[task.status as keyof typeof TASK_STATUS_COLORS]}`}>
                    {TASK_STATUS_LABELS[task.status as keyof typeof TASK_STATUS_LABELS]}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
