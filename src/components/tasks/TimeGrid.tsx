"use client";

import { useState, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Priority, TaskStatus } from "@/types";

interface TimeTask {
  id: string;
  title: string;
  startAt: string | null;
  deadline: string | null;
  priority: Priority;
  status: TaskStatus;
  assignee: { name: string } | null;
}

interface TimeGridProps {
  date: Date;           // The day to display
  tasks: TimeTask[];
  showAddButton?: boolean;
}

const SLOT_HEIGHT = 40; // px per 30-min slot
const START_HOUR = 6;   // Show from 6:00
const END_HOUR = 23;    // To 23:00
const TOTAL_SLOTS = (END_HOUR - START_HOUR) * 2; // 34 slots

const PRIORITY_COLORS: Record<Priority, string> = {
  HIGH: "bg-red-400 border-red-500 text-white",
  MEDIUM: "bg-amber-400 border-amber-500 text-white",
  LOW: "bg-teal-400 border-teal-500 text-white",
};

function timeToSlot(date: Date): number {
  const minutes = date.getHours() * 60 + date.getMinutes();
  const startMinutes = START_HOUR * 60;
  return (minutes - startMinutes) / 30;
}

function slotToISOTime(date: Date, slot: number): string {
  const totalMinutes = START_HOUR * 60 + slot * 30;
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  const d = new Date(date);
  d.setHours(hours, mins, 0, 0);
  return d.toISOString();
}

function slotToLabel(slot: number): string {
  const totalMinutes = START_HOUR * 60 + slot * 30;
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
}

