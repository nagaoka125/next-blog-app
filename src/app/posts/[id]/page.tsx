"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation"; // ◀ 注目
import type { Post } from "@/app/_types/Post";
import type { Comment } from "@/app/_types/Comment";

//import dummyPosts from "@/app/_mocks/dummyPosts";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpinner } from "@fortawesome/free-solid-svg-icons";
import Image from "next/image";
import { supabase } from "@/utils/supabase";
import Link from "next/link";
import { twMerge } from "tailwind-merge";
import { faChevronLeft } from "@fortawesome/free-solid-svg-icons";

import DOMPurify from "isomorphic-dompurify";

interface PostCategoryRow {
  categoryId: string;
}

interface AdminRow {
  userId: string;
}

// 投稿記事の詳細表示 /posts/[id]
const Page: React.FC = () => {
  const [post, setPost] = useState<Post | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [coverImageURL, setCoverImageURL] = useState<string | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentsVisible, setCommentsVisible] = useState(true);
  const [openCommentId, setOpenCommentId] = useState<string | null>(null);
  const [selectCommentMode, setSelectCommentMode] = useState(false);
  const [globalCommentText, setGlobalCommentText] = useState("");
  const [globalComments, setGlobalComments] = useState<Comment[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);


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
          .select("id, title, content, createdAt, coverImageKey")
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
          coverImage: { key: postData.coverImageKey || "", width: 1365, height: 768 },
          categories,
        };

        setPost(mapped);

        if (mapped.coverImage.key) {
          const { data } = supabase.storage.from("cover-image").getPublicUrl(mapped.coverImage.key);
          setCoverImageURL(data.publicUrl);
        }

        // コメント取得（inlineとglobalを分離）
        const { data: commentData, error: commentError } = await supabase
          .from("Comment")
          .select("id, postId, position, text, type, userId, isAdmin, createdAt")
          .eq("postId", id);
        if (commentError) throw commentError;
        const allComments = (commentData || []) as Comment[];
        
        // 重複排除
        const deduped: Comment[] = [];
        allComments.forEach((c) => {
          if (!deduped.find((d) => d.id === c.id)) deduped.push(c);
        });
        
        // inline と global に分離
        const inlineComments = deduped.filter((c) => c.type === "inline");
        const globalComms = deduped.filter((c) => c.type === "global");
        setComments(inlineComments);
        setGlobalComments(globalComms);
        // 管理者かどうかをチェック（ここは簡易版：tokeンが存在＝管理者）
        const { data: { user } } = await supabase.auth.getUser();
        setIsAdmin(!!user);
      } catch (authError) {
        setIsAdmin(false);
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
    <main className="relative">
      <div className="space-y-2">
        <div className="flex flex-col gap-4 mb-6">
          <h1 className="text-3xl font-bold">{post.title}</h1>
          {coverImageURL && (
            <div>
              <Image
                src={coverImageURL}
                alt="Cover Image"
                width={post.coverImage.width}
                height={post.coverImage.height}
                priority
                className="rounded-xl object-cover"
              />
            </div>
          )}
        </div>
        
        {/* 本文を単語に分割し、コメントアンカーを挿入 */}
        <div className="prose whitespace-pre-wrap">
          {(() => {
            // 改行を保持しながらHTMLタグを除去、その後に \n を <br> に変換
            const contentWithBr = post.content
              .replace(/<br\s*\/?>/g, "\n")  // 既存の <br> タグを \n に統一
              .replace(/<[^>]+>/g, "");       // 残りのタグを削除
            // \n で分割して行ごとにレンダリング
            const lines = contentWithBr.split("\n");
            const segments = lines
              .flatMap((line, lineIdx) => {
                const words = line.split(/(\s+)/);
                return lineIdx < lines.length - 1 
                  ? [...words, "\n"]  // 最後の行以外は改行を含める
                  : words;
              });
            let wordIndex = 0;
            return segments.map((seg, idx) => {
              const isSpace = /^\s+$/.test(seg);
              const currentIndex = wordIndex;
              if (!isSpace) wordIndex++;
              const commentsAtPos = comments.filter((c) => c.position === currentIndex);
              const hasComments = commentsAtPos.length > 0;
              // 改行文字の場合は <br> をレンダリング
              if (seg === "\n") {
                return <br key={idx} />;
              }
              return (
                <span
                  key={idx}
                  className="relative group"
                  onClick={async () => {
                    // selectCommentMode が有効でない場合は既存コメントの表示/非表示切り替えのみ
                    if (!selectCommentMode) {
                      if (hasComments) {
                        const posKey = `pos:${currentIndex}`;
                        setOpenCommentId(posKey === openCommentId ? null : posKey);
                      }
                      return;
                    }
                    // コメント位置選択モードが有効な場合は新規コメントの追加
                    const text = prompt("コメントを入力してください");
                    if (!text) return;
                    let userId: string | null = null;
                    try {
                      const { data: { user } } = await supabase.auth.getUser();
                      userId = user?.id || null;
                    } catch {
                      userId = null;
                    }
                    const { data: inserted, error: insertedError } = await supabase
                      .from("Comment")
                      .insert([
                        {
                          postId: post.id,
                          position: currentIndex,
                          text,
                          type: "inline",
                          userId,
                          isAdmin,
                        },
                      ])
                      .select("id, postId, position, text, type, userId, isAdmin, createdAt")
                      .single();
                    if (insertedError) {
                      alert("コメントの保存に失敗しました");
                      return;
                    }
                    const newComment = inserted as Comment;
                    setComments((prev) => {
                      if (prev.find((c) => c.id === newComment.id)) return prev;
                      return [...prev, newComment];
                    });
                    setOpenCommentId(`pos:${currentIndex}`);
                  }}
                >
                  {seg}
                  {commentsVisible && !hasComments && !isSpace && selectCommentMode && (
                    <span className="absolute -right-4 top-0 invisible group-hover:visible text-blue-400 cursor-pointer">
                      +
                    </span>
                  )}
                  {commentsVisible && hasComments && (
                    <>
                      <span className="absolute -right-4 top-0 text-red-500 cursor-pointer">
                        💬
                      </span>
                      {openCommentId === `pos:${currentIndex}` && (
                            <div className="absolute z-10 rounded p-3 w-52 right-4 mt-4 shadow-lg bg-white border border-gray-200 overflow-hidden">
                              {commentsAtPos.map((c) => (
                                <div key={c.id} className={twMerge("p-3 border-b last:border-b-0", c.isAdmin ? "bg-blue-50" : "bg-white")}>
                                  {c.isAdmin && (
                                    <div className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded mb-1 inline-block">
                                      管理者
                                    </div>
                                  )}
                                  <p className="text-sm">{c.text}</p>
                                  <div className="text-xs text-grey-500">
                                    {new Date(c.createdAt).toLocaleString()}
                                  </div>
                                </div>
                              ))}
                        </div>
                      )}
                    </>
                  )}
                </span>
              );
            });
          })()}
        </div>
        <div className="text-sm text-slate-500">
          作成日: {new Date(post.createdAt).toLocaleDateString()}
        </div>
        <div>
          カテゴリ: {post.categories.length === 0 ? ("なし") : (
            post.categories.map((c) => c.name).join(", ")
          )}
        </div>
        {/* 右下に固定されたコメントボタンパネル */}
        <div className="fixed bottom-8 right-8 z-40 flex flex-col gap-2">
          <button
            className={`px-4 py-2 rounded-lg font-bold text-white transition ${
              selectCommentMode ? "bg-red-500 hover:bg-red-600" : "bg-blue-500 hover:bg-blue-600"
            }`}
            onClick={() => setSelectCommentMode((v) => !v)}
          >
            {selectCommentMode ? "キャンセル" : "コメント位置選択"}
          </button>
          <button
            className={`px-4 py-2 rounded-lg font-bold text-white transition ${
              commentsVisible ? "bg-gray-500 hover:bg-gray-600" : "bg-green-500 hover:bg-green-600"
            }`}
            onClick={() => setCommentsVisible((v) => !v)}
          >
            {commentsVisible ? "コメント非表示" : "コメント表示"}
          </button>
        </div>

        {/* グローバルコメント欄 */}
        <div className="mt-8 border-t pt-6">
          <div className="mb-4 text-xl font-bold">コメント</div>
          
          {/* グローバルコメント入力 */}
          <div className="mb-6 space-y-2">
            <textarea
              className="w-full border rounded p-2 text-sm"
              placeholder="投稿全体へのコメントを入力..."
              value={globalCommentText}
              onChange={(e) => setGlobalCommentText(e.target.value)}
              rows={3}
            />
            <button
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
              onClick={async () => {
                if (!globalCommentText.trim()) return;
                const { data: { user } } = await supabase.auth.getUser();
                const { data, error } = await supabase
                  .from("Comment")
                  .insert([
                    {
                      postId: post.id,
                      text: globalCommentText,
                      type: "global",
                      userId: user?.id || null,
                      isAdmin,
                    },
                  ])
                  .select("id, postId, position, text, type, userId, createdAt")
                  .single();
                if (error) {
                  alert("コメント保存に失敗しました");
                } else if (data) {
                  setGlobalComments((prev) => [...prev, data as Comment]);
                  setGlobalCommentText("");
                }
              }}
            >
              送信
            </button>
          </div>

          {/* グローバルコメント表示 */}
          <div className="space-y-3">
            {globalComments.map((comment) => (
              <div
                key={comment.id}
                className={`p-3 rounded border-l-4 ${
                  comment.isAdmin
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-300 bg-gray-50"
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  {comment.isAdmin && (
                    <span className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded">
                      管理者
                    </span>
                  )}
                  <span className="text-xs text-gray-500">
                    {new Date(comment.createdAt).toLocaleString()}
                  </span>
                </div>
                <p className="text-sm">{comment.text}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="pt-8 text-center">
          <Link
            href="/"
            className={twMerge(
              "inline-flex items-center justify-center gap-2",
              "rounded-full bg-slate-100 px-6 py-2 font-bold text-slate-600",
              "transition-colors hover:bg-slate-200"
            )}
          >
            <FontAwesomeIcon icon={faChevronLeft} className="text-xs" />
            投稿一覧に戻る
          </Link>
        </div>
      </div>
    </main>
  );
};

export default Page;
