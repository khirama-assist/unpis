import { notFound } from "next/navigation";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { canEditTask } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import Header from "@/components/layout/Header";
import DeadlineBadge from "@/components/ui/DeadlineBadge";
import ProgressBar from "@/components/ui/ProgressBar";
import Avatar from "@/components/ui/Avatar";
import SubTaskList from "@/components/tasks/SubTaskList";
import { TASK_STATUS_LABELS, TASK_STATUS_COLORS, PRIORITY_LABELS, PRIORITY_COLORS } from "@/types";
import TaskDetailActions from "./TaskDetailActions";

export default async function TaskDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getServerSession(authOptions);

  const task = await prisma.task.findUnique({
    where: { id },
    include: {
      assignee: { select: { id: true, name: true, email: true } },
      createdBy: { select: { id: true, name: true, email: true } },
      subTasks: { orderBy: { order: "asc" } },
    },
  });

  if (!task) notFound();

  const canEdit = canEditTask(session, task);

  const taskForClient = {
    ...task,
    deadline: task.deadline?.toISOString() ?? null,
    createdAt: task.createdAt.toISOString(),
    updatedAt: task.updatedAt.toISOString(),
    subTasks: task.subTasks.map((s) => ({
      ...s,
      deadline: s.deadline ? s.deadline.toISOString() : null,
      createdAt: s.createdAt.toISOString(),
      updatedAt: s.updatedAt.toISOString(),
    })),
  };

  return (
    <div className="flex flex-col h-full">
      <Header title="タスク詳細" />
      <div className="flex-1 overflow-auto p-4 md:p-6">
        <div className="max-w-2xl mx-auto">
          <div className="mb-4 flex items-center gap-2 text-sm text-gray-500">
            <Link href="/tasks" className="hover:text-indigo-600 transition-colors">
              タスク一覧
            </Link>
            <span>/</span>
            <span className="text-gray-700 truncate">{task.title}</span>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-4 md:p-6 mb-4">
            <div className="flex items-start justify-between gap-4 mb-4">
              <h2 className="text-xl font-bold text-gray-800 flex-1">{task.title}</h2>
              <TaskDetailActions taskId={task.id} canEdit={canEdit} />
            </div>

            <div className="flex flex-wrap gap-2 mb-4">
              <span className={`text-sm px-2.5 py-1 rounded-full font-medium ${TASK_STATUS_COLORS[task.status as keyof typeof TASK_STATUS_COLORS]}`}>
                {TASK_STATUS_LABELS[task.status as keyof typeof TASK_STATUS_LABELS]}
              </span>
              <span className={`text-sm px-2.5 py-1 rounded-full font-medium ${PRIORITY_COLORS[task.priority as keyof typeof PRIORITY_COLORS]}`}>
                優先度：{PRIORITY_LABELS[task.priority as keyof typeof PRIORITY_LABELS]}
              </span>
              <DeadlineBadge deadline={task.deadline} />
            </div>

            {task.description && (
              <p className="text-gray-600 text-sm leading-relaxed mb-4 whitespace-pre-wrap">
                {task.description}
              </p>
            )}

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-400 text-xs mb-1">担当者</p>
                {task.assignee ? (
                  <div className="flex items-center gap-2">
                    <Avatar name={task.assignee.name} size="sm" />
                    <span className="text-gray-700">{task.assignee.name}</span>
                  </div>
                ) : (
                  <span className="text-gray-400">未割当</span>
                )}
              </div>
              <div>
                <p className="text-gray-400 text-xs mb-1">作成者</p>
                <div className="flex items-center gap-2">
                  <Avatar name={task.createdBy.name} size="sm" />
                  <span className="text-gray-700">{task.createdBy.name}</span>
                </div>
              </div>
            </div>
          </div>

          {task.subTasks.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-xl p-6 mb-4">
              <h3 className="font-semibold text-gray-700 mb-3">進捗</h3>
              <ProgressBar value={task.progress} />
            </div>
          )}

          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h3 className="font-semibold text-gray-700 mb-4">
              サブタスク（ステップ）
              {task.subTasks.length > 0 && (
                <span className="text-sm text-gray-400 font-normal ml-2">
                  {task.subTasks.filter((s) => s.isCompleted).length}/{task.subTasks.length}
                </span>
              )}
            </h3>
            <SubTaskList
              taskId={task.id}
              subTasks={taskForClient.subTasks}
              canEdit={canEdit}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
