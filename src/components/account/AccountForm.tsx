"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import type { UserRole } from "@/types";

interface AccountFormProps {
  initialName: string;
  email: string;
  role: UserRole;
  createdAt: string;
}

// 入力欄の共通スタイル
const inputClass =
  "w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition";
const labelClass = "block text-sm font-medium text-gray-700 mb-1";

// フィードバック表示コンポーネント
function Alert({ type, message }: { type: "success" | "error"; message: string }) {
  return (
    <div className={`flex items-center gap-2 px-4 py-3 rounded-lg text-sm ${
      type === "success"
        ? "bg-emerald-50 border border-emerald-200 text-emerald-700"
        : "bg-red-50 border border-red-200 text-red-600"
    }`}>
      {type === "success" ? (
        <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      ) : (
        <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M12 3a9 9 0 100 18A9 9 0 0012 3z" />
        </svg>
      )}
      {message}
    </div>
  );
}

export default function AccountForm({ initialName, email, role, createdAt }: AccountFormProps) {
  const { update: updateSession } = useSession();

  // ── プロフィール編集 ──
  const [name, setName] = useState(initialName);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // ── パスワード変更 ──
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // 名前の保存
  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileLoading(true);
    setProfileMsg(null);

    const res = await fetch("/api/account", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });

    const data = await res.json();
    if (res.ok) {
      await updateSession({ name: data.name }); // セッションにも反映
      setProfileMsg({ type: "success", text: "プロフィールを更新しました" });
    } else {
      setProfileMsg({ type: "error", text: data.error ?? "更新に失敗しました" });
    }
    setProfileLoading(false);
  };

  // パスワード変更
  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMsg(null);

    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: "error", text: "新しいパスワードが一致しません" });
      return;
    }
    if (newPassword.length < 8) {
      setPasswordMsg({ type: "error", text: "パスワードは8文字以上にしてください" });
      return;
    }

    setPasswordLoading(true);
    const res = await fetch("/api/account", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword, newPassword }),
    });

    const data = await res.json();
    if (res.ok) {
      setPasswordMsg({ type: "success", text: "パスワードを変更しました" });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } else {
      setPasswordMsg({ type: "error", text: data.error ?? "変更に失敗しました" });
    }
    setPasswordLoading(false);
  };

  // パスワード強度インジケーター
  const passwordStrength = (() => {
    if (!newPassword) return null;
    if (newPassword.length < 8) return { level: 1, label: "弱い", color: "bg-red-400" };
    if (newPassword.length < 12 || !/[A-Z]/.test(newPassword) || !/[0-9]/.test(newPassword))
      return { level: 2, label: "普通", color: "bg-amber-400" };
    return { level: 3, label: "強い", color: "bg-emerald-500" };
  })();

  // パスワード表示トグルボタン
  const EyeButton = ({ show, onToggle }: { show: boolean; onToggle: () => void }) => (
    <button
      type="button"
      onClick={onToggle}
      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
    >
      {show ? (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
        </svg>
      ) : (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
      )}
    </button>
  );

  return (
    <div className="space-y-6">

      {/* ===== アカウント情報カード ===== */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
          <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <h2 className="font-semibold text-gray-700 text-sm">アカウント情報</h2>
        </div>
        <div className="px-6 py-5">
          {/* 基本情報（読み取り専用） */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5 p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="text-xs text-gray-400 mb-1">メールアドレス</p>
              <p className="text-sm font-medium text-gray-700 break-all">{email}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1">ロール</p>
              <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium ${
                role === "ADMIN"
                  ? "bg-amber-100 text-amber-700"
                  : "bg-emerald-100 text-emerald-700"
              }`}>
                {role === "ADMIN" ? (
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                ) : (
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                )}
                {role === "ADMIN" ? "管理者" : "メンバー"}
              </span>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1">登録日</p>
              <p className="text-sm text-gray-700">
                {new Date(createdAt).toLocaleDateString("ja-JP", { year: "numeric", month: "long", day: "numeric" })}
              </p>
            </div>
          </div>

          {/* 名前変更フォーム */}
          <form onSubmit={handleProfileSave} className="space-y-4">
            <div>
              <label className={labelClass}>表示名</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={inputClass}
                placeholder="表示名を入力"
              />
            </div>
            {profileMsg && <Alert type={profileMsg.type} message={profileMsg.text} />}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={profileLoading || name.trim() === initialName}
                className="px-5 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                {profileLoading ? "保存中…" : "変更を保存"}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* ===== パスワード変更カード ===== */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
          <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <h2 className="font-semibold text-gray-700 text-sm">パスワード変更</h2>
        </div>
        <div className="px-6 py-5">
          <form onSubmit={handlePasswordChange} className="space-y-4">
            {/* 現在のパスワード */}
            <div>
              <label className={labelClass}>現在のパスワード</label>
              <div className="relative">
                <input
                  type={showCurrent ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className={inputClass + " pr-10"}
                  placeholder="現在のパスワード"
                />
                <EyeButton show={showCurrent} onToggle={() => setShowCurrent((v) => !v)} />
              </div>
            </div>

            {/* 新しいパスワード */}
            <div>
              <label className={labelClass}>新しいパスワード</label>
              <div className="relative">
                <input
                  type={showNew ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className={inputClass + " pr-10"}
                  placeholder="8文字以上"
                />
                <EyeButton show={showNew} onToggle={() => setShowNew((v) => !v)} />
              </div>
              {/* 強度インジケーター */}
              {passwordStrength && (
                <div className="mt-2 space-y-1">
                  <div className="flex gap-1">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className={`h-1.5 flex-1 rounded-full transition-colors ${
                          i <= passwordStrength.level ? passwordStrength.color : "bg-gray-200"
                        }`}
                      />
                    ))}
                  </div>
                  <p className={`text-xs font-medium ${
                    passwordStrength.level === 1 ? "text-red-500"
                    : passwordStrength.level === 2 ? "text-amber-500"
                    : "text-emerald-600"
                  }`}>
                    強度：{passwordStrength.label}
                  </p>
                </div>
              )}
            </div>

            {/* 確認用パスワード */}
            <div>
              <label className={labelClass}>新しいパスワード（確認）</label>
              <div className="relative">
                <input
                  type={showConfirm ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`${inputClass} pr-10 ${
                    confirmPassword && newPassword !== confirmPassword
                      ? "border-red-300 focus:ring-red-400"
                      : confirmPassword && newPassword === confirmPassword
                      ? "border-emerald-400 focus:ring-emerald-400"
                      : ""
                  }`}
                  placeholder="もう一度入力"
                />
                <EyeButton show={showConfirm} onToggle={() => setShowConfirm((v) => !v)} />
              </div>
              {confirmPassword && newPassword !== confirmPassword && (
                <p className="text-xs text-red-500 mt-1">パスワードが一致しません</p>
              )}
              {confirmPassword && newPassword === confirmPassword && (
                <p className="text-xs text-emerald-600 mt-1">✓ 一致しています</p>
              )}
            </div>

            {passwordMsg && <Alert type={passwordMsg.type} message={passwordMsg.text} />}

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={passwordLoading || !currentPassword || !newPassword || !confirmPassword}
                className="px-5 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                {passwordLoading ? "変更中…" : "パスワードを変更"}
              </button>
            </div>
          </form>
        </div>
      </div>

    </div>
  );
}
