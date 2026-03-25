"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  TaskStatus,
  Priority,
  TASK_STATUS_LABELS,
  TASK_STATUS_COLORS,
  PRIORITY_LABELS,
  PRIORITY_COLORS,
} from "@/types";

// ===== 型定義 =====
type CalendarViewMode = "month" | "week" | "day";

interface CalendarTask {
  id: string;
  title: string;
  priority: Priority;
  status: TaskStatus;
  deadline: string | null;
  progress: number;
  assignee: { id: string; name: string; email: string } | null;
}

interface CalendarSubTask {
  id: string;
  title: string;
  isCompleted: boolean;
  deadline: string | null;
  taskId: string;
  task: { id: string; title: string };
}

interface CalendarViewProps {
  tasks: CalendarTask[];
  subTasks: CalendarSubTask[];
}

// ===== 定数 =====
const DAYS_OF_WEEK = ["日", "月", "火", "水", "木", "金", "土"];

const PRIORITY_BADGE: Record<Priority, string> = {
  HIGH: "bg-red-100 text-red-700 border-red-200",
  MEDIUM: "bg-amber-100 text-amber-700 border-amber-200",
  LOW: "bg-teal-100 text-teal-700 border-teal-200",
};

const OVERDUE_BADGE = "bg-red-200 text-red-800 border-red-300";
// サブタスク用バッジ（点線枠・エメラルド系）
const SUBTASK_BADGE = "bg-emerald-50 text-emerald-700 border-emerald-300 border-dashed";
const SUBTASK_DONE_BADGE = "bg-gray-50 text-gray-400 border-gray-200 border-dashed line-through";
const SUBTASK_OVERDUE_BADGE = "bg-orange-100 text-orange-700 border-orange-300 border-dashed";

