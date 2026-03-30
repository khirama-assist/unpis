import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isAdmin } from "@/lib/permissions";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return Response.json({ error: "未認証" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const priority = searchParams.get("priority");
  const assigneeId = searchParams.get("assigneeId");

  const where: Record<string, unknown> = {};

  // 全員が全タスクを閲覧可能（assigneeIdフィルターは任意）
  if (assigneeId) {
    where.assigneeId = assigneeId;
  }

  if (status) where.status = status;
  if (priority) where.priority = priority;

  const tasks = await prisma.task.findMany({
    where,
    include: {
      assignee: { select: { id: true, name: true, email: true } },
      createdBy: { select: { id: true, name: true, email: true } },
      subTasks: { orderBy: { order: "asc" } },
    },
    orderBy: { updatedAt: "desc" },
  });

  return Response.json(tasks);
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return Response.json({ error: "未認証" }, { status: 401 });

  const body = await request.json();
  const { title, description, priority, status, deadline, startAt, assigneeId, subTasks } = body;

  if (!title?.trim()) {
    return Response.json({ error: "タイトルは必須です" }, { status: 400 });
  }

  // メンバーは自分にのみ割り当て可能
  const effectiveAssigneeId =
    isAdmin(session) ? assigneeId : session.user.id;

  const task = await prisma.task.create({
    data: {
      title: title.trim(),
      description: description?.trim() || null,
      priority: priority || "MEDIUM",
      status: status || "TODO",
      startAt: startAt ? new Date(startAt) : null,
      deadline: deadline ? new Date(deadline) : null,
      progress: 0,
      assigneeId: effectiveAssigneeId || null,
      createdById: session.user.id,
      subTasks: subTasks?.length
        ? {
            create: subTasks.map((st: { title: string; deadline?: string | null }, i: number) => ({
              title: st.title,
              order: i + 1,
              isCompleted: false,
              deadline: st.deadline ? new Date(st.deadline) : null,
            })),
          }
        : undefined,
    },
    include: {
      assignee: { select: { id: true, name: true, email: true } },
      createdBy: { select: { id: true, name: true, email: true } },
      subTasks: { orderBy: { order: "asc" } },
    },
  });

  return Response.json(task, { status: 201 });
}
