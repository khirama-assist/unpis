import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { canEditTask, isAdmin } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import Header from "@/components/layout/Header";
import TaskForm from "@/components/tasks/TaskForm";

export default async function EditTaskPage({
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
  if (!canEditTask(session, task)) redirect("/tasks");

  const admin = isAdmin(session);
  const members = admin
    ? await prisma.user.findMany({
        select: { id: true, name: true, email: true, role: true, createdAt: true },
        orderBy: { name: "asc" },
      })
    : [];

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
      <Header title="タスク編集" />
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-xl mx-auto bg-white rounded-xl border border-gray-200 p-6">
          <TaskForm
            task={taskForClient}
            members={members.map((m) => ({ ...m, createdAt: m.createdAt.toISOString() }))}
            isAdmin={admin}
            currentUserId={session?.user?.id ?? ""}
          />
        </div>
      </div>
    </div>
  );
}
