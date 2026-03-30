"use client";

import { useState } from "react";
import type { SubTaskData } from "@/types";
import { getDeadlineStatus, deadlineColors, deadlineLabels } from "@/lib/deadline";

interface SubTaskListProps {
  taskId: string;
  subTasks: SubTaskData[];
  canEdit: boolean;
  onProgressChange?: (newProgress: number) => void;
}

export default function SubTaskList({
  taskId,
  subTasks: initialSubTasks,
  canEdit,
  onProgressChange,
}: SubTaskListProps) {
  const [subTasks, setSubTasks] = useState(initialSubTasks);
  const [loading, setLoading] = useState<string | null>(null);
  // 期限編集中のサブタスクID
  const [editingDeadlineId, setEditingDeadlineId] = useState<string | null>(null);
  const [deadlineInput, setDeadlineInput] = useState("");

  // チェックボックス ON/OFF（全員が使用可能）
  const toggle = async (subTask: SubTaskData) => {
    setLoading(subTask.id);

    const res = await fetch(`/api/subtasks/${subTask.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isCompleted: !subTask.isCompleted }),
    });

    if (res.ok) {
      const data = await res.json();
      setSubTasks((prev) =>
        prev.map((s) =>
          s.id === subTask.id ? { ...s, isCompleted: !s.isCompleted } : s
        )
      );
      if (onProgressChange) onProgressChange(data.taskProgress);
    }
    setLoading(null);
  };

  // 期限編集を開始
  const startEditDeadline = (subTask: SubTaskData) => {
    if (!canEdit) return;
    setEditingDeadlineId(subTask.id);
    setDeadlineInput(
      subTask.deadline
        ? new Date(subTask.deadline).toISOString().split("T")[0]
        : ""
    );
  };

  // 期限を保存
  const saveDeadline = async (subTask: SubTaskData) => {
    setLoading(subTask.id);
    const res = await fetch(`/api/subtasks/${subTask.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ deadline: deadlineInput || null }),
    });

    if (res.ok) {
      setSubTasks((prev) =>
        prev.map((s) =>
          s.id === subTask.id
            ? { ...s, deadline: deadlineInput ? new Date(deadlineInput).toISOString() : null }
            : s
        )
      );
    }
    setEditingDeadlineId(null);
    setLoading(null);
  };

  // 期限編集をキャンセル
  const cancelEditDeadline = () => {
    setEditingDeadlineId(null);
    setDeadlineInput("");
  };

  if (subTasks.length === 0) {
    return <p className="text-sm text-gray-400 italic">サブタスクはありません</p>;
  }

  const completedCount = subTasks.filter((s) => s.isCompleted).length;

  return (
    <div>
      <p className="text-xs text-gray-500 mb-3">
        {completedCount} / {subTasks.length} ステップ完了
      </p>
      <div className="space-y-2">
        {subTasks
          .slice()
          .sort((a, b) => a.order - b.order)
          .map((st) => {
            const deadlineStatus = getDeadlineStatus(st.deadline);
            const isEditingThis = editingDeadlineId === st.id;

            return (
              <div
                key={st.id}
                className={`rounded-lg border transition-colors ${
                  st.isCompleted
                    ? "bg-green-50 border-green-200"
                    : deadlineStatus === "overdue"
                    ? "bg-red-50 border-red-200"
                    : "bg-white border-gray-200"
                }`}
              >
                {/* メイン行：チェックボックス ＋ ステップ名 ＋ スピナー */}
                <div className="flex items-center gap-3 p-3">
                  <button
                    onClick={() => toggle(st)}
                    disabled={loading === st.id}
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors cursor-pointer ${
                      st.isCompleted
                        ? "bg-green-500 border-green-500"
                        : "border-gray-300 hover:border-emerald-400"
                    }`}
                  >
                    {st.isCompleted && (
                      <svg
                        className="w-3 h-3 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={3}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    )}
                  </button>

                  <span
                    className={`text-sm flex-1 ${
                      st.isCompleted ? "line-through text-gray-400" : "text-gray-700"
                    }`}
                  >
                    {st.title}
                  </span>

                  {loading === st.id && (
                    <div className="w-4 h-4 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin shrink-0" />
                  )}
                </div>

                {/* 期限行 */}
                <div className="px-3 pb-2.5 pl-11">
                  {isEditingThis ? (
                    /* 期限編集モード */
                    <div className="flex items-center gap-2">
                      <input
                        type="date"
                        value={deadlineInput}
                        onChange={(e) => setDeadlineInput(e.target.value)}
                        autoFocus
                        className="text-xs px-2 py-1 border border-emerald-300 rounded-md text-gray-700 focus:outline-none focus:ring-1 focus:ring-emerald-400"
                      />
                      <button
                        onClick={() => saveDeadline(st)}
                        disabled={loading === st.id}
                        className="text-xs px-2 py-1 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors disabled:opacity-50"
                      >
                        保存
                      </button>
                      <button
                        onClick={cancelEditDeadline}
                        className="text-xs px-2 py-1 text-gray-500 hover:text-gray-700 transition-colors"
                      >
                        キャンセル
                      </button>
                    </div>
                  ) : (
                    /* 期限表示モード */
                    <div className="flex items-center gap-2">
                      {st.deadline ? (
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${deadlineColors[deadlineStatus]}`}
                        >
                          <svg
                            className="w-3 h-3"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                          </svg>
                          {new Date(st.deadline).toLocaleDateString("ja-JP", {
                            month: "numeric",
                            day: "numeric",
                          })}
                          （{deadlineLabels[deadlineStatus]}）
                        </span>
                      ) : (
                        <span className="text-xs text-gray-300">期限未設定</span>
                      )}

                      {canEdit && !st.isCompleted && (
                        <button
                          onClick={() => startEditDeadline(st)}
                          className="text-xs text-gray-400 hover:text-emerald-500 transition-colors underline underline-offset-2"
                        >
                          {st.deadline ? "変更" : "期限を設定"}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
}
