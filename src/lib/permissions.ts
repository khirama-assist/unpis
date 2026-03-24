import type { Session } from "next-auth";

export const isAdmin = (session: Session | null): boolean =>
  session?.user?.role === "ADMIN";

export const canEditTask = (
  session: Session | null,
  task: { createdById: string }
): boolean => isAdmin(session) || session?.user?.id === task.createdById;

export const canDeleteTask = canEditTask;
