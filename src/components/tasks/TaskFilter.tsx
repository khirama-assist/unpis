"use client";

import { TASK_STATUS_LABELS, PRIORITY_LABELS } from "@/types";
import type { MemberData } from "@/types";

interface TaskFilterProps {
  status: string;
  priority: string;
  assigneeId: string;
  onStatusChange: (v: string) => void;
  onPriorityChange: (v: string) => void;
  onAssigneeChange: (v: string) => void;
  members?: MemberData[];
  isAdmin: boolean;
}

export default function TaskFilter({
  status,
  priority,
  assigneeId,
  onStatusChange,
  onPriorityChange,
  onAssigneeChange,
  members = [],
  isAdmin,
}: TaskFilterProps) {
  const selectClass =
    "text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-700";

  return (
    <div className="flex flex-wrap gap-3 items-center">
      <select value={status} onChange={(e) => onStatusChange(e.target.value)} className={selectClass}>
        <option value="">すべてのステータス</option>
        {(Object.entries(TASK_STATUS_LABELS) as [string, string][]).map(([k, v]) => (
          <option key={k} value={k}>{v}</option>
        ))}
      </select>

      <select value={priority} onChange={(e) => onPriorityChange(e.target.value)} className={selectClass}>
        <option value="">すべての優先度</option>
        {(Object.entries(PRIORITY_LABELS) as [string, string][]).map(([k, v]) => (
          <option key={k} value={k}>優先度：{v}</option>
        ))}
      </select>

      {isAdmin && members.length > 0 && (
        <select value={assigneeId} onChange={(e) => onAssigneeChange(e.target.value)} className={selectClass}>
          <option value="">すべてのメンバー</option>
          {members.map((m) => (
            <option key={m.id} value={m.id}>{m.name}</option>
          ))}
        </select>
      )}
    </div>
  );
}
