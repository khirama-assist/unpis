"use client";

import { useState } from "react";
import Avatar from "@/components/ui/Avatar";
import Modal from "@/components/ui/Modal";
import { ROLE_LABELS } from "@/types";
import type { MemberData } from "@/types";

interface MembersClientProps {
  initialMembers: MemberData[];
  currentUserId: string;
}

export default function MembersClient({ initialMembers, currentUserId }: MembersClientProps) {
  const [members, setMembers] = useState(initialMembers);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "MEMBER" });
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.password.trim()) {
      setFormError("すべての項目を入力してください");
      return;
    }
    setSaving(true);
    setFormError("");

    const res = await fetch("/api/members", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    if (res.ok) {
      const newMember = await res.json();
      setMembers([...members, { ...newMember, _count: { assignedTasks: 0 } }]);
      setIsModalOpen(false);
      setForm({ name: "", email: "", password: "", role: "MEMBER" });
    } else {
      const data = await res.json();
      setFormError(data.error ?? "エラーが発生しました");
    }
    setSaving(false);
  };

  const handleRoleChange = async (id: string, role: string) => {
    const res = await fetch(`/api/members/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });
    if (res.ok) {
      setMembers(members.map((m) => (m.id === id ? { ...m, role: role as "ADMIN" | "MEMBER" } : m)));
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`${name} を削除してもよいですか？\nこのメンバーのタスク割り当ては解除されます。`)) return;
    const res = await fetch(`/api/members/${id}`, { method: "DELETE" });
    if (res.ok) {
      setMembers(members.filter((m) => m.id !== id));
    }
  };

  const inputClass = "w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500";

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <p className="text-gray-500 text-sm">{members.length}名のメンバー</p>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors flex items-center gap-1.5"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          メンバー追加
        </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left text-xs font-medium text-gray-500 px-5 py-3">名前</th>
              <th className="text-left text-xs font-medium text-gray-500 px-5 py-3">メールアドレス</th>
              <th className="text-left text-xs font-medium text-gray-500 px-5 py-3">ロール</th>
              <th className="text-left text-xs font-medium text-gray-500 px-5 py-3">担当タスク数</th>
              <th className="text-right text-xs font-medium text-gray-500 px-5 py-3">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {members.map((member) => (
              <tr key={member.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <Avatar name={member.name} />
                    <span className="text-sm font-medium text-gray-800">{member.name}</span>
                    {member.id === currentUserId && (
                      <span className="text-xs bg-indigo-100 text-indigo-600 px-1.5 py-0.5 rounded">自分</span>
                    )}
                  </div>
                </td>
                <td className="px-5 py-4 text-sm text-gray-600">{member.email}</td>
                <td className="px-5 py-4">
                  {member.id !== currentUserId ? (
                    <select
                      value={member.role}
                      onChange={(e) => handleRoleChange(member.id, e.target.value)}
                      className="text-xs border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="ADMIN">管理者</option>
                      <option value="MEMBER">メンバー</option>
                    </select>
                  ) : (
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${member.role === "ADMIN" ? "bg-indigo-100 text-indigo-700" : "bg-gray-100 text-gray-600"}`}>
                      {ROLE_LABELS[member.role]}
                    </span>
                  )}
                </td>
                <td className="px-5 py-4 text-sm text-gray-600">
                  {member._count?.assignedTasks ?? 0}件
                </td>
                <td className="px-5 py-4 text-right">
                  {member.id !== currentUserId && (
                    <button
                      onClick={() => handleDelete(member.id, member.name)}
                      className="text-xs text-red-500 hover:text-red-700 transition-colors"
                    >
                      削除
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="新規メンバー追加">
        <form onSubmit={handleAdd} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">名前 <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className={inputClass}
              placeholder="山田 太郎"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">メールアドレス <span className="text-red-500">*</span></label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className={inputClass}
              placeholder="yamada@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">初期パスワード <span className="text-red-500">*</span></label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className={inputClass}
              placeholder="8文字以上推奨"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ロール</label>
            <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className={inputClass}>
              <option value="MEMBER">メンバー</option>
              <option value="ADMIN">管理者</option>
            </select>
          </div>
          {formError && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-3">
              {formError}
            </div>
          )}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50"
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
            >
              {saving ? "追加中..." : "追加する"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
