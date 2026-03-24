import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

// 自分のプロフィール取得
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return Response.json({ error: "未認証" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  });

  if (!user) return Response.json({ error: "ユーザーが見つかりません" }, { status: 404 });
  return Response.json(user);
}

// 名前変更 or パスワード変更
export async function PUT(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return Response.json({ error: "未認証" }, { status: 401 });

  const body = await request.json();
  const { name, currentPassword, newPassword } = body;

  const updateData: Record<string, string> = {};

  // ── 名前の変更 ──
  if (name !== undefined) {
    const trimmed = name.trim();
    if (!trimmed) return Response.json({ error: "名前は必須です" }, { status: 400 });
    updateData.name = trimmed;
  }

  // ── パスワードの変更 ──
  if (newPassword !== undefined) {
    if (!currentPassword) {
      return Response.json({ error: "現在のパスワードを入力してください" }, { status: 400 });
    }
    if (newPassword.length < 8) {
      return Response.json({ error: "新しいパスワードは8文字以上にしてください" }, { status: 400 });
    }

    // 現在のパスワードを照合
    const user = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (!user) return Response.json({ error: "ユーザーが見つかりません" }, { status: 404 });

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return Response.json({ error: "現在のパスワードが正しくありません" }, { status: 400 });
    }

    updateData.password = await bcrypt.hash(newPassword, 12);
  }

  if (Object.keys(updateData).length === 0) {
    return Response.json({ error: "変更内容がありません" }, { status: 400 });
  }

  const updated = await prisma.user.update({
    where: { id: session.user.id },
    data: updateData,
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  });

  return Response.json(updated);
}
