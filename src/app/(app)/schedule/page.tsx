import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { isAdmin } from "@/lib/permissions";
import Header from "@/components/layout/Header";
import ScheduleView from "@/components/schedule/ScheduleView";

export default async function SchedulePage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  const admin = isAdmin(session);
  const userId = session?.user?.id;

  const members = await prisma.user.findMany({
    where: admin ? {} : { id: userId },
    select: { id: true, name: true, role: true },
    orderBy: { name: "asc" },
  });

  const tasks = await prisma.task.findMany({
    where: admin ? {} : { assigneeId: userId },
    select: {
      id: true, title: true, priority: true, status: true,
      deadline: true, progress: true, assigneeId: true,
      subTasks: {
        select: { id: true, title: true, isCompleted: true, deadline: true, order: true },
        orderBy: { order: "asc" },
      },
    },
    orderBy: { deadline: "asc" },
  });

  const serialized = tasks.map(t => ({
    ...t,
    deadline: t.deadline?.toISOString() ?? null,
    subTasks: t.subTasks.map(s => ({ ...s, deadline: s.deadline?.toISOString() ?? null })),
  }));

  return (
    <div className="flex flex-col h-full">
      <Header title="スケジュール" />
      <div className="flex-1 overflow-auto p-4 md:p-6">
        <ScheduleView members={members} tasks={serialized} isAdmin={admin} currentUserId={userId!} />
      </div>
    </div>
  );
}
