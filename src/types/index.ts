export type UserRole = "ADMIN" | "MEMBER";
export type Category = "INTERNAL" | "CLIENT" | "ADMIN_WORK";

export const CATEGORY_LABELS: Record<Category, string> = {
  INTERNAL:   "社内",
  CLIENT:     "クライアント提出",
  ADMIN_WORK: "事務作業",
};

export const CATEGORY_COLORS: Record<Category, string> = {
  INTERNAL:   "bg-blue-100 text-blue-700",
  CLIENT:     "bg-purple-100 text-purple-700",
  ADMIN_WORK: "bg-orange-100 text-orange-700",
};
export type TaskStatus = "TODO" | "IN_PROGRESS" | "REVIEW" | "DONE";
export type Priority = "HIGH" | "MEDIUM" | "LOW";

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  TODO: "未着手",
  IN_PROGRESS: "進行中",
  REVIEW: "レビュー中",
  DONE: "完了",
};

export const TASK_STATUS_COLORS: Record<TaskStatus, string> = {
  TODO: "bg-gray-100 text-gray-600",
  IN_PROGRESS: "bg-sky-100 text-sky-700",
  REVIEW: "bg-amber-100 text-amber-700",
  DONE: "bg-emerald-100 text-emerald-700",
};

export const PRIORITY_LABELS: Record<Priority, string> = {
  HIGH: "高",
  MEDIUM: "中",
  LOW: "低",
};

export const PRIORITY_COLORS: Record<Priority, string> = {
  HIGH: "bg-red-100 text-red-700",
  MEDIUM: "bg-amber-100 text-amber-700",
  LOW: "bg-teal-100 text-teal-700",
};

export const ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: "管理者",
  MEMBER: "メンバー",
};

export interface SubTaskData {
  id: string;
  title: string;
  isCompleted: boolean;
  order: number;
  deadline: string | null;
  taskId: string;
}

export interface TaskData {
  id: string;
  title: string;
  description: string | null;
  priority: Priority;
  status: TaskStatus;
  deadline: string | null;
  startAt: string | null;
  progress: number;
  category: Category;
  assigneeId: string | null;
  assignee: { id: string; name: string; email: string } | null;
  createdById: string;
  createdBy: { id: string; name: string; email: string };
  subTasks: SubTaskData[];
  createdAt: string;
  updatedAt: string;
}

export interface MemberData {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: string;
  _count?: { assignedTasks: number };
}
