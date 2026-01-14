"use client";
import { useState, useEffect } from "react";
import type { Post } from "@/app/_types/Post";
import PostSummary from "@/app/_components/PostSummary";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpinner } from "@fortawesome/free-solid-svg-icons";
import { supabase } from "@/utils/supabase";

const Page: React.FC = () => {
  const [posts, setPosts] = useState<Post[] | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Supabase から取得するため microCMS の環境変数は不要

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        // Supabase のテーブル名はダッシュボードで大文字 'Post' になっているため合わせる
        console.log("Supabase URL:", process.env.NEXT_PUBLIC_SUPABASE_URL);
        const { data, error } = await supabase
          .from("Post")
          .select("id, title, content, createdAt, coverImageURL")
          .order("createdAt", { ascending: false });
        console.log("Supabase response:", { data, error });
        if (error) throw error;

        // Supabase のスキーマとフロントの Post 型に差分があるため整形する
        const mapped = (data || []).map((row: { id: string; title: string; content: string | null; createdAt: string; coverImageURL: string | null }) => ({
          id: row.id,
          title: row.title,
          content: row.content || "",
          createdAt: row.createdAt,
          // 既存の型は coverImage オブジェクトを期待するため最低限の shape を生成
          coverImage: {
            url: row.coverImageURL || "",
            width: 1365,
            height: 768,
          },
          // カテゴリは別テーブルで管理されているため空配列でフォールバック
          categories: [],
        })) as Post[];

        setPosts(mapped);
      } catch (e) {
        setFetchError(
          e instanceof Error ? e.message : "予期せぬエラーが発生しました"
        );
      }
    };
    fetchPosts();
  }, []);

  if (fetchError) {
    return <div>{fetchError}</div>;
  }

  if (!posts) {
    return (
      <div className="text-gray-500">
        <FontAwesomeIcon icon={faSpinner} className="mr-1 animate-spin" />
        Loading...
      </div>
    );
  }

  return (
    <main>
      <div className="mb-2 text-2xl font-bold">Main</div>
      <div className="space-y-3">
        {posts.map((post) => (
          <PostSummary key={post.id} post={post} />
        ))}
      </div>
    </main>
  );
};

export default Page;