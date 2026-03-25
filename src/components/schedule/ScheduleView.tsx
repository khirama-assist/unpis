"use client";

import { useState } from "react";
import Link from "next/link";
import { TASK_STATUS_LABELS } from "@/types";
import type { TaskStatus, Priority, UserRole } from "@/types";

// ===== 型定義 =====
interface Member {
  id: string;
  name: string;
  role: UserRole;
}

interface SubTaskItem {
  id: string;
  title: string;
  isCompleted: boolean;
  deadline: string | null;
  order: number;
}

interface TaskItem {
  id: string;
  title: string;
  priority: Priority;
  status: TaskStatus;
  deadline: string | null;
  progress: number;
  assigneeId: string | null;
  subTasks: SubTaskItem[];
}

interface ScheduleViewProps {
  members: Member[];
  tasks: TaskItem[];
  isAdmin: boolean;
  currentUserId: string;
}

// ===== 定数 =====
const DAYS_OF_WEEK = ["日", "月", "火", "水", "木", "金", "土"];

// ===== ユーティリティ =====
function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function getWeekStart(date: Date): Date {
  const d = new Date(date);
  d.setDate(d.getDate() - d.getDay());
  d.setHours(0, 0, 0, 0);
  return d;
}

function getWeekDates(date: Date): Date[] {
  const start = getWeekStart(date);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
}

// タスク優先度ごとのスタイル
function getTaskCellStyle(task: TaskItem): string {
  if (task.status === "DONE") return "bg-gray-100 text-gray-400 border-gray-200 line-through";
  switch (task.priority) {
    case "HIGH": return "bg-red-50 text-red-700 border-red-200";
    case "MEDIUM": return "bg-amber-50 text-amber-700 border-amber-200";
    case "LOW": return "bg-teal-50 text-teal-700 border-teal-200";
    default: return "bg-gray-100 text-gray-400 border-gray-200";
  }
}

