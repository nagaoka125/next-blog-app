import { prisma } from "@/lib/prisma";
import { NextResponse, NextRequest } from "next/server";
import { Post } from "@/generated/prisma/client";

type RouteParams = {
  params: Promise<{
    id: string;
  }>;
};

export const DELETE = async (req: NextRequest, routeParams: RouteParams) => {
  try {
    // idを取得
    const { id } = await routeParams.params;

    // deleteメソッドで記事を削除
    const post: Post = await prisma.post.delete({
      where: { id },
    });

    // 成功時
    return NextResponse.json({ 
      msg: `「${post.title}」を削除しました。` 
    });
  } catch (error) {
    // 失敗時
    console.error(error);
    return NextResponse.json(
      { error: "投稿記事の削除に失敗しました" },
      { status: 500 }
    );
  }
};

export const PUT = async (req: NextRequest, routeParams: RouteParams) => {
  try {
    const { id } = await routeParams.params;
    const { title, content, coverImageURL, categoryIds } = await req.json();

    // categoryIdの検証
    const categoriesCount = await prisma.category.count({
      where: {
        id: { in: categoryIds },
      },
    });

    if (categoriesCount !== categoryIds.length) {
      throw new Error("指定されたカテゴリの一部が存在しません");
    }

    // 中間テーブルから既存の紐付けを一旦クリアする
    await prisma.postCategory.deleteMany({
      where: { postId: id },
    });

    // 投稿記事の更新と新しい紐付けの挿入
    const updatedPost = await prisma.post.update({
      where: { id },
      data: {
        title,
        content,
        coverImageURL,
        // 中間テーブルへの新しい紐付け情報を生成
        categories: {
          create: categoryIds.map((categoryId: string) => ({
            categoryId: categoryId,
          })),
        },
      },
    });

    // 成功時
    return NextResponse.json({
      id: updatedPost.id,
      title: updatedPost.title,
      content: updatedPost.content,
      coverImageURL: updatedPost.coverImageURL,
      createdAt: updatedPost.createdAt,
      updatedAt: updatedPost.updatedAt,
    });
  } catch (error) {
    // 失敗時
    console.error(error);
    return NextResponse.json(
      { error: "投稿記事の変更に失敗しました" },
      { status: 500 }
    );
  }
};