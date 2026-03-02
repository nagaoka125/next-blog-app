import { prisma } from "@/lib/prisma";
import { NextResponse, NextRequest } from "next/server";
import { Category } from "@/generated/prisma/client";
import { supabase } from "@/utils/supabase";

type RequestBody = {
  name: string;
};

export const POST = async (req: NextRequest) => {
  const token = req.headers.get("Authorization")?.replace("Bearer ", "") ?? "";
  const { data, error: authError } = await supabase.auth.getUser(token);
  if (authError || !data.user) {
    return NextResponse.json(
      { error: "認証が失敗しました" },
      { status: 401 },
    );
  }
  
  try {
    const { name }: RequestBody = await req.json();
    const category: Category = await prisma.category.create({
      data: {
        name,
      },
    });
    return NextResponse.json(category);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "カテゴリの作成に失敗しました" },
      { status: 500 },
    );
  }
};