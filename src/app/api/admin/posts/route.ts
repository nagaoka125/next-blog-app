import { prisma } from "@/lib/prisma";
import { NextResponse, NextRequest } from "next/server";
import type { Post } from "@/generated/prisma/client";

type RequestBody = {
  title: string;
  content: string;
  coverImageURL: string;
  categoryIds: string[];
};

export const POST = async (req: NextRequest) => {
  try {
    const request: RequestBody = await req.json();
    const { title, content, coverImageURL, categoryIds } = request;

    // categoryIds が存在すれば検証
    if (categoryIds && categoryIds.length > 0) {
      const categories = await prisma.category.findMany({
        where: { id: { in: categoryIds } },
      });
      if (categories.length !== categoryIds.length) {
        return NextResponse.json({ error: "指定されたカテゴリが存在しません" }, { status: 400 });
      }
    }

    // 投稿を作成
    const created: Post = await prisma.post.create({
      data: {
        title,
        content,
        coverImageURL,
      },
    });

    // 中間テーブルにカテゴリを設定
    if (categoryIds && categoryIds.length > 0) {
      for (const categoryId of categoryIds) {
        await prisma.postCategory.create({
          data: { postId: created.id, categoryId },
        });
      }
    }

    return NextResponse.json(created);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "投稿の作成に失敗しました" }, { status: 500 });
  }
};