// ===== ユーティリティ =====
function getDateKey(date: Date): string {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

function toDateStr(date: Date): string {
  // YYYY-MM-DD（ローカル時間）
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function isOverdue(deadline: Date, today: Date): boolean {
  const d = new Date(deadline);
  d.setHours(23, 59, 59, 999);
  return d < today && !isSameDay(d, today);
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

// ===== コンポーネント =====
export default function CalendarView({ tasks, subTasks }: CalendarViewProps) {
  const router = useRouter();
  const today = new Date();
  const [viewMode, setViewMode] = useState<CalendarViewMode>("month");
  const [currentDate, setCurrentDate] = useState(
    new Date(today.getFullYear(), today.getMonth(), today.getDate())
  );
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // カレンダーグリッドの日付生成（月表示用）
  const firstDayOfWeek = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const calendarCells: (Date | null)[] = [];
  for (let i = 0; i < firstDayOfWeek; i++) calendarCells.push(null);
  for (let d = 1; d <= daysInMonth; d++) calendarCells.push(new Date(year, month, d));
  while (calendarCells.length % 7 !== 0) calendarCells.push(null);

  // 週表示用
  const weekDates = getWeekDates(currentDate);

  // 日付ごとにタスク・サブタスクをグループ化
  const tasksByDate: Record<string, CalendarTask[]> = {};
  tasks.forEach((task) => {
    if (!task.deadline) return;
    const key = getDateKey(new Date(task.deadline));
    if (!tasksByDate[key]) tasksByDate[key] = [];
    tasksByDate[key].push(task);
  });

  const subTasksByDate: Record<string, CalendarSubTask[]> = {};
  subTasks.forEach((sub) => {
    if (!sub.deadline) return;
    const key = getDateKey(new Date(sub.deadline));
    if (!subTasksByDate[key]) subTasksByDate[key] = [];
    subTasksByDate[key].push(sub);
  });

  // 選択日のデータ
  const selectedTasks = selectedDay ? (tasksByDate[getDateKey(selectedDay)] ?? []) : [];
  const selectedSubTasks = selectedDay ? (subTasksByDate[getDateKey(selectedDay)] ?? []) : [];

  const handleDayClick = (date: Date) => {
    setSelectedDay((prev) => (prev && isSameDay(prev, date) ? null : date));
  };

  // ナビゲーション
  const handlePrev = () => {
    if (viewMode === "month") {
      setCurrentDate(new Date(year, month - 1, 1));
    } else if (viewMode === "week") {
      const d = new Date(currentDate);
      d.setDate(d.getDate() - 7);
      setCurrentDate(d);
    } else {
      const d = new Date(currentDate);
      d.setDate(d.getDate() - 1);
      setCurrentDate(d);
    }
  };

  const handleNext = () => {
    if (viewMode === "month") {
      setCurrentDate(new Date(year, month + 1, 1));
    } else if (viewMode === "week") {
      const d = new Date(currentDate);
      d.setDate(d.getDate() + 7);
      setCurrentDate(d);
    } else {
      const d = new Date(currentDate);
      d.setDate(d.getDate() + 1);
      setCurrentDate(d);
    }
  };

  const goToToday = () => {
    setCurrentDate(new Date(today.getFullYear(), today.getMonth(), today.getDate()));
    if (viewMode === "month") {
      setSelectedDay(today);
    }
  };

  // 選択日付でタスク新規作成ページへ
  const handleAddTask = (date?: Date) => {
    const targetDate = date ?? selectedDay;
    if (!targetDate) return;
    router.push(`/tasks/new?deadline=${toDateStr(targetDate)}`);
  };

  // ヘッダーテキスト
  const headerText = (() => {
    if (viewMode === "month") return `${year}年 ${month + 1}月`;
    if (viewMode === "week") {
      return `${weekDates[0].getMonth() + 1}/${weekDates[0].getDate()} - ${weekDates[6].getMonth() + 1}/${weekDates[6].getDate()}`;
    }
    return `${currentDate.getMonth() + 1}月${currentDate.getDate()}日（${DAYS_OF_WEEK[currentDate.getDay()]}）`;
  })();

  // ===== 週ビュー =====
  const renderWeekView = () => (
    <div className="flex-1 bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm min-w-0">
      {/* ナビゲーション */}
      {renderNavigation()}

      {/* 曜日ヘッダー */}
      <div className="grid grid-cols-7 border-b border-gray-100">
        {weekDates.map((date, i) => {
          const isT = isSameDay(date, today);
          const isSun = date.getDay() === 0;
          const isSat = date.getDay() === 6;
          return (
            <div
              key={i}
              className={`text-center py-2 px-1 border-r border-gray-100 last:border-r-0 ${isT ? "bg-emerald-50" : ""}`}
            >
              <div className={`text-xs font-semibold ${isSun ? "text-red-500" : isSat ? "text-blue-500" : "text-gray-500"}`}>
                {DAYS_OF_WEEK[date.getDay()]}
              </div>
              <div className={`text-sm font-bold mt-0.5 w-7 h-7 mx-auto flex items-center justify-center rounded-full ${
                isT ? "bg-emerald-600 text-white" : isSun ? "text-red-500" : isSat ? "text-blue-500" : "text-gray-700"
              }`}>
                {date.getMonth() + 1}/{date.getDate()}
              </div>
            </div>
          );
        })}
      </div>

      {/* タスクグリッド */}
      <div className="grid grid-cols-7" style={{ minHeight: "200px" }}>
        {weekDates.map((date, i) => {
          const key = getDateKey(date);
          const dayTasks = tasksByDate[key] ?? [];
          const daySubTasks = subTasksByDate[key] ?? [];
          const isT = isSameDay(date, today);
          return (
            <div
              key={i}
              className={`border-r border-b border-gray-100 last:border-r-0 p-1 flex flex-col ${isT ? "bg-emerald-50" : "bg-white"}`}
              style={{ minHeight: "200px" }}
            >
              <div className="flex-1 space-y-0.5 overflow-hidden">
                {dayTasks.map((task) => {
                  const overdue = task.status !== "DONE" && isOverdue(new Date(task.deadline!), today);
                  const cls = task.status === "DONE"
                    ? "bg-gray-100 text-gray-400 border-gray-200 line-through"
                    : overdue ? OVERDUE_BADGE
                    : PRIORITY_BADGE[task.priority];
                  return (
                    <Link key={task.id} href={`/tasks/${task.id}`}>
                      <div className={`text-[10px] leading-4 px-1 py-0.5 rounded border truncate font-medium cursor-pointer hover:opacity-80 ${cls}`} title={task.title}>
                        {task.title}
                      </div>
                    </Link>
                  );
                })}
                {daySubTasks.map((sub) => {
                  const overdue = !sub.isCompleted && isOverdue(new Date(sub.deadline!), today);
                  const cls = sub.isCompleted ? SUBTASK_DONE_BADGE
                    : overdue ? SUBTASK_OVERDUE_BADGE
                    : SUBTASK_BADGE;
                  return (
                    <Link key={sub.id} href={`/tasks/${sub.task.id}`}>
                      <div className={`text-[10px] leading-4 px-1 py-0.5 rounded border truncate font-medium flex items-center gap-0.5 cursor-pointer hover:opacity-80 ${cls}`} title={`[ステップ] ${sub.title}`}>
                        <span className="shrink-0">↳</span>
                        <span className="truncate">{sub.title}</span>
                      </div>
                    </Link>
                  );
                })}
              </div>
              <button
                onClick={() => handleAddTask(date)}
                className="mt-1 text-[10px] text-gray-300 hover:text-emerald-500 transition-colors text-left px-1"
              >
                + 追加
              </button>
            </div>
          );
        })}
      </div>

      {/* 凡例 */}
      {renderLegend()}
    </div>
  );

  // ===== 日ビュー =====
  const renderDayView = () => {
    const key = getDateKey(currentDate);
    const dayTasks = tasksByDate[key] ?? [];
    const daySubTasks = subTasksByDate[key] ?? [];
    const isT = isSameDay(currentDate, today);

    return (
      <div className="flex-1 bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm min-w-0">
        {/* ナビゲーション */}
        {renderNavigation()}

        {/* 日ヘッダー */}
        <div className={`px-5 py-3 border-b border-gray-100 flex items-center justify-between ${isT ? "bg-emerald-50" : "bg-gray-50"}`}>
          <div>
            <p className={`text-lg font-bold ${isT ? "text-emerald-700" : "text-gray-800"}`}>
              {currentDate.getMonth() + 1}月{currentDate.getDate()}日（{DAYS_OF_WEEK[currentDate.getDay()]}）
            </p>
            {isT && <p className="text-xs text-emerald-500 font-medium">今日</p>}
          </div>
          <button
            onClick={() => handleAddTask(currentDate)}
            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            タスクを追加
          </button>
        </div>

        {/* コンテンツ */}
        <div className="p-4 space-y-4">
          {/* タスクセクション */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <p className="text-sm font-semibold text-gray-600">タスク</p>
              <span className="text-xs text-gray-400">{dayTasks.length}件</span>
            </div>

            {dayTasks.length === 0 ? (
              <p className="text-sm text-gray-300 pl-1">この日のタスクはありません</p>
            ) : (
              <div className="space-y-2">
                {dayTasks.map((task) => {
                  const overdue = task.status !== "DONE" && isOverdue(new Date(task.deadline!), today);
                  return (
                    <Link key={task.id} href={`/tasks/${task.id}`}>
                      <div className={`p-3 rounded-lg border transition-colors cursor-pointer ${
                        overdue ? "border-red-200 bg-red-50 hover:bg-red-100"
                        : "border-gray-200 bg-white hover:border-emerald-300 hover:bg-emerald-50"
                      }`}>
                        <p className={`text-sm font-medium mb-1.5 leading-snug ${
                          task.status === "DONE" ? "text-gray-400 line-through"
                          : overdue ? "text-red-800"
                          : "text-gray-800"
                        }`}>
                          {task.title}
                        </p>
                        <div className="flex flex-wrap gap-1">
                          <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${PRIORITY_COLORS[task.priority]}`}>
                            {PRIORITY_LABELS[task.priority]}優先
                          </span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${TASK_STATUS_COLORS[task.status]}`}>
                            {TASK_STATUS_LABELS[task.status]}
                          </span>
                          {overdue && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded font-medium bg-red-200 text-red-800">期限超過</span>
                          )}
                        </div>
                        {task.assignee && (
                          <p className="text-[10px] text-gray-400 mt-1">担当：{task.assignee.name}</p>
                        )}
                        {task.progress > 0 && (
                          <div className="mt-2">
                            <div className="flex justify-between text-[10px] text-gray-400 mb-0.5">
                              <span>進捗</span><span>{task.progress}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-1">
                              <div className={`h-1 rounded-full ${task.progress === 100 ? "bg-emerald-500" : task.progress >= 50 ? "bg-emerald-400" : "bg-emerald-300"}`}
                                style={{ width: `${task.progress}%` }} />
                            </div>
                          </div>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* サブタスクセクション */}
          {daySubTasks.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
                <p className="text-sm font-semibold text-emerald-600">ステップ期限</p>
                <span className="text-xs text-gray-400">{daySubTasks.length}件</span>
              </div>
              <div className="space-y-2">
                {daySubTasks.map((sub) => {
                  const overdue = !sub.isCompleted && isOverdue(new Date(sub.deadline!), today);
                  return (
                    <Link key={sub.id} href={`/tasks/${sub.task.id}`}>
                      <div className={`p-2.5 rounded-lg border transition-colors cursor-pointer ${
                        sub.isCompleted ? "border-gray-100 bg-gray-50"
                        : overdue ? "border-orange-200 bg-orange-50 hover:bg-orange-100"
                        : "border-emerald-200 bg-emerald-50 hover:bg-emerald-100"
                      }`}>
                        <p className="text-[10px] text-gray-400 mb-0.5 truncate">
                          📋 {sub.task.title}
                        </p>
                        <div className="flex items-start gap-1">
                          <span className="text-emerald-400 text-xs mt-0.5 shrink-0">↳</span>
                          <p className={`text-xs font-medium leading-snug ${
                            sub.isCompleted ? "text-gray-400 line-through"
                            : overdue ? "text-orange-800"
                            : "text-emerald-800"
                          }`}>
                            {sub.title}
                          </p>
                        </div>
                        <div className="mt-1.5 flex gap-1">
                          {sub.isCompleted ? (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-400 font-medium">完了</span>
                          ) : overdue ? (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-orange-200 text-orange-800 font-medium">期限超過</span>
                          ) : (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 font-medium">未完了</span>
                          )}
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {dayTasks.length === 0 && daySubTasks.length === 0 && (
            <div className="text-center py-16">
              <div className="w-16 h-16 mx-auto mb-3 overflow-hidden select-none">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/unpis-logo.png"
                  alt=""
                  className="w-full"
                  style={{ height: "160%", objectFit: "cover", objectPosition: "center 5%" }}
                />
              </div>
              <p className="text-sm text-gray-400 font-medium">予定はありません</p>
              <p className="text-xs text-gray-300 mt-1">上のボタンからタスクを追加できます</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  // ===== ナビゲーションバー（共通） =====
  const renderNavigation = () => (
    <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
      <div className="flex items-center gap-2">
        <button onClick={handlePrev} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors" aria-label="前へ">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h2 className="text-lg font-bold text-gray-800 w-52 text-center">{headerText}</h2>
        <button onClick={handleNext} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors" aria-label="次へ">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
      <div className="flex items-center gap-2">
        <button onClick={goToToday} className="text-xs px-3 py-1.5 rounded-lg border border-emerald-300 text-emerald-600 hover:bg-emerald-50 font-medium transition-colors">
          今日
        </button>
        {/* ビューモード切替 */}
        <div className="flex items-center bg-gray-100 rounded-lg p-1 gap-0.5">
          {(["month", "week", "day"] as CalendarViewMode[]).map((mode) => {
            const label = mode === "month" ? "月" : mode === "week" ? "週" : "日";
            return (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`text-xs px-2.5 py-1 rounded-md font-medium transition-colors ${
                  viewMode === mode
                    ? "bg-white text-emerald-600 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );

  // ===== 凡例（共通） =====
  const renderLegend = () => (
    <div className="flex flex-wrap gap-4 px-5 py-3 border-t border-gray-100 bg-gray-50">
      <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide w-full mb-0">凡例</p>
      <div className="flex items-center gap-1.5">
        <div className="w-2.5 h-2.5 rounded-sm border bg-red-100 border-red-200" />
        <span className="text-xs text-gray-500">高優先タスク</span>
      </div>
      <div className="flex items-center gap-1.5">
        <div className="w-2.5 h-2.5 rounded-sm border bg-amber-100 border-amber-200" />
        <span className="text-xs text-gray-500">中優先タスク</span>
      </div>
      <div className="flex items-center gap-1.5">
        <div className="w-2.5 h-2.5 rounded-sm border bg-teal-100 border-teal-200" />
        <span className="text-xs text-gray-500">低優先タスク</span>
      </div>
      <div className="flex items-center gap-1.5">
        <div className={`w-2.5 h-2.5 rounded-sm border ${SUBTASK_BADGE}`} style={{ borderStyle: "dashed" }} />
        <span className="text-xs text-gray-500">ステップ（↳）</span>
      </div>
      <div className="flex items-center gap-1.5">
        <div className="w-2.5 h-2.5 rounded-sm border bg-red-200 border-red-300" />
        <span className="text-xs text-gray-500">期限超過</span>
      </div>
      <div className="flex items-center gap-1.5">
        <div className="w-2.5 h-2.5 rounded-sm border bg-gray-100 border-gray-200" />
        <span className="text-xs text-gray-500">完了</span>
      </div>
    </div>
  );

  // ===== 週ビュー・日ビューの場合は右パネルなし =====
  if (viewMode === "week") return renderWeekView();
  if (viewMode === "day") return renderDayView();

  // ===== 月ビュー =====
  return (
    <div className="flex gap-5 items-start">
      {/* ===== カレンダー本体 ===== */}
      <div className="flex-1 bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm min-w-0">

        {/* 月ナビゲーション */}
        {renderNavigation()}

        {/* 曜日ヘッダー */}
        <div className="grid grid-cols-7 border-b border-gray-100">
          {DAYS_OF_WEEK.map((day, i) => (
            <div key={day} className={`text-center text-xs font-semibold py-2.5 ${i === 0 ? "text-red-500" : i === 6 ? "text-blue-500" : "text-gray-500"}`}>
              {day}
            </div>
          ))}
        </div>

        {/* 日付グリッド */}
        <div className="grid grid-cols-7">
          {calendarCells.map((date, idx) => {
            if (!date) {
              return <div key={`empty-${idx}`} className="h-32 bg-gray-50 border-r border-b border-gray-100 last:border-r-0" />;
            }

            const key = getDateKey(date);
            const dayTasks = tasksByDate[key] ?? [];
            const daySubTasks = subTasksByDate[key] ?? [];
            const totalItems = dayTasks.length + daySubTasks.length;
            const isToday = isSameDay(date, today);
            const isSelected = selectedDay ? isSameDay(date, selectedDay) : false;
            const isSun = date.getDay() === 0;
            const isSat = date.getDay() === 6;

            // グリッドに表示するアイテム（タスク優先、合計3件まで）
            const visibleTasks = dayTasks.slice(0, 3);
            const remainingSlots = 3 - visibleTasks.length;
            const visibleSubTasks = daySubTasks.slice(0, remainingSlots);
            const hiddenCount = totalItems - visibleTasks.length - visibleSubTasks.length;

            return (
              <div
                key={key}
                onClick={() => handleDayClick(date)}
                className={`h-32 border-r border-b border-gray-100 last:border-r-0 p-1.5 cursor-pointer transition-colors select-none ${
                  isSelected
                    ? "bg-emerald-50 ring-2 ring-inset ring-emerald-400"
                    : isToday
                    ? "bg-blue-50"
                    : isSun || isSat
                    ? "bg-gray-50 hover:bg-gray-100"
                    : "bg-white hover:bg-gray-50"
                }`}
              >
                {/* 日付番号 */}
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-xs font-semibold w-6 h-6 flex items-center justify-center rounded-full ${
                    isToday ? "bg-emerald-600 text-white"
                    : isSun ? "text-red-500"
                    : isSat ? "text-blue-500"
                    : "text-gray-700"
                  }`}>
                    {date.getDate()}
                  </span>
                  {/* タスクがある日に＋ヒント */}
                  {totalItems === 0 && (
                    <span className="text-[9px] text-gray-300 opacity-0 group-hover:opacity-100">＋</span>
                  )}
                </div>

                {/* タスク・サブタスクバッジ */}
                <div className="space-y-0.5 overflow-hidden">
                  {/* タスク */}
                  {visibleTasks.map((task) => {
                    const overdue = task.status !== "DONE" && isOverdue(new Date(task.deadline!), today);
                    const cls = task.status === "DONE"
                      ? "bg-gray-100 text-gray-400 border-gray-200 line-through"
                      : overdue ? OVERDUE_BADGE
                      : PRIORITY_BADGE[task.priority];
                    return (
                      <div key={task.id} className={`text-[10px] leading-4 px-1 py-0.5 rounded border truncate font-medium ${cls}`} title={task.title}>
                        {task.title}
                      </div>
                    );
                  })}

                  {/* サブタスク（点線枠・ステップアイコン付き） */}
                  {visibleSubTasks.map((sub) => {
                    const overdue = !sub.isCompleted && isOverdue(new Date(sub.deadline!), today);
                    const cls = sub.isCompleted ? SUBTASK_DONE_BADGE
                      : overdue ? SUBTASK_OVERDUE_BADGE
                      : SUBTASK_BADGE;
                    return (
                      <div key={sub.id} className={`text-[10px] leading-4 px-1 py-0.5 rounded border truncate font-medium flex items-center gap-0.5 ${cls}`} title={`[ステップ] ${sub.title}`}>
                        <span className="shrink-0">↳</span>
                        <span className="truncate">{sub.title}</span>
                      </div>
                    );
                  })}

                  {hiddenCount > 0 && (
                    <div className="text-[10px] text-gray-400 pl-0.5 font-medium">+{hiddenCount} 件</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* 凡例 */}
        {renderLegend()}
      </div>

      {/* ===== 右パネル：選択日の詳細（月ビューのみ） ===== */}
      {selectedDay && (
        <div className="w-76 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex-shrink-0" style={{ width: "300px" }}>

          {/* パネルヘッダー */}
          <div className="px-4 py-3 border-b border-gray-100 bg-emerald-50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-emerald-600 font-medium">選択中の日付</p>
                <p className="text-base font-bold text-gray-800">
                  {selectedDay.getMonth() + 1}月{selectedDay.getDate()}日（{DAYS_OF_WEEK[selectedDay.getDay()]}）
                </p>
              </div>
              <button onClick={() => setSelectedDay(null)} className="text-gray-400 hover:text-gray-600 p-1 rounded transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* タスク追加ボタン */}
            <button
              onClick={() => handleAddTask()}
              className="mt-2 w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              この日を期限にタスクを追加
            </button>
          </div>

          {/* コンテンツ */}
          <div className="max-h-[calc(100vh-260px)] overflow-y-auto">

            {/* タスクセクション */}
            <div className="p-3">
              <div className="flex items-center gap-2 mb-2">
                <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">タスク</p>
                <span className="text-xs text-gray-400">{selectedTasks.length}件</span>
              </div>

              {selectedTasks.length === 0 ? (
                <p className="text-xs text-gray-300 pl-1 mb-1">この日のタスクはありません</p>
              ) : (
                <div className="space-y-2">
                  {selectedTasks.map((task) => {
                    const overdue = task.status !== "DONE" && isOverdue(new Date(task.deadline!), today);
                    return (
                      <Link key={task.id} href={`/tasks/${task.id}`}>
                        <div className={`p-3 rounded-lg border transition-colors cursor-pointer ${
                          overdue ? "border-red-200 bg-red-50 hover:bg-red-100"
                          : "border-gray-200 bg-white hover:border-emerald-300 hover:bg-emerald-50"
                        }`}>
                          <p className={`text-sm font-medium mb-1.5 leading-snug ${
                            task.status === "DONE" ? "text-gray-400 line-through"
                            : overdue ? "text-red-800"
                            : "text-gray-800"
                          }`}>
                            {task.title}
                          </p>
                          <div className="flex flex-wrap gap-1">
                            <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${PRIORITY_COLORS[task.priority]}`}>
                              {PRIORITY_LABELS[task.priority]}優先
                            </span>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${TASK_STATUS_COLORS[task.status]}`}>
                              {TASK_STATUS_LABELS[task.status]}
                            </span>
                            {overdue && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded font-medium bg-red-200 text-red-800">期限超過</span>
                            )}
                          </div>
                          {task.assignee && (
                            <p className="text-[10px] text-gray-400 mt-1">担当：{task.assignee.name}</p>
                          )}
                          {task.progress > 0 && (
                            <div className="mt-2">
                              <div className="flex justify-between text-[10px] text-gray-400 mb-0.5">
                                <span>進捗</span><span>{task.progress}%</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-1">
                                <div className={`h-1 rounded-full ${task.progress === 100 ? "bg-emerald-500" : task.progress >= 50 ? "bg-emerald-400" : "bg-emerald-300"}`}
                                  style={{ width: `${task.progress}%` }} />
                              </div>
                            </div>
                          )}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>

            {/* サブタスク（ステップ）セクション */}
            {selectedSubTasks.length > 0 && (
              <div className="p-3 border-t border-dashed border-gray-100">
                <div className="flex items-center gap-2 mb-2">
                  <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                  <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wide">ステップ期限</p>
                  <span className="text-xs text-gray-400">{selectedSubTasks.length}件</span>
                </div>
                <div className="space-y-2">
                  {selectedSubTasks.map((sub) => {
                    const overdue = !sub.isCompleted && isOverdue(new Date(sub.deadline!), today);
                    return (
                      <Link key={sub.id} href={`/tasks/${sub.task.id}`}>
                        <div className={`p-2.5 rounded-lg border transition-colors cursor-pointer ${
                          sub.isCompleted ? "border-gray-100 bg-gray-50"
                          : overdue ? "border-orange-200 bg-orange-50 hover:bg-orange-100"
                          : "border-emerald-200 bg-emerald-50 hover:bg-emerald-100"
                        }`}>
                          {/* 親タスク名 */}
                          <p className="text-[10px] text-gray-400 mb-0.5 truncate">
                            📋 {sub.task.title}
                          </p>
                          {/* ステップ名 */}
                          <div className="flex items-start gap-1">
                            <span className="text-emerald-400 text-xs mt-0.5 shrink-0">↳</span>
                            <p className={`text-xs font-medium leading-snug ${
                              sub.isCompleted ? "text-gray-400 line-through"
                              : overdue ? "text-orange-800"
                              : "text-emerald-800"
                            }`}>
                              {sub.title}
                            </p>
                          </div>
                          {/* ステータスバッジ */}
                          <div className="mt-1.5 flex gap-1">
                            {sub.isCompleted ? (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-400 font-medium">完了</span>
                            ) : overdue ? (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-orange-200 text-orange-800 font-medium">期限超過</span>
                            ) : (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 font-medium">未完了</span>
                            )}
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 何もない場合 */}
            {selectedTasks.length === 0 && selectedSubTasks.length === 0 && (
              <div className="text-center py-10 px-4">
                <div className="w-16 h-16 mx-auto mb-3 overflow-hidden select-none">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/unpis-logo.png"
                    alt=""
                    className="w-full"
                    style={{ height: "160%", objectFit: "cover", objectPosition: "center 5%" }}
                  />
                </div>
                <p className="text-sm text-gray-400 font-medium">予定はありません</p>
                <p className="text-xs text-gray-300 mt-1">上のボタンからタスクを追加できます</p>
              </div>
            )}
          </div>

          {/* フッター */}
          {(selectedTasks.length > 0 || selectedSubTasks.length > 0) && (
            <div className="px-4 py-2 border-t border-gray-100 bg-gray-50 flex justify-between text-xs text-gray-400">
              <span>タスク {selectedTasks.filter((t) => t.status === "DONE").length}/{selectedTasks.length} 完了</span>
              <span>ステップ {selectedSubTasks.filter((s) => s.isCompleted).length}/{selectedSubTasks.length} 完了</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
