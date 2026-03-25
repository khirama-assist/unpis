"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { useState } from "react";

const navItems = [
  {
    href: "/dashboard",
    label: "ダッシュボード",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
    adminOnly: false,
  },
  {
    href: "/tasks",
    label: "タスク一覧",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
      </svg>
    ),
    adminOnly: false,
  },
  {
    href: "/calendar",
    label: "カレンダー",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
    adminOnly: false,
  },
  {
    href: "/my-tasks",
    label: "自分のタスク",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
    adminOnly: false,
  },
  {
    href: "/schedule",
    label: "スケジュール",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18M3 6h18M3 18h18" />
      </svg>
    ),
    adminOnly: false,
  },
  {
    href: "/members",
    label: "メンバー管理",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
    adminOnly: true,
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "ADMIN";
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* ハンバーガーボタン（モバイルのみ表示） */}
      <button
        className="fixed top-3 left-3 z-40 md:hidden bg-emerald-900 text-white p-2 rounded-lg shadow-lg"
        onClick={() => setMobileOpen(true)}
        aria-label="メニューを開く"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* オーバーレイ（モバイルのみ） */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* サイドバー本体 */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-emerald-900 flex flex-col shadow-xl transition-transform duration-300
        md:relative md:translate-x-0 md:flex md:z-auto md:inset-auto md:h-screen md:shrink-0
        ${mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
      `}>
        {/* 閉じるボタン（モバイルのみ） */}
        <button
          className="absolute top-3 right-3 md:hidden text-emerald-400 hover:text-white p-1"
          onClick={() => setMobileOpen(false)}
          aria-label="メニューを閉じる"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* ロゴエリア */}
        <div className="px-5 py-4 border-b border-emerald-800/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl overflow-hidden bg-white shadow-md shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/unpis-logo.png" alt="UNPIS" className="w-full h-full object-contain" />
            </div>
            <div>
              <span className="font-bold text-white text-lg leading-tight block tracking-wide">UNPIS</span>
              <span className="text-emerald-400 text-xs">Team Board</span>
            </div>
          </div>
        </div>

        {/* ナビゲーション */}
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          <p className="text-emerald-500 text-[10px] font-semibold uppercase tracking-widest px-3 mb-2">Menu</p>
          {navItems
            .filter((item) => !item.adminOnly || isAdmin)
            .map((item) => {
              const isActive =
                pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                    isActive
                      ? "bg-emerald-400/20 text-white border border-emerald-400/30"
                      : "text-emerald-300 hover:bg-emerald-800/60 hover:text-white"
                  }`}
                >
                  <span
                    className={`shrink-0 ${
                      isActive ? "text-emerald-400" : "text-emerald-500"
                    }`}
                  >
                    {item.icon}
                  </span>
                  {item.label}
                  {isActive && (
                    <span className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  )}
                </Link>
              );
            })}
        </nav>

        {/* ユーザー情報 → アカウント設定リンク */}
        <div className="px-3 py-4 border-t border-emerald-800/60">
          <Link
            href="/account"
            onClick={() => setMobileOpen(false)}
            className={`group flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 ${
              pathname === "/account"
                ? "bg-emerald-400/20 border border-emerald-400/30"
                : "bg-emerald-800/40 hover:bg-emerald-700/60"
            }`}
          >
            <div className="w-8 h-8 bg-emerald-400 rounded-full flex items-center justify-center text-sm font-bold text-emerald-900 shrink-0">
              {session?.user?.name?.charAt(0) ?? "?"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {session?.user?.name}
              </p>
              <p className="text-xs text-emerald-400">
                {isAdmin ? "管理者" : "メンバー"}
              </p>
            </div>
            {/* 設定アイコン */}
            <svg
              className="w-4 h-4 text-emerald-500 group-hover:text-emerald-300 transition-colors shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </Link>
        </div>
      </aside>
    </>
  );
}
