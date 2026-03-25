import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Header from "@/components/layout/Header";
import AccountForm from "@/components/account/AccountForm";

export default async function AccountPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  });

  if (!user) redirect("/login");

  return (
    <div className="flex flex-col h-full">
      <Header title="アカウント設定" />
      <div className="flex-1 overflow-auto p-4 md:p-6">
        <div className="max-w-2xl mx-auto">
          <AccountForm
            initialName={user.name}
            email={user.email}
            role={user.role}
            createdAt={user.createdAt.toISOString()}
          />
        </div>
      </div>
    </div>
  );
}
