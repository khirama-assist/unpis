import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Header from "@/components/layout/Header";
import MyTasksClient from "./MyTasksClient";

export default async function MyTasksPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  return (
    <div className="flex flex-col h-full">
      <Header title="自分のタスク" />
      <div className="flex-1 overflow-auto p-4 md:p-6">
        <MyTasksClient />
      </div>
    </div>
  );
}
