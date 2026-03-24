import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canEditTask } from "@/lib/permissions";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return Response.json({ error: "未認証" }, { status: 401 });

  const { id: taskId } = await params;
  const task = await prisma.task.findUnique({ where: { id: taskId } });
  if (!task) return Response.json({ error: "タスクが見つかりません" }, { status: 404 });

  if (!canEditTask(session, task)) {
    return Response.json({ error: "権限がありません" }, { status: 403 });
  }

  const body = await request.json();
  const { title, deadline } = body;
  if (!title?.trim()) {
    return Response.json({ error: "タイトルは必須です" }, { status: 400 });
  }

  const maxOrder = await prisma.subTask.aggregate({
    where: { taskId },
    _max: { order: true },
  });
  const order = (maxOrder._max.order ?? 0) + 1;

  const subTask = await prisma.subTask.create({
    data: {
      title: title.trim(),
      order,
      taskId,
      deadline: deadline ? new Date(deadline) : null,
    },
  });

  return Response.json(subTask, { status: 201 });
}
