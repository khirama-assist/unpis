import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isAdmin } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import Header from "@/components/layout/Header";
import TaskForm from "@/components/tasks/TaskForm";

interface NewTaskPageProps {
  searchParams: Promise<{ deadline?: string; deadlineTime?: string }>;
}

export default async function NewTaskPage({ searchParams }: NewTaskPageProps) {
  const session = await getServerSession(authOptions);
  const admin = isAdmin(session);
  const { deadline, deadlineTime } = await searchParams;

  const members = await prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true, createdAt: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="flex flex-col h-full">
      <Header title="新規タスク作成" />
      <div className="flex-1 overflow-auto p-4 md:p-6">
        <div className="max-w-xl mx-auto bg-white rounded-xl border border-gray-200 p-6">
          <TaskForm
            members={members.map((m) => ({ ...m, createdAt: m.createdAt.toISOString() }))}
            isAdmin={admin}
            currentUserId={session?.user?.id ?? ""}
            defaultDeadline={deadline ?? ""}
            defaultDeadlineTime={deadlineTime ?? ""}
          />
        </div>
      </div>
    </div>
  );
}
