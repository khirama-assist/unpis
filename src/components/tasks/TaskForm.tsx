"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { TaskData, MemberData, Priority, TaskStatus } from "@/types";

interface SubTaskInput {
  title: string;
  isCompleted: boolean;
  deadline: string; // "YYYY-MM-DD" or ""
}

interface TaskFormProps {
  task?: TaskData;
  members: MemberData[];
  isAdmin: boolean;
  currentUserId: string;
  defaultDeadline?: string; // カレンダーから渡される "YYYY-MM-DD"
}

export default function TaskForm({ task, members, isAdmin, currentUserId, defaultDeadline = "" }: TaskFormProps) {
  const router = useRouter();
  const [title, setTitle] = useState(task?.title ?? "");
  const [description, setDescription] = useState(task?.description ?? "");
  const [priority, setPriority] = useState<Priority>(task?.priority ?? "MEDIUM");
  const [status, setStatus] = useState<TaskStatus>(task?.status ?? "TODO");
  const [deadline, setDeadline] = useState(
    task?.deadline ? new Date(task.deadline).toISOString().split("T")[0] : defaultDeadline
  );
  const [assigneeId, setAssigneeId] = useState(task?.assigneeId ?? currentUserId);
  const [subTasks, setSubTasks] = useState<SubTaskInput[]>(
    task?.subTasks.map((s) => ({
      title: s.title,
      isCompleted: s.isCompleted,
      deadline: s.deadline ? new Date(s.deadline).toISOString().split("T")[0] : "",
    })) ?? []
  );
  const [newSubTask, setNewSubTask] = useState("");
  const [newSubTaskDeadline, setNewSubTaskDeadline] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const addSubTask = () => {
    if (!newSubTask.trim()) return;
    setSubTasks([...subTasks, { title: newSubTask.trim(), isCompleted: false, deadline: newSubTaskDeadline }]);
    setNewSubTask("");
    setNewSubTaskDeadline("");
  };

  const removeSubTask = (idx: number) => {
    setSubTasks(subTasks.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) { setError("タイトルは必須です"); return; }
    setLoading(true);
    setError("");

    const url = task ? `/api/tasks/${task.id}` : "/api/tasks";
    const method = task ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        description,
        priority,
        status,
        deadline: deadline || null,
        assigneeId: assigneeId || null,
        subTasks,
      }),
    });

    if (res.ok) {
      router.push("/tasks");
      router.refresh();
    } else {
      const data = await res.json();
      setError(data.error ?? "エラーが発生しました");
      setLoading(false);
    }
  };

  const inputClass = "w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500";
  const labelClass = "block text-sm font-medium text-gray-700 mb-1";

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className={labelClass}>タイトル <span className="text-red-500">*</span></label>
        <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} placeholder="タスクのタイトル" />
      </div>

      <div>
        <label className={labelClass}>説明</label>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className={inputClass} placeholder="詳細な説明（任意）" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>優先度</label>
          <select value={priority} onChange={(e) => setPriority(e.target.value as Priority)} className={inputClass}>
            <option value="HIGH">高</option>
            <option value="MEDIUM">中</option>
            <option value="LOW">低</option>
          </select>
        </div>

        <div>
          <label className={labelClass}>ステータス</label>
          <select value={status} onChange={(e) => setStatus(e.target.value as TaskStatus)} className={inputClass}>
            <option value="TODO">未着手</option>
            <option value="IN_PROGRESS">進行中</option>
            <option value="REVIEW">レビュー中</option>
            <option value="DONE">完了</option>
          </select>
        </div>
      </div>

      <div>
        <label className={labelClass}>期限</label>
        <input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} className={inputClass} />
      </div>

      {isAdmin && (
        <div>
          <label className={labelClass}>担当者</label>
          <select value={assigneeId} onChange={(e) => setAssigneeId(e.target.value)} className={inputClass}>
            <option value="">未割当</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
        </div>
      )}

      <div>
        <label className={labelClass}>サブタスク（ステップ）</label>
        <div className="space-y-2 mb-3">
          {subTasks.map((st, idx) => (
            <div key={idx} className="bg-gray-50 rounded-lg px-3 py-2 space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400 font-mono w-5 shrink-0">
                  {String.fromCharCode(9312 + idx)}
                </span>
                <span className="flex-1 text-sm text-gray-700">{st.title}</span>
                <button
                  type="button"
                  onClick={() => removeSubTask(idx)}
                  className="text-gray-300 hover:text-red-500 transition-colors shrink-0"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              {/* サブタスクごとの期限入力 */}
              <div className="flex items-center gap-2 pl-7">
                <svg className="w-3.5 h-3.5 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <input
                  type="date"
                  value={st.deadline}
                  onChange={(e) => {
                    const updated = [...subTasks];
                    updated[idx] = { ...updated[idx], deadline: e.target.value };
                    setSubTasks(updated);
                  }}
                  className="text-xs px-2 py-1 border border-gray-200 rounded-md text-gray-600 focus:outline-none focus:ring-1 focus:ring-emerald-400 bg-white"
                />
                {st.deadline && (
                  <button
                    type="button"
                    onClick={() => {
                      const updated = [...subTasks];
                      updated[idx] = { ...updated[idx], deadline: "" };
                      setSubTasks(updated);
                    }}
                    className="text-xs text-gray-400 hover:text-red-400 transition-colors"
                  >
                    クリア
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
        {/* 新規サブタスク入力エリア */}
        <div className="border border-dashed border-gray-300 rounded-lg p-3 space-y-2">
          <div className="flex gap-2">
            <input
              type="text"
              value={newSubTask}
              onChange={(e) => setNewSubTask(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addSubTask(); } }}
              className={`${inputClass} flex-1`}
              placeholder="ステップ名を入力（Enterで追加）"
            />
            <button
              type="button"
              onClick={addSubTask}
              className="px-3 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm hover:bg-gray-200 transition-colors shrink-0"
            >
              追加
            </button>
          </div>
          <div className="flex items-center gap-2">
            <svg className="w-3.5 h-3.5 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <input
              type="date"
              value={newSubTaskDeadline}
              onChange={(e) => setNewSubTaskDeadline(e.target.value)}
              className="text-xs px-2 py-1 border border-gray-200 rounded-md text-gray-600 focus:outline-none focus:ring-1 focus:ring-emerald-400 bg-white"
            />
            <span className="text-xs text-gray-400">このステップの期限（任意）</span>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-3">
          {error}
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
        >
          キャンセル
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex-1 px-4 py-2.5 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 transition-colors"
        >
          {loading ? "保存中..." : task ? "更新する" : "作成する"}
        </button>
      </div>
    </form>
  );
}
