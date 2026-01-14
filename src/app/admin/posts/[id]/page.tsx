"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/utils/supabase";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpinner } from "@fortawesome/free-solid-svg-icons";
import { twMerge } from "tailwind-merge";
import type { Post } from "@/app/_types/Post";

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

const AdminEditPostPage: React.FC = () => {
    const { id } = useParams() as { id: string };
    const router = useRouter();
    const [post, setPost] = useState<Post | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [coverImageURL, setCoverImageURL] = useState("");
    // カテゴリ配列 (State)。取得中と取得失敗時は null、既存カテゴリが0個なら []
    const [checkableCategories, setCheckableCategories] = useState<SelectCategory[] | null>(null);

    useEffect(() => {
        const fetchPost = async () => {
            try {
                setIsLoading(true);
                const { data, error } = await supabase.from("Post").select("*").eq("id", id).single();
                if (error) throw error;
                const row = data as { id: string; title: string; content?: string; createdAt: string; coverImageURL?: string };
                const mapped: Post = {
                    id: row.id,
                    title: row.title,
                    content: row.content || "",
                    createdAt: row.createdAt,
                    coverImage: { url: row.coverImageURL || "", width: 1365, height: 768 },
                    categories: [],
                };
                setPost(mapped);
                setTitle(mapped.title);
                setContent(mapped.content);
                setCoverImageURL(mapped.coverImage.url);
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
        setIsSubmitting(true);
        try {
            const { error } = await supabase
                .from("Post")
                .update({ title, content, coverImageURL })
                .eq("id", id);
            if (error) throw error;
            router.push("/admin/posts");
        } catch (e) {
            setError(e instanceof Error ? e.message : String(e));
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm("本当にこの投稿を削除しますか？")) {
            return;
        }
        setIsSubmitting(true);
        // DELETEリクエストを送信
        try {
            const requestUrl = `/api/admin/posts/${id}`;
            const res = await fetch(requestUrl, {
                method: "DELETE",
                cache: "no-store",
            });

            if (!res.ok) {
                throw new Error(`${res.status}: ${res.statusText}`); // -> catch節に移動
            }
            router.push("/admin/posts"); // 投稿一覧ページにリダイレクト
        } catch (error) {
            const errorMsg =
                error instanceof Error
                    ? console.error(`投稿のDELETEリクエストに失敗しました\n${error.message}`)
                    : console.error(`予期せぬエラーが発生しました\n${error}`);
        } finally {
            setIsSubmitting(false);
        }
    }

    if (isLoading) return <div className="text-gray-500"><FontAwesomeIcon icon={faSpinner} className="mr-1 animate-spin"/> Loading...</div>;
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
                        <label className="block font-bold">カバー画像URL</label>
                        <input
                            type="url"
                            id="coverImageURL"
                            name="coverImageURL"
                            className="w-full rounded border px-2 py-1"
                            value={coverImageURL}
                            onChange={(e) => setCoverImageURL(e.target.value)}
                            placeholder="カバー画像のURLを記入してください"
                            required
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
                </div>
                <div className="mt-4 flex gap-2 justify-end">
                    <button type="button" onClick={() => router.push("/admin/posts")} className="rounded border px-3 py-1">キャンセル</button>
                    <button type="button" onClick={handleSave} className="rounded bg-indigo-500 px-3 py-1 text-white" disabled={isSubmitting}>保存</button>
                    <button type="button" onClick={handleDelete} className="rounded bg-red-500 px-3 py-1 text-white" disabled={isSubmitting}>削除</button>
                </div>
            </form>
        </main>
    );
};

export default AdminEditPostPage;