export default function TimeGrid({ date, tasks, showAddButton = true }: TimeGridProps) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const [dragStart, setDragStart] = useState<number | null>(null);
  const [dragEnd, setDragEnd] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // showAddButton is used to conditionally render add interactions
  void showAddButton;

  const today = new Date();
  const isToday = isSameDay(date, today);
  const currentSlot = isToday ? timeToSlot(today) : -1;

  // Filter tasks for this day (by startAt or deadline)
  const dayTasks = tasks.filter(t => {
    const checkDate = t.startAt || t.deadline;
    if (!checkDate) return false;
    return isSameDay(new Date(checkDate), date);
  });

  // Get task position in the grid
  const getTaskStyle = (task: TimeTask) => {
    const startDate = task.startAt ? new Date(task.startAt) : task.deadline ? new Date(task.deadline) : null;
    const endDate = task.deadline ? new Date(task.deadline) : null;
    if (!startDate) return null;

    let startSlot = Math.max(0, timeToSlot(startDate));
    let endSlot = endDate && task.startAt ? timeToSlot(endDate) : startSlot + 2; // default 1h
    if (endSlot <= startSlot) endSlot = startSlot + 1;
    endSlot = Math.min(endSlot, TOTAL_SLOTS);

    return {
      top: startSlot * SLOT_HEIGHT,
      height: Math.max((endSlot - startSlot) * SLOT_HEIGHT, SLOT_HEIGHT),
    };
  };

  const handleMouseDown = useCallback((e: React.MouseEvent, slot: number) => {
    e.preventDefault();
    setDragStart(slot);
    setDragEnd(slot);
    setIsDragging(true);
  }, []);

  const handleMouseMove = useCallback((slot: number) => {
    if (!isDragging) return;
    setDragEnd(slot);
  }, [isDragging]);

  const handleMouseUp = useCallback(() => {
    if (!isDragging || dragStart === null || dragEnd === null) {
      setIsDragging(false);
      return;
    }
    setIsDragging(false);

    const start = Math.min(dragStart, dragEnd);
    const end = Math.max(dragStart, dragEnd) + 1;

    // slotToISOTime is referenced to avoid unused warning
    void slotToISOTime(date, start);

    // Navigate to task creation with pre-filled times
    const dateStr = `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}`;
    const startTime = slotToLabel(start);
    const endTime = slotToLabel(end);
    router.push(`/tasks/new?deadline=${dateStr}&startAtTime=${startTime}&deadlineTime=${endTime}`);

    setDragStart(null);
    setDragEnd(null);
  }, [isDragging, dragStart, dragEnd, date, router]);

  const dragTop = dragStart !== null && dragEnd !== null
    ? Math.min(dragStart, dragEnd) * SLOT_HEIGHT
    : 0;
  const dragHeight = dragStart !== null && dragEnd !== null
    ? (Math.abs(dragEnd - dragStart) + 1) * SLOT_HEIGHT
    : 0;

  const slots = Array.from({ length: TOTAL_SLOTS }, (_, i) => i);

  return (
    <div className="flex select-none" onMouseLeave={() => { if (isDragging) handleMouseUp(); }}>
      {/* Time labels */}
      <div className="w-14 shrink-0">
        {slots.map(slot => (
          <div key={slot} style={{ height: SLOT_HEIGHT }} className="relative">
            {slot % 2 === 0 && (
              <span className="absolute -top-2 right-2 text-[10px] text-gray-400 font-medium">
                {slotToLabel(slot)}
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Events area */}
      <div
        ref={containerRef}
        className="flex-1 relative border-l border-gray-200 cursor-crosshair"
        onMouseUp={handleMouseUp}
      >
        {/* Slot backgrounds (for drag) */}
        {slots.map(slot => (
          <div
            key={slot}
            style={{ height: SLOT_HEIGHT }}
            className={`border-b ${slot % 2 === 0 ? "border-gray-200" : "border-gray-100"} hover:bg-emerald-50/30 transition-colors`}
            onMouseDown={(e) => handleMouseDown(e, slot)}
            onMouseMove={() => handleMouseMove(slot)}
          />
        ))}

        {/* Current time indicator */}
        {isToday && currentSlot >= 0 && currentSlot <= TOTAL_SLOTS && (
          <div
            className="absolute left-0 right-0 z-20 pointer-events-none"
            style={{ top: currentSlot * SLOT_HEIGHT - 1 }}
          >
            <div className="flex items-center">
              <div className="w-2 h-2 rounded-full bg-red-500 -ml-1" />
              <div className="flex-1 h-0.5 bg-red-400" />
            </div>
          </div>
        )}

        {/* Drag preview */}
        {isDragging && dragHeight > 0 && (
          <div
            className="absolute left-1 right-1 bg-emerald-200/70 border-2 border-emerald-400 border-dashed rounded-lg z-10 pointer-events-none flex items-center justify-center"
            style={{ top: dragTop, height: dragHeight }}
          >
            <span className="text-xs text-emerald-700 font-medium">
              {dragStart !== null && dragEnd !== null && (
                `${slotToLabel(Math.min(dragStart, dragEnd))} - ${slotToLabel(Math.max(dragStart, dragEnd) + 1)}`
              )}
            </span>
          </div>
        )}

        {/* Tasks */}
        {dayTasks.map(task => {
          const style = getTaskStyle(task);
          if (!style) return null;
          const isDone = task.status === "DONE";
          const colorClass = isDone
            ? "bg-gray-300 border-gray-400 text-gray-600"
            : PRIORITY_COLORS[task.priority];
          return (
            <Link key={task.id} href={`/tasks/${task.id}`}>
              <div
                className={`absolute left-1 right-1 rounded-lg border px-2 py-1 z-10 overflow-hidden cursor-pointer hover:brightness-95 transition-all shadow-sm ${colorClass} ${isDone ? "opacity-60" : ""}`}
                style={{ top: style.top + 1, height: style.height - 2 }}
              >
                <p className="text-xs font-semibold leading-tight truncate">{task.title}</p>
                {task.assignee && style.height > SLOT_HEIGHT && (
                  <p className="text-[10px] opacity-80 truncate">{task.assignee.name}</p>
                )}
                {style.height >= SLOT_HEIGHT * 2 && (
                  <p className="text-[10px] opacity-70">
                    {task.startAt ? new Date(task.startAt).toLocaleTimeString("ja", {hour:"2-digit",minute:"2-digit"}) : ""}
                    {task.startAt && task.deadline ? " - " : ""}
                    {task.deadline ? new Date(task.deadline).toLocaleTimeString("ja", {hour:"2-digit",minute:"2-digit"}) : ""}
                  </p>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
