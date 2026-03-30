import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canEditTask, canDeleteTask } from "@/lib/permissions";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return Response.json({ error: "未認証" }, { status: 401 });

  const { id } = await params;
  const task = await prisma.task.findUnique({
    where: { id },
    include: {
      assignee: { select: { id: true, name: true, email: true } },
      createdBy: { select: { id: true, name: true, email: true } },
      subTasks: { orderBy: { order: "asc" } },
    },
  });

  if (!task) return Response.json({ error: "タスクが見つかりません" }, { status: 404 });
  return Response.json(task);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return Response.json({ error: "未認証" }, { status: 401 });

  const { id } = await params;
  const task = await prisma.task.findUnique({ where: { id } });
  if (!task) return Response.json({ error: "タスクが見つかりません" }, { status: 404 });

  const body = await request.json();
  const { title, description, priority, status, deadline, startAt, assigneeId, subTasks } = body;

  // ステータス変更のみなら全員OK、それ以外は管理者/作成者のみ
  const isStatusOnly = Object.keys(body).length === 1 && status !== undefined;
  if (!isStatusOnly && !canEditTask(session, task)) {
    return Response.json({ error: "権限がありません" }, { status: 403 });
  }

  const updated = await prisma.task.update({
    where: { id },
    data: {
      ...(title !== undefined && { title: title.trim() }),
      ...(description !== undefined && { description: description?.trim() || null }),
      ...(priority !== undefined && { priority }),
      ...(status !== undefined && { status }),
      ...(startAt !== undefined && { startAt: startAt ? new Date(startAt) : null }),
      ...(deadline !== undefined && { deadline: deadline ? new Date(deadline) : null }),
      ...(assigneeId !== undefined && { assigneeId: assigneeId || null }),
    },
    include: {
      assignee: { select: { id: true, name: true, email: true } },
      createdBy: { select: { id: true, name: true, email: true } },
      subTasks: { orderBy: { order: "asc" } },
    },
  });

  // サブタスクの更新（全置き換え）
  if (subTasks !== undefined) {
    await prisma.subTask.deleteMany({ where: { taskId: id } });
    if (subTasks.length > 0) {
      await prisma.subTask.createMany({
        data: subTasks.map((st: { title: string; isCompleted?: boolean; deadline?: string | null }, i: number) => ({
          title: st.title,
          isCompleted: st.isCompleted ?? false,
          order: i + 1,
          taskId: id,
          deadline: st.deadline ? new Date(st.deadline) : null,
        })),
      });
    }
    // プログレス再計算
    const all = await prisma.subTask.findMany({ where: { taskId: id } });
    const completed = all.filter((s) => s.isCompleted).length;
    const progress = all.length === 0 ? 0 : Math.round((completed / all.length) * 100);
    await prisma.task.update({ where: { id }, data: { progress } });
  }

  const final = await prisma.task.findUnique({
    where: { id },
    include: {
      assignee: { select: { id: true, name: true, email: true } },
      createdBy: { select: { id: true, name: true, email: true } },
      subTasks: { orderBy: { order: "asc" } },
    },
  });

  return Response.json(final);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return Response.json({ error: "未認証" }, { status: 401 });

  const { id } = await params;
  const task = await prisma.task.findUnique({ where: { id } });
  if (!task) return Response.json({ error: "タスクが見つかりません" }, { status: 404 });

  if (!canDeleteTask(session, task)) {
    return Response.json({ error: "権限がありません" }, { status: 403 });
  }

  await prisma.task.delete({ where: { id } });
  return Response.json({ success: true });
}