// ===== コンポーネント =====
export default function ScheduleView({ members, tasks, isAdmin: _isAdmin, currentUserId: _currentUserId }: ScheduleViewProps) {
  const today = new Date();
  const [viewMode, setViewMode] = useState<"week" | "day">("week");
  const [currentDate, setCurrentDate] = useState(new Date());

  const weekDates = getWeekDates(currentDate);

  const handlePrev = () => {
    const d = new Date(currentDate);
    if (viewMode === "week") {
      d.setDate(d.getDate() - 7);
    } else {
      d.setDate(d.getDate() - 1);
    }
    setCurrentDate(d);
  };

  const handleNext = () => {
    const d = new Date(currentDate);
    if (viewMode === "week") {
      d.setDate(d.getDate() + 7);
    } else {
      d.setDate(d.getDate() + 1);
    }
    setCurrentDate(d);
  };

  const goToToday = () => setCurrentDate(new Date());

  // 表示日付リスト
  const displayDates = viewMode === "week" ? weekDates : [currentDate];

  // ヘッダーテキスト
  const headerText = viewMode === "week"
    ? `${weekDates[0].getMonth() + 1}/${weekDates[0].getDate()} - ${weekDates[6].getMonth() + 1}/${weekDates[6].getDate()}`
    : `${currentDate.getMonth() + 1}月${currentDate.getDate()}日（${DAYS_OF_WEEK[currentDate.getDay()]}）`;

  return (
    <div className="space-y-4">
      {/* ナビゲーション */}
      <div className="flex items-center justify-between bg-white rounded-xl border border-gray-200 px-5 py-4 shadow-sm">
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrev}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
            aria-label="前へ"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h2 className="text-lg font-bold text-gray-800 w-52 text-center">{headerText}</h2>
          <button
            onClick={handleNext}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
            aria-label="次へ"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={goToToday}
            className="text-xs px-3 py-1.5 rounded-lg border border-emerald-300 text-emerald-600 hover:bg-emerald-50 font-medium transition-colors"
          >
            今日
          </button>
          {/* ビューモード切替 */}
          <div className="flex items-center bg-gray-100 rounded-lg p-1 gap-0.5">
            {(["week", "day"] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`text-xs px-2.5 py-1 rounded-md font-medium transition-colors ${
                  viewMode === mode
                    ? "bg-white text-emerald-600 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {mode === "week" ? "週" : "日"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* スケジュールグリッド */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-x-auto">
        <div
          style={{
            display: "grid",
            gridTemplateColumns: `180px repeat(${displayDates.length}, 1fr)`,
            minWidth: viewMode === "week" ? "900px" : "400px",
          }}
        >
          {/* ヘッダー行 */}
          {/* 左上隅 */}
          <div className="px-4 py-3 border-b border-r border-gray-100 bg-gray-50 flex items-center">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">メンバー</span>
          </div>
          {/* 日付ヘッダー */}
          {displayDates.map((date, i) => {
            const isT = isSameDay(date, today);
            const isSun = date.getDay() === 0;
            const isSat = date.getDay() === 6;
            return (
              <div
                key={i}
                className={`px-2 py-3 border-b border-r border-gray-100 last:border-r-0 text-center ${isT ? "bg-emerald-50" : "bg-gray-50"}`}
              >
                <div className={`text-xs font-semibold ${isSun ? "text-red-500" : isSat ? "text-blue-500" : "text-gray-500"}`}>
                  {DAYS_OF_WEEK[date.getDay()]}
                </div>
                <div className={`text-sm font-bold mt-0.5 w-8 h-8 mx-auto flex items-center justify-center rounded-full ${
                  isT ? "bg-emerald-600 text-white" : isSun ? "text-red-500" : isSat ? "text-blue-500" : "text-gray-700"
                }`}>
                  {date.getDate()}
                </div>
                <div className={`text-[10px] mt-0.5 ${isT ? "text-emerald-500 font-medium" : "text-gray-400"}`}>
                  {date.getMonth() + 1}/{date.getDate()}
                </div>
              </div>
            );
          })}

          {/* メンバー行 */}
          {members.map((member) => (
            <>
              {/* メンバー情報セル */}
              <div
                key={`member-${member.id}`}
                className="px-4 py-3 border-b border-r border-gray-100 flex items-start gap-2 bg-white sticky left-0 z-10"
                style={{ minHeight: "80px" }}
              >
                <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-sm font-bold text-emerald-700 shrink-0 mt-0.5">
                  {member.name.charAt(0)}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{member.name}</p>
                  <p className="text-[10px] text-gray-400">
                    {member.role === "ADMIN" ? "管理者" : "メンバー"}
                  </p>
                </div>
              </div>

              {/* 日付セル */}
              {displayDates.map((date, di) => {
                const isT = isSameDay(date, today);
                // この日・このメンバーのタスク
                const dayTasks = tasks.filter((task) => {
                  if (task.assigneeId !== member.id) return false;
                  if (!task.deadline) return false;
                  return isSameDay(new Date(task.deadline), date);
                });
                // この日・このメンバーのサブタスク（親タスクのassigneeIdで絞り込み）
                const daySubTasks: Array<{ sub: SubTaskItem; parentTask: TaskItem }> = [];
                tasks.forEach((task) => {
                  if (task.assigneeId !== member.id) return;
                  task.subTasks.forEach((sub) => {
                    if (!sub.deadline) return;
                    if (isSameDay(new Date(sub.deadline), date)) {
                      daySubTasks.push({ sub, parentTask: task });
                    }
                  });
                });

                return (
                  <div
                    key={`${member.id}-${di}`}
                    className={`px-2 py-2 border-b border-r border-gray-100 last:border-r-0 ${isT ? "bg-emerald-50" : "bg-white"}`}
                    style={{ minHeight: "80px" }}
                  >
                    <div className="space-y-1">
                      {dayTasks.map((task) => (
                        <Link key={task.id} href={`/tasks/${task.id}`}>
                          <div
                            className={`text-[10px] leading-4 px-1.5 py-1 rounded border truncate font-medium cursor-pointer hover:opacity-80 ${getTaskCellStyle(task)}`}
                            title={`${task.title} - ${TASK_STATUS_LABELS[task.status]}`}
                          >
                            {task.title}
                          </div>
                        </Link>
                      ))}
                      {daySubTasks.map(({ sub, parentTask }) => (
                        <Link key={sub.id} href={`/tasks/${parentTask.id}`}>
                          <div
                            className={`text-[10px] leading-4 px-1.5 py-1 rounded border truncate font-medium flex items-center gap-0.5 cursor-pointer hover:opacity-80 ${
                              sub.isCompleted
                                ? "bg-gray-50 text-gray-400 border-gray-200 border-dashed line-through"
                                : "bg-emerald-50 text-emerald-700 border-emerald-300 border-dashed"
                            }`}
                            title={`[ステップ] ${sub.title}`}
                          >
                            <span className="shrink-0">↳</span>
                            <span className="truncate">{sub.title}</span>
                          </div>
                        </Link>
                      ))}
                      {dayTasks.length === 0 && daySubTasks.length === 0 && (
                        <div className="h-4" />
                      )}
                    </div>
                  </div>
                );
              })}
            </>
          ))}
        </div>
      </div>

      {/* フッター注記 */}
      <p className="text-xs text-gray-400 text-center pb-2">
        * 各日のタスク・ステップの期限をメンバーごとに表示しています
      </p>
    </div>
  );
}
