import { prisma } from "@/lib/prisma";
import { NextResponse, NextRequest } from "next/server";
import type { Post } from "@/generated/prisma/client";
import { supabase } from "@/utils/supabase";

type RouteParams = {
    params: Promise<{
        id: string;
    }>;
};

type RequestBody = {
    title: string;
    content: string;
    coverImageKey: string;
    categoryIds: string[];
};

const authenticate = async (req: NextRequest) => {
    const token = req.headers.get("Authorization")?.replace("Bearer ", "") ?? "";
    return await supabase.auth.getUser(token);
}

export const DELETE = async (req: NextRequest, params: RouteParams) => {
    const { data, error: authError } = await authenticate(req);
    if (authError || !data.user) {
        return NextResponse.json(
            { error: "認証に失敗しました" },
            { status: 401 }
        );
    }

    try {
        // idを取得
        const { id } = await params.params;

        // deleteメソッドで記事を削除
        const post: Post = await prisma.post.delete({
            where: { id },
        });

        // 成功時
        return NextResponse.json({ msg: `「${post.title}」を削除しました。` });
    } catch (error) {
        // 失敗時
        console.error(error);
        return NextResponse.json(
            { error: "投稿記事の削除に失敗しました" },
            { status: 500 }
        );
    }
};

export const PUT = async (req: NextRequest, params: RouteParams) => {
    const { data, error: authError } = await authenticate(req);
    if (authError || !data.user) {
        return NextResponse.json(
            { error: "認証に失敗しました" },
            { status: 401 }
        );
    }

    try {
        const { id } = await params.params;
        const request: RequestBody = await req.json();

        const { title, content, coverImageKey, categoryIds } = request;

        // categoryIdの検証
        const categories = await prisma.category.findMany({
            where: {
                id: {
                    in: categoryIds,
                },
            },
        });

        if (categories.length !== categoryIds.length) {
            throw new Error("指定されたカテゴリが存在しません");
        }

        // 中間テーブルをクリアする
        await prisma.postCategory.deleteMany({
            where: { postId: id },
        });

        // 投稿記事の更新
        const updatedPost: Post = await prisma.post.update({
            where: { id },
            data: {
                title,
                content,
                coverImageKey,
            },
        });
        // 中間テーブルに新しく生成
        for (const categoryId of categoryIds) {
            await prisma.postCategory.create({
                data: {
                    postId: updatedPost.id,
                    categoryId: categoryId,
                },
            });
        }
        // 成功時
        return NextResponse.json(updatedPost);

    } catch (error) {
        // 失敗時
        console.error(error);
        return NextResponse.json(
            { error: "投稿記事の変更に失敗しました" },
            { status: 500 }
        );
    }
};