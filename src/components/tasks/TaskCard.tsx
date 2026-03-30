"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ProgressBar from "@/components/ui/ProgressBar";
import DeadlineBadge from "@/components/ui/DeadlineBadge";
import Avatar from "@/components/ui/Avatar";
import { TASK_STATUS_LABELS, TASK_STATUS_COLORS, PRIORITY_LABELS, PRIORITY_COLORS, CATEGORY_LABELS, CATEGORY_COLORS } from "@/types";
import type { TaskData, TaskStatus, SubTaskData } from "@/types";

interface TaskCardProps {
  task: TaskData;
}

export default function TaskCard({ task }: TaskCardProps) {
  const router = useRouter();
  const [status, setStatus] = useState<TaskStatus>(task.status);
  const [subTasks, setSubTasks] = useState<SubTaskData[]>(task.subTasks);
  const [progress, setProgress] = useState(task.progress);
  const [completing, setCompleting] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // タスク全体の完了トグル
  const handleComplete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setCompleting(true);
    const newStatus: TaskStatus = status === "DONE" ? "TODO" : "DONE";
    const res = await fetch(`/api/tasks/${task.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    if (res.ok) setStatus(newStatus);
    setCompleting(false);
  };

  // サブタスクの完了トグル
  const handleSubTaskToggle = async (e: React.MouseEvent, st: SubTaskData) => {
    e.stopPropagation();
    setTogglingId(st.id);
    const updated = subTasks.map((s) =>
      s.id === st.id ? { ...s, isCompleted: !s.isCompleted } : s
    );
    setSubTasks(updated);
    setProgress(
      updated.length === 0
        ? 0
        : Math.round((updated.filter((s) => s.isCompleted).length / updated.length) * 100)
    );

    const res = await fetch(`/api/subtasks/${st.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isCompleted: !st.isCompleted }),
    });
    if (!res.ok) {
      // rollback
      setSubTasks(subTasks);
      setProgress(task.progress);
    }
    setTogglingId(null);
  };

  const SHOW_MAX = 5;
  const visibleSubTasks = subTasks.slice(0, SHOW_MAX);
  const hiddenCount = subTasks.length - SHOW_MAX;

  return (
    <div
      onClick={() => router.push(`/tasks/${task.id}`)}
      className={`bg-white border rounded-xl p-4 hover:shadow-md transition-all cursor-pointer ${
        status === "DONE"
          ? "border-emerald-200 bg-emerald-50/30"
          : "border-gray-200 hover:border-emerald-200"
      }`}
    >
      {/* タイトル行 */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <h3
          className={`font-semibold text-sm leading-snug line-clamp-2 flex-1 ${
            status === "DONE" ? "text-gray-400 line-through" : "text-gray-800"
          }`}
        >
          {task.title}
        </h3>
        <span
          className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${PRIORITY_COLORS[task.priority]}`}
        >
          優先度：{PRIORITY_LABELS[task.priority]}
        </span>
      </div>

      {/* ステータス・期限バッジ */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        <span
          className={`text-xs px-2 py-0.5 rounded-full font-medium ${TASK_STATUS_COLORS[status]}`}
        >
          {TASK_STATUS_LABELS[status]}
        </span>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${CATEGORY_COLORS[task.category]}`}>
          {CATEGORY_LABELS[task.category]}
        </span>
        <DeadlineBadge deadline={task.deadline} />
      </div>

      {/* サブタスクチェックリスト */}
      {subTasks.length > 0 && (
        <div
          className="mb-3"
          onClick={(e) => e.stopPropagation()}
        >
          <ProgressBar value={progress} />
          <p className="text-xs text-gray-400 mt-1 mb-2">
            {subTasks.filter((s) => s.isCompleted).length} / {subTasks.length} ステップ完了
          </p>
          <div className="space-y-1.5">
            {visibleSubTasks.map((st) => (
              <div key={st.id} className="flex items-center gap-2">
                <button
                  onClick={(e) => handleSubTaskToggle(e, st)}
                  disabled={togglingId === st.id}
                  className={`w-4 h-4 rounded border-2 shrink-0 flex items-center justify-center transition-colors ${
                    st.isCompleted
                      ? "bg-emerald-500 border-emerald-500"
                      : "border-gray-300 hover:border-emerald-400"
                  } ${togglingId === st.id ? "opacity-50" : ""}`}
                >
                  {togglingId === st.id ? (
                    <div className="w-2 h-2 border border-current border-t-transparent rounded-full animate-spin" />
                  ) : st.isCompleted ? (
                    <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : null}
                </button>
                <span
                  className={`text-xs truncate ${
                    st.isCompleted ? "line-through text-gray-400" : "text-gray-600"
                  }`}
                >
                  {st.title}
                </span>
              </div>
            ))}
            {hiddenCount > 0 && (
              <p className="text-xs text-gray-400 pl-6">他 {hiddenCount} 件</p>
            )}
          </div>
        </div>
      )}

      {/* 担当者 + 完了ボタン */}
      <div className="flex items-center justify-between mt-2">
        {task.assignee ? (
          <div className="flex items-center gap-1.5">
            <Avatar name={task.assignee.name} size="sm" />
            <span className="text-xs text-gray-500">{task.assignee.name}</span>
          </div>
        ) : (
          <span />
        )}

        {/* ワンクリック完了ボタン */}
        <button
          onClick={handleComplete}
          disabled={completing}
          title={status === "DONE" ? "完了を取り消す" : "完了にする"}
          className={`w-7 h-7 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
            status === "DONE"
              ? "bg-emerald-500 border-emerald-500 hover:bg-emerald-600"
              : "border-gray-300 hover:border-emerald-400 hover:bg-emerald-50"
          } ${completing ? "opacity-50" : ""}`}
        >
          {completing ? (
            <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
          ) : status === "DONE" ? (
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}
