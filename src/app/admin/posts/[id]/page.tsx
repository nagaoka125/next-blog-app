"use client";
import { use, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/app/_hooks/useAuth";
import { supabase } from "@/utils/supabase";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpinner } from "@fortawesome/free-solid-svg-icons";
import { twMerge } from "tailwind-merge";
import { faChevronLeft } from "@fortawesome/free-solid-svg-icons";
import Link from "next/link";
import type { Post } from "@/app/_types/Post";
import CryptoJS from "crypto-js";

type CategoryApiResponse = {
    id: string;
    name: string;
    createdAt: string;
    updatedAt: string;
};

type SelectCategory = {
    id: string;
    name: string;
    isSelect: boolean;
};

type Comment = {
    id: string;
    text: string;
    createdAt: string;
    isAdmin?: boolean;
}

const AdminEditPostPage: React.FC = () => {
    const { id } = useParams() as { id: string };
    const router = useRouter();
    const { token, isLoading: isAuthLoading } = useAuth();
    const [post, setPost] = useState<Post | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [coverImageKey, setCoverImageKey] = useState("");
    const bucketName = "cover-image";
    // カテゴリ配列 (State)。取得中と取得失敗時は null、既存カテゴリが0個なら []
    const [checkableCategories, setCheckableCategories] = useState<SelectCategory[] | null>(null);

    const [comments, setComments] = useState<Comment[]>([]);
    const [selectCommentIds, setSelectCommentIds] = useState<string[]>([]); // 編集対象のコメントID配列

    // ファイルのMD5ハッシュ値を計算する関数
    const calculateMD5Hash = async (file: File): Promise<string> => {
        const buffer = await file.arrayBuffer();
        const wordArray = CryptoJS.lib.WordArray.create(buffer);
        return CryptoJS.MD5(wordArray).toString();
    };

    useEffect(() => {
        if (!isAuthLoading && !token) {
            window.alert("ログインが必要です");
            router.push("/login");
        }
    }, [token, isAuthLoading, router]);

    useEffect(() => {
        const fetchPost = async () => {
            try {
                setIsLoading(true);
                const { data, error } = await supabase.from("Post").select("*").eq("id", id).single();
                if (error) throw error;
                const row = data as { id: string; title: string; content?: string; createdAt: string; coverImageKey?: string };
                const mapped: Post = {
                    id: row.id,
                    title: row.title,
                    content: row.content || "",
                    createdAt: row.createdAt,
                    coverImage: { key: row.coverImageKey || "", width: 1365, height: 768 },
                    categories: [],
                };
                setPost(mapped);
                setTitle(mapped.title);
                setContent(mapped.content);
                setCoverImageKey(mapped.coverImage.key);
                const { data: commentData, error: commentError } = await supabase
                    .from("Comment")
                    .select("*")
                    .eq("postId", id)
                    .order("createdAt", { ascending: true });
                if (!commentError) {
                    setComments(commentData);
                }
            } catch (e) {
                setError(e instanceof Error ? e.message : String(e));
            } finally {
                setIsLoading(false);
            }
        };
        fetchPost();

        const fetchCategories = async () => {
            try {
                setIsLoading(true);
                const requestUrl = "/api/categories";
                const res = await fetch(requestUrl, {
                method: "GET",
                cache: "no-store",
                });

                // カテゴリのフェッチに失敗した場合
                if (!res.ok) {
                    setCheckableCategories(null);
                    throw new Error(`${res.status}: ${res.statusText}`); // -> catch節に移動
                }

                // レスポンスのボディをJSONとして読み取りカテゴリ配列 (State) にセット
                const apiResBody = (await res.json()) as CategoryApiResponse[];
                setCheckableCategories(
                    apiResBody.map((body) => ({
                        id: body.id,
                        name: body.name,
                        isSelect: false,
                    }))
                );
            } catch (error) {
                const errorMsg =
                    error instanceof Error
                        ? `カテゴリの一覧のフェッチに失敗しました: ${error.message}`
                        : `予期せぬエラーが発生しました ${error}`;
                console.error(errorMsg);
                setError(errorMsg);
            } finally {
                // 成功した場合も失敗した場合もローディング状態を解除
                setIsLoading(false);
            }
        };
        fetchCategories();
    }, [id]);

    // チェックボックスの状態を更新する関数
    const switchCategoryState = (categoryId: string) => {
        if (!checkableCategories) return;
        setCheckableCategories(
            checkableCategories.map((category) =>
                category.id === categoryId
                ? { ...category, isSelect: !category.isSelect }
                : category
            )
        );
    };
    
    // 投稿保存処理
    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!token) return;
        setIsSubmitting(true);
        try {
            if (selectCommentIds.length > 0) {
                const { error: deleteError } = await supabase
                    .from("Comment")
                    .delete()
                    .in("id", selectCommentIds);
                if (deleteError) throw new Error("コメントの削除に失敗しました");
            }

            const requestBody = {
                title,
                content,
                coverImageKey,
                categoryIds: checkableCategories
                    ? checkableCategories.filter((c) => c.isSelect).map((c) => c.id)
                    : [],
            };

            const res = await fetch(`/api/admin/posts/${id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: token, // トークンを付与
                },
                body: JSON.stringify(requestBody),
            });

            if (!res.ok) throw new Error("更新に失敗しました");

            router.push("/admin/posts");
            router.refresh(); // キャッシュを更新
        } catch (e) {
            setError(e instanceof Error ? e.message : String(e));
        } finally {
            setIsSubmitting(false);
        }
    };

    const toggleSelectComment = (commentId: string) => {
        setSelectCommentIds((prev) =>
            prev.includes(commentId
            ) ? prev.filter((id) => id !== commentId) // すでに選択されている場合は除外
                : [...prev, commentId] // 選択されていない場合は追加
        );
    };

    const handleDelete = async () => {
        if (!window.confirm("本当にこの投稿を削除しますか？") || !token) {
            return;
        }
        setIsSubmitting(true);
        // DELETEリクエストを送信
        try {
            const requestUrl = `/api/admin/posts/${id}`;
            const res = await fetch(requestUrl, {
                method: "DELETE",
                headers: { Authorization: token }, // トークンを付与
                cache: "no-store",
            });

            if (!res.ok) {
                throw new Error(`${res.status}: ${res.statusText}`); // -> catch節に移動
            }
            router.push("/admin/posts"); // 投稿一覧ページにリダイレクト
            router.refresh(); // キャッシュを更新
        } catch (error) {
            const errorMsg =
                error instanceof Error
                    ? console.error(`投稿のDELETEリクエストに失敗しました\n${error.message}`)
                    : console.error(`予期せぬエラーが発生しました\n${error}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;
        const file = e.target.files[0];
        setIsSubmitting(true);
        try {
            const fileHash = await calculateMD5Hash(file);
            const path = `private/${fileHash}`;
            const { data, error } = await supabase.storage
                .from(bucketName)
                .upload(path, file, { upsert: true });
            if (error || !data) throw new Error(error.message);
            setCoverImageKey(data.path); // 更新用Stateを書き換え
        } catch (e) {
            window.alert("画像のアップロードに失敗しました");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading || isAuthLoading) return <div className="text-gray-500"><FontAwesomeIcon icon={faSpinner} className="mr-1 animate-spin" /> Loading...</div>;
    if (!token) return null; // トークンがない場合は何も表示しない
    if (error) return <div className="text-red-500">{error}</div>;
    if (!post) return <div className="text-gray-500">投稿が見つかりません。</div>;

    return (
        <main>
            <div className="mb-4 text-2xl font-bold">投稿の編集</div>
            <form onSubmit={handleSave} className={twMerge(isSubmitting && "opacity-50")}>
                <div className="space-y-2">
                    <div>
                        <label className="block font-bold">タイトル</label>
                        <input
                            type="text"
                            id="title"
                            name="title"
                            className="w-full rounded border px-2 py-1"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="タイトルを記入してください"
                            required
                        />
                    </div>
                    <div>
                        <label className="block font-bold">本文</label>
                        <textarea
                            id="content"
                            name="content"
                            className="w-full rounded border px-2 py-1 h-48"
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder="本文を記入してください"
                            required
                        />
                    </div>
                    <div>
                        <label className="block font-bold">カバー画像</label>
                        <input
                            type="file"
                            accept="image/*"
                            className="mb-2 block w-full text-sm"
                            onChange={handleImageChange}
                            placeholder="カバー画像を選択してください"
                            required
                        />
                        <input
                            type="text"
                            readOnly
                            className="w-full rounded border bg-gray-100 px-2 py-1 text-xs"
                            value={coverImageKey}
                            placeholder="現在のカバー画像のキー"
                        />
                    </div>
                    <div className="space-y-1">
                        <div className="font-bold">タグ</div>
                        <div className="flex flex-wrap gap-x-3.5">
                            {checkableCategories && checkableCategories.length > 0 ? (
                                checkableCategories.map((c) => (
                                    <label key={c.id} className="flex space-x-1">
                                        <input
                                            id={c.id}
                                            type="checkbox"
                                            checked={c.isSelect}
                                            className="mt-0.5 cursor-pointer"
                                            onChange={() => switchCategoryState(c.id)}
                                        />
                                        <span className="cursor-pointer">{c.name}</span>
                                    </label>
                                ))
                                ) : (
                                    <div>選択可能なカテゴリが存在しません。</div>
                                )}
                        </div>
                    </div>
                    <div className="mt-6 border-t pt-4">
                        <div className="mb-2 font-bold">コメント一覧</div>
                        {comments.length === 0 ? (
                            <div className="text-sm text-gray-500">この投稿にはコメントがありません。</div>
                        ) : (
                                <div className="space-y-2">
                                    {comments.map((c) => {
                                        const isSelected = selectCommentIds.includes(c.id);
                                        return (
                                            <label key={c.id} className={twMerge(
                                                "flex items-start gap-3 rounded border p-3 text-sm cursor-pointer transition",
                                                isSelected ? "bg-red-50 border-red-200 opacity-60" : "bg-gray-50 border-gray-200"
                                            )}>
                                                <input
                                                    type="checkbox"
                                                    checked={isSelected}
                                                    onChange={() => toggleSelectComment(c.id)}
                                                    className="mt-1 cursor-pointer"
                                                />
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2">
                                                        {c.isAdmin && (
                                                            <span className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded">
                                                                管理者
                                                            </span>
                                                        )}
                                                        <span className="text-gray-500">
                                                            {new Date(c.createdAt).toLocaleString()}
                                                        </span>
                                                        {isSelected &&
                                                            <span className="text-xs text-red-500 font-bold ml-2">
                                                                削除対象
                                                            </span>
                                                        }
                                                    </div>
                                                    <p className={twMerge("text-gray-700", isSelected && "line-through")}>{c.text}</p>
                                                </div>
                                            </label>
                                        );
                                    })}
                                </div>
                            )}
                    </div>
                </div>
                <div className="mt-4 flex gap-2 justify-end">
                    <button type="button" onClick={() => router.push("/admin/posts")} className="rounded border px-3 py-1">キャンセル</button>
                    <button type="button" onClick={handleSave} className="rounded bg-indigo-500 px-3 py-1 text-white" disabled={isSubmitting}>保存</button>
                    <button type="button" onClick={handleDelete} className="rounded bg-red-500 px-3 py-1 text-white" disabled={isSubmitting}>削除</button>
                </div>
            </form>
            <div className="space-y-2 pt-8 text-center">
                <Link
                    href="/admin/posts"
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
        </main>
    );
};

export default AdminEditPostPage;
