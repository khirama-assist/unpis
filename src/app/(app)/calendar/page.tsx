import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Header from "@/components/layout/Header";
import CalendarView from "@/components/tasks/CalendarView";

export default async function CalendarPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  // タスク（期限あり）
  const tasks = await prisma.task.findMany({
    where: {},
    select: {
      id: true,
      title: true,
      priority: true,
      status: true,
      startAt: true,
      deadline: true,
      progress: true,
      assignee: { select: { id: true, name: true, email: true } },
    },
    orderBy: { deadline: "asc" },
  });

  // サブタスク（期限あり）
  const subTasks = await prisma.subTask.findMany({
    where: { deadline: { not: null } },
    select: {
      id: true,
      title: true,
      isCompleted: true,
      deadline: true,
      taskId: true,
      task: { select: { id: true, title: true } },
    },
    orderBy: { deadline: "asc" },
  });

  // Date → ISO文字列にシリアライズ
  const serializedTasks = tasks.map((t) => ({
    ...t,
    startAt: t.startAt ? t.startAt.toISOString() : null,
    deadline: t.deadline ? t.deadline.toISOString() : null,
  }));

  const serializedSubTasks = subTasks.map((s) => ({
    ...s,
    deadline: s.deadline ? s.deadline.toISOString() : null,
  }));

  return (
    <div className="flex flex-col h-full">
      <Header title="カレンダー" />
      <div className="flex-1 overflow-auto p-4 md:p-6">
        <p className="text-sm text-gray-500 mb-5">
          期限が設定されたタスク・ステップをカレンダーで確認できます。
        </p>
        <CalendarView tasks={serializedTasks} subTasks={serializedSubTasks} />
      </div>
    </div>
  );
}
