"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation"; // ◀ 注目
import type { Post } from "@/app/_types/Post";
//import dummyPosts from "@/app/_mocks/dummyPosts";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpinner } from "@fortawesome/free-solid-svg-icons";
import Image from "next/image";
import { supabase } from "@/utils/supabase";

import DOMPurify from "isomorphic-dompurify";

interface PostCategoryRow {
  categoryId: string;
}

// 投稿記事の詳細表示 /posts/[id]
const Page: React.FC = () => {
  const [post, setPost] = useState<Post | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);


  // 動的ルートパラメータから 記事id を取得 （URL:/posts/[id]）
  const { id } = useParams() as { id: string };

  // コンポーネントが読み込まれたときに「1回だけ」実行する処理
  useEffect(() => {
    const fetchPost = async () => {
      try {
        setIsLoading(true);

        // 単一の投稿を取得
        const { data: postData, error: postError } = await supabase
          .from("Post")
          .select("id, title, content, createdAt, coverImageURL")
          .eq("id", id)
          .single();
        if (postError) throw postError;

        // 関連カテゴリを中間テーブルから取得
        const { data: pcData, error: pcError, status: pcStatus } = await supabase
          .from("PostCategory")
          .select("categoryId")
          .eq("postId", id);
        console.log("PostCategory fetch (ids)", { pcStatus, pcData, pcError });
        if (pcError) throw pcError;

        const categoryIds: string[] = (pcData || []).map((r: PostCategoryRow) => r.categoryId);
        let categories: { id: string; name: string }[] = [];
        if (categoryIds.length > 0) {
          const { data: catData, error: catError, status: catStatus } = await supabase
            .from("Category")
            .select("id, name")
            .in("id", categoryIds);
          console.log("Category fetch", { catStatus, catData, catError });
          if (catError) throw catError;
          categories = (catData || []) as { id: string; name: string }[];
        }
        const mapped: Post = {
          id: postData.id,
          title: postData.title,
          content: postData.content || "",
          createdAt: postData.createdAt,
          coverImage: { url: postData.coverImageURL || "", width: 1365, height: 768 },
          categories,
        };

        setPost(mapped);
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      } finally {
        setIsLoading(false);
      }
    };

    if (!id) return;
    fetchPost();
  }, [id]);

  // 投稿データの取得中は「Loading...」を表示
  if (isLoading) {
    return (
      <div className="text-gray-500">
        <FontAwesomeIcon icon={faSpinner} className="mr-1 animate-spin" />
        Loading...
      </div>
    );
  }

  // 投稿データが取得できなかったらエラーメッセージを表示
  if (!post) {
    return <div>指定idの投稿の取得に失敗しました。</div>;
  }

  // HTMLコンテンツのサニタイズ
  const safeHTML = DOMPurify.sanitize(post.content, {
    ALLOWED_TAGS: ["b", "strong", "i", "em", "u", "br"],
  });

  return (
    <main>
      <div className="space-y-2">
        <div className="mb-2 text-2xl font-bold">{post.title}</div>
          <div>
            <Image
              src={post.coverImage.url}
              alt="Cover Image"
              width={post.coverImage.width}
              height={post.coverImage.height}
              priority
              className="rounded-xl"
            />
          </div>
        <div dangerouslySetInnerHTML={{ __html: safeHTML }} />
        <div className="text-sm text-slate-500">
          作成日: {new Date(post.createdAt).toLocaleDateString()}
        </div>
        <div>
          カテゴリ: {post.categories.length === 0 ? ("なし") : (
            post.categories.map((c) => c.name).join(", ")
          )}
        </div>
      </div>
    </main>
  );
};

export default Page;
