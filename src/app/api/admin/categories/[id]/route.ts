import { prisma } from "@/lib/prisma";
import { NextResponse, NextRequest } from "next/server";
import { Category } from "@/generated/prisma/client";
import { supabase } from "@/utils/supabase";

type RouteParams = {
  params: Promise<{
    id: string;
  }>;
};

type RequestBody = {
  name: string;
};

const checkAuth = async (req: NextRequest) => {
  const token = req.headers.get("Authorization")?.replace("Bearer ", "") ?? "";
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) return null;
  return data.user;
};

export const PUT = async (req: NextRequest, routeParams: RouteParams) => {
  const user = await checkAuth(req);
  if (!user) {
    return NextResponse.json(
      { error: "認証に失敗しました" },
      { status: 401 },
    );
  }

  try {
    const { id } = await routeParams.params;
    const { name }: RequestBody = await req.json();
    const category: Category = await prisma.category.update({
      where: { id },
      data: { name },
    });
    return NextResponse.json(category);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "カテゴリの名前変更に失敗しました" },
      { status: 500 },
    );
  }
};

export const DELETE = async (req: NextRequest, routeParams: RouteParams) => {
  const user = await checkAuth(req);
  if (!user) {
    return NextResponse.json(
      { error: "認証に失敗しました" },
      { status: 401 },
    );
  }
  
  try {
    const { id } = await routeParams.params;
    const category: Category = await prisma.category.delete({ where: { id } });
    return NextResponse.json({ msg: `「${category.name}」を削除しました。` });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "カテゴリの削除に失敗しました" },
      { status: 500 },
    );
  }
};