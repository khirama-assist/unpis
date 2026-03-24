"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface TaskDetailActionsProps {
  taskId: string;
  canEdit: boolean;
}

export default function TaskDetailActions({ taskId, canEdit }: TaskDetailActionsProps) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [confirm, setConfirm] = useState(false);

  const handleDelete = async () => {
    if (!confirm) { setConfirm(true); return; }
    setDeleting(true);
    await fetch(`/api/tasks/${taskId}`, { method: "DELETE" });
    router.push("/tasks");
    router.refresh();
  };

  if (!canEdit) return null;

  return (
    <div className="flex items-center gap-2">
      <Link
        href={`/tasks/${taskId}/edit`}
        className="text-sm px-3 py-1.5 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
      >
        編集
      </Link>
      <button
        onClick={handleDelete}
        disabled={deleting}
        className={`text-sm px-3 py-1.5 rounded-lg transition-colors ${
          confirm
            ? "bg-red-500 text-white hover:bg-red-600"
            : "border border-red-200 text-red-500 hover:bg-red-50"
        }`}
      >
        {deleting ? "削除中..." : confirm ? "本当に削除" : "削除"}
      </button>
      {confirm && (
        <button
          onClick={() => setConfirm(false)}
          className="text-sm text-gray-400 hover:text-gray-600"
        >
          キャンセル
        </button>
      )}
    </div>
  );
}
