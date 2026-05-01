import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import SessionProvider from "@/components/providers/SessionProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export function generateMetadata(): Metadata {
  const appName = process.env.NEXT_PUBLIC_APP_NAME ?? "UNPIS";
  return {
    title: appName,
    description: "チームのタスクを一元管理するアプリ",
    icons: {
      icon: "/unpis-logo.png",
      shortcut: "/unpis-logo.png",
      apple: "/unpis-logo.png",
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className={`${geistSans.variable} h-full antialiased`}>
      <body className="min-h-full bg-gray-50">
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
