import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isAdmin } from "@/lib/permissions";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return Response.json({ error: "未認証" }, { status: 401 });
  if (!isAdmin(session)) return Response.json({ error: "権限がありません" }, { status: 403 });

  const { id } = await params;
  const body = await request.json();
  const { name, role } = body;

  const user = await prisma.user.update({
    where: { id },
    data: {
      ...(name !== undefined && { name: name.trim() }),
      ...(role !== undefined && { role }),
    },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  });

  return Response.json(user);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return Response.json({ error: "未認証" }, { status: 401 });
  if (!isAdmin(session)) return Response.json({ error: "権限がありません" }, { status: 403 });

  const { id } = await params;

  // 自分自身は削除不可
  if (id === session.user.id) {
    return Response.json({ error: "自分自身は削除できません" }, { status: 400 });
  }

  // そのユーザーのタスク割り当てを解除してから削除
  await prisma.task.updateMany({
    where: { assigneeId: id },
    data: { assigneeId: null },
  });

  await prisma.user.delete({ where: { id } });
  return Response.json({ success: true });
}
