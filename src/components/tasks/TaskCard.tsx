import Link from "next/link";
import ProgressBar from "@/components/ui/ProgressBar";
import DeadlineBadge from "@/components/ui/DeadlineBadge";
import Avatar from "@/components/ui/Avatar";
import { TASK_STATUS_LABELS, TASK_STATUS_COLORS, PRIORITY_LABELS, PRIORITY_COLORS } from "@/types";
import type { TaskData } from "@/types";

interface TaskCardProps {
  task: TaskData;
}

export default function TaskCard({ task }: TaskCardProps) {
  return (
    <Link href={`/tasks/${task.id}`} className="block">
      <div className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md hover:border-emerald-200 transition-all">
        <div className="flex items-start justify-between gap-2 mb-3">
          <h3 className="font-semibold text-gray-800 text-sm leading-snug line-clamp-2 flex-1">
            {task.title}
          </h3>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${PRIORITY_COLORS[task.priority]}`}>
            優先度：{PRIORITY_LABELS[task.priority]}
          </span>
        </div>

        <div className="flex flex-wrap gap-1.5 mb-3">
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TASK_STATUS_COLORS[task.status]}`}>
            {TASK_STATUS_LABELS[task.status]}
          </span>
          <DeadlineBadge deadline={task.deadline} />
        </div>

        {task.subTasks.length > 0 && (
          <div className="mb-3">
            <ProgressBar value={task.progress} />
            <p className="text-xs text-gray-400 mt-1">
              {task.subTasks.filter((s) => s.isCompleted).length} / {task.subTasks.length} ステップ完了
            </p>
          </div>
        )}

        {task.assignee && (
          <div className="flex items-center gap-1.5 mt-2">
            <Avatar name={task.assignee.name} size="sm" />
            <span className="text-xs text-gray-500">{task.assignee.name}</span>
          </div>
        )}
      </div>
    </Link>
  );
}
