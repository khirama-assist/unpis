"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import TaskCard from "@/components/tasks/TaskCard";
import TaskFilter from "@/components/tasks/TaskFilter";
import type { TaskData, MemberData } from "@/types";

interface TasksClientProps {
  isAdmin: boolean;
}

export default function TasksClient({ isAdmin }: TasksClientProps) {
  const [tasks, setTasks] = useState<TaskData[]>([]);
  const [members, setMembers] = useState<MemberData[]>([]);
  const [status, setStatus] = useState("");
  const [priority, setPriority] = useState("");
  const [assigneeId, setAssigneeId] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/members")
      .then((r) => r.json())
      .then(setMembers)
      .catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    if (priority) params.set("priority", priority);
    if (assigneeId) params.set("assigneeId", assigneeId);

    fetch(`/api/tasks?${params}`)
      .then((r) => r.json())
      .then((data) => {
        setTasks(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [status, priority, assigneeId]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6 gap-3">
        <h2 className="text-lg font-semibold text-gray-700 min-w-0">
          {loading ? "読み込み中..." : `${tasks.length}件のタスク`}
        </h2>
        <Link
          href="/tasks/new"
          className="bg-indigo-600 text-white px-3 py-2 md:px-4 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors flex items-center gap-1.5 shrink-0"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          新規タスク
        </Link>
      </div>

      <div className="mb-6">
        <TaskFilter
          status={status}
          priority={priority}
          assigneeId={assigneeId}
          onStatusChange={setStatus}
          onPriorityChange={setPriority}
          onAssigneeChange={setAssigneeId}
          members={members}
          isAdmin={isAdmin}
        />
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white border border-gray-200 rounded-xl p-4 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
              <div className="h-3 bg-gray-100 rounded w-1/2 mb-4" />
              <div className="h-2 bg-gray-200 rounded w-full" />
            </div>
          ))}
        </div>
      ) : tasks.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-24 h-24 mx-auto mb-4 overflow-hidden select-none">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/unpis-logo.png"
              alt=""
              className="w-full"
              style={{ height: "160%", objectFit: "cover", objectPosition: "center 5%" }}
            />
          </div>
          <p className="text-gray-500 font-medium">タスクが見つかりません</p>
          <p className="text-gray-400 text-sm mt-1">新しいタスクを追加してみましょう！</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} />
          ))}
        </div>
      )}
    </div>
  );
}
