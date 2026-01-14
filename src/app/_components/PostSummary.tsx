"use client";
import type { Post } from "@/app/_types/Post";
import Link from "next/link";

type Props = {
  post: Post;
};

const PostSummary: React.FC<Props> = ({ post }) => {
  // フォールバックで日付をローカライズ表示
  const formattedDate = post.createdAt
    ? new Date(post.createdAt).toLocaleDateString("ja-JP", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      })
    : "";

  // 一番目のカテゴリを表示（なければ空文字）
  const categoryName = post.categories && post.categories.length > 0 ? post.categories[0].name : "";

  // HTML を含む可能性がある本文からタグを除去してプレーンテキストにする
  const excerpt = post.content
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();

  return (
    <div className="border border-slate-400 p-3">
      <Link href={`/posts/${post.id}`} className="block">
        <div className="mb-1 text-lg font-bold">{post.title}</div>
        <div className="text-sm text-slate-600 line-clamp-3">{excerpt}</div>
      </Link>

      <div className="mt-2 flex items-center justify-between text-sm text-slate-500">
        <div>{categoryName}</div>
        <div>{formattedDate}</div>
      </div>
    </div>
  );
};

export default PostSummary;