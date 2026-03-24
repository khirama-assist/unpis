import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isAdmin } from "@/lib/permissions";
import Header from "@/components/layout/Header";
import TasksClient from "./TasksClient";

export default async function TasksPage() {
  const session = await getServerSession(authOptions);
  const admin = isAdmin(session);

  return (
    <div className="flex flex-col h-full">
      <Header title="タスク一覧" />
      <div className="flex-1 overflow-auto p-6">
        <TasksClient isAdmin={admin} />
      </div>
    </div>
  );
}
