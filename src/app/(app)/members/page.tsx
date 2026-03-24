import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isAdmin } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import Header from "@/components/layout/Header";
import MembersClient from "./MembersClient";

export default async function MembersPage() {
  const session = await getServerSession(authOptions);
  if (!isAdmin(session)) redirect("/dashboard");

  const members = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      _count: { select: { assignedTasks: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="flex flex-col h-full">
      <Header title="メンバー管理" />
      <div className="flex-1 overflow-auto p-6">
        <MembersClient
          initialMembers={members.map((m) => ({ ...m, createdAt: m.createdAt.toISOString() }))}
          currentUserId={session?.user?.id ?? ""}
        />
      </div>
    </div>
  );
}
