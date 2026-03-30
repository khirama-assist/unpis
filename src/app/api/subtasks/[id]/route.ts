import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canEditTask } from "@/lib/permissions";

async function recalculateProgress(taskId: string) {
  const subTasks = await prisma.subTask.findMany({ where: { taskId } });
  const total = subTasks.length;
  const completed = subTasks.filter((s) => s.isCompleted).length;
  const progress = total === 0 ? 0 : Math.round((completed / total) * 100);
  await prisma.task.update({ where: { id: taskId }, data: { progress } });
  return progress;
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return Response.json({ error: "未認証" }, { status: 401 });

  const { id } = await params;
  const subTask = await prisma.subTask.findUnique({ where: { id } });
  if (!subTask) return Response.json({ error: "サブタスクが見つかりません" }, { status: 404 });

  const task = await prisma.task.findUnique({ where: { id: subTask.taskId } });
  if (!task) return Response.json({ error: "タスクが見つかりません" }, { status: 404 });

  const body = await request.json();

  // isCompleted変更のみなら全員OK、それ以外は管理者/作成者のみ
  const isCompleteOnly = Object.keys(body).length === 1 && body.isCompleted !== undefined;
  if (!isCompleteOnly && !canEditTask(session, task)) {
    return Response.json({ error: "権限がありません" }, { status: 403 });
  }
  const updated = await prisma.subTask.update({
    where: { id },
    data: {
      ...(body.isCompleted !== undefined && { isCompleted: body.isCompleted }),
      ...(body.title !== undefined && { title: body.title }),
      ...(body.order !== undefined && { order: body.order }),
      ...("deadline" in body && { deadline: body.deadline ? new Date(body.deadline) : null }),
    },
  });

  const progress = await recalculateProgress(subTask.taskId);

  return Response.json({ ...updated, taskProgress: progress });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return Response.json({ error: "未認証" }, { status: 401 });

  const { id } = await params;
  const subTask = await prisma.subTask.findUnique({ where: { id } });
  if (!subTask) return Response.json({ error: "サブタスクが見つかりません" }, { status: 404 });

  const task = await prisma.task.findUnique({ where: { id: subTask.taskId } });
  if (!task || !canEditTask(session, task)) {
    return Response.json({ error: "権限がありません" }, { status: 403 });
  }

  await prisma.subTask.delete({ where: { id } });
  const progress = await recalculateProgress(subTask.taskId);

  return Response.json({ success: true, taskProgress: progress });
}
