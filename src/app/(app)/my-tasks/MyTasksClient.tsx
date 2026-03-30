"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import TaskCard from "@/components/tasks/TaskCard";
import TaskFilter from "@/components/tasks/TaskFilter";
import type { TaskData, Category } from "@/types";
import { CATEGORY_LABELS, CATEGORY_COLORS } from "@/types";

const CATEGORIES: Category[] = ["INTERNAL", "CLIENT", "ADMIN_WORK"];

export default function MyTasksClient() {
  const { data: session } = useSession();
  const [tasks, setTasks] = useState<TaskData[]>([]);
  const [status, setStatus] = useState("");
  const [priority, setPriority] = useState("");
  const [loading, setLoading] = useState(true);
  const [doneExpanded, setDoneExpanded] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | "ALL">("ALL");

  useEffect(() => {
    if (!session?.user?.id) return;
    setLoading(true);
    const params = new URLSearchParams();
    params.set("assigneeId", session.user.id);
    if (status) params.set("status", status);
    if (priority) params.set("priority", priority);

    fetch(`/api/tasks?${params}`)
      .then((r) => r.json())
      .then((data) => {
        setTasks(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [session?.user?.id, status, priority]);

  const activeTasks = tasks.filter((t) => t.status !== "DONE");
  const doneTasks = tasks.filter((t) => t.status === "DONE");

  const displayedActive =
    selectedCategory === "ALL"
      ? activeTasks
      : activeTasks.filter((t) => t.category === selectedCategory);

  const skeletons = (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="bg-white border border-gray-200 rounded-xl p-4 animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
          <div className="h-3 bg-gray-100 rounded w-1/2 mb-4" />
          <div className="h-2 bg-gray-200 rounded w-full" />
        </div>
      ))}
    </div>
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-700">
          {loading ? "読み込み中..." : `${activeTasks.length}件のタスク`}
        </h2>
        <Link
          href="/tasks/new"
          className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors flex items-center gap-1.5"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          新規タスク
        </Link>
      </div>

      {/* カテゴリタブ */}
      <div className="flex gap-2 flex-wrap mb-5">
        {(["ALL", ...CATEGORIES] as const).map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              selectedCategory === cat
                ? "bg-gray-700 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {cat === "ALL" ? "全て" : CATEGORY_LABELS[cat as Category]}
            {!loading && cat !== "ALL" && (
              <span className="ml-1.5 text-xs opacity-75">
                {activeTasks.filter((t) => t.category === cat).length}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="mb-6">
        <TaskFilter
          status={status}
          priority={priority}
          assigneeId=""
          onStatusChange={setStatus}
          onPriorityChange={setPriority}
          onAssigneeChange={() => {}}
          members={[]}
          isAdmin={false}
        />
      </div>

      {loading ? (
        skeletons
      ) : activeTasks.length === 0 && doneTasks.length === 0 ? (
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
          <p className="text-gray-500 font-medium">自分のタスクが見つかりません</p>
          <p className="text-gray-400 text-sm mt-1">新しいタスクを追加してみましょう！</p>
        </div>
      ) : (
        <>
          {/* 進行中タスク */}
          {selectedCategory === "ALL" ? (
            CATEGORIES.map((cat) => {
              const group = activeTasks.filter((t) => t.category === cat);
              if (group.length === 0) return null;
              return (
                <div key={cat} className="mb-8">
                  <div className="flex items-center gap-2 mb-3">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${CATEGORY_COLORS[cat]}`}>
                      {CATEGORY_LABELS[cat]}
                    </span>
                    <span className="text-sm text-gray-400">{group.length}件</span>
                    <div className="flex-1 h-px bg-gray-100" />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {group.map((task) => (
                      <TaskCard key={task.id} task={task} />
                    ))}
                  </div>
                </div>
              );
            })
          ) : displayedActive.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {displayedActive.map((task) => (
                <TaskCard key={task.id} task={task} />
              ))}
            </div>
          ) : (
            <div className="text-center py-10 text-gray-400 text-sm">
              このカテゴリのタスクはありません
            </div>
          )}

          {/* 完了済みセクション */}
          {doneTasks.length > 0 && (
            <div className="mt-8">
              <button
                onClick={() => setDoneExpanded((prev) => !prev)}
                className="flex items-center gap-2 text-sm font-medium text-gray-400 hover:text-gray-600 transition-colors mb-4 w-full"
              >
                <svg
                  className={`w-4 h-4 transition-transform duration-200 ${doneExpanded ? "rotate-90" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                <span className="flex items-center gap-1.5">
                  <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  完了済み {doneTasks.length}件
                </span>
                <div className="flex-1 h-px bg-gray-200 ml-2" />
              </button>

              {doneExpanded && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 opacity-75">
                  {doneTasks.map((task) => (
                    <TaskCard key={task.id} task={task} />
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
