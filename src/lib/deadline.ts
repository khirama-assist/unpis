export type DeadlineStatus = "overdue" | "soon" | "ok" | "none";

export function getDeadlineStatus(deadline: Date | string | null | undefined): DeadlineStatus {
  if (!deadline) return "none";
  const d = typeof deadline === "string" ? new Date(deadline) : deadline;
  const now = new Date();
  const diffMs = d.getTime() - now.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  if (diffDays < 0) return "overdue";
  if (diffDays <= 3) return "soon";
  return "ok";
}

export const deadlineColors: Record<DeadlineStatus, string> = {
  overdue: "bg-red-100 text-red-700 border border-red-300",
  soon: "bg-yellow-100 text-yellow-700 border border-yellow-300",
  ok: "bg-green-100 text-green-700 border border-green-300",
  none: "bg-gray-100 text-gray-500 border border-gray-200",
};

export const deadlineLabels: Record<DeadlineStatus, string> = {
  overdue: "期限超過",
  soon: "期限間近",
  ok: "期限内",
  none: "期限なし",
};
