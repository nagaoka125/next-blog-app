"use client";
import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpinner } from "@fortawesome/free-solid-svg-icons";
import { twMerge } from "tailwind-merge";
import { useAuth } from "@/app/_hooks/useAuth";
import { ChangeEvent } from "react";
import { supabase } from "@/utils/supabase";
import CryptoJS from "crypto-js";

type CategoryApiResponse = {
    id: string;
    name: string;
    createdAt: string;
    updatedAt: string;
};

// カテゴリ選択用のデータ型
type SelectCategory = {
    id: string;
    name: string;
    isSelect: boolean;
};

const calculateMD5Hash = async (file: File): Promise<string> => {
    const buffer = await file.arrayBuffer();
    const wordArray = CryptoJS.lib.WordArray.create(buffer);
    return CryptoJS.MD5(wordArray).toString();

}

// 投稿を新規作成するページ
const Page: React.FC = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [fetchErrorMsg, setFetchErrorMsg] = useState<string | null>(null);
    const [newTitle, setNewTitle] = useState("");
    const [newContent, setNewContent] = useState("");
    const [newCoverImageKey, setNewCoverImageKey] = useState("");
    const { token, isLoading: isAuthLoading } = useAuth();
    const bucketName = "cover-image";
    const [coverImageKey, setCoverImageKey] = useState<string | undefined>();

    const router = useRouter();

    // カテゴリ配列 (State)。取得中と取得失敗時は null、既存カテゴリが0個なら []
    const [checkableCategories, setCheckableCategories] = useState<SelectCategory[] | null>(null);

    useEffect(() => {
        if (isAuthLoading) return; // 認証状態がまだわからない場合は何もしない
        if (!token) {
            window.alert("投稿するにはログインが必要です");
            router.push("/login");
        }
    }, [token, isAuthLoading, router]);

    useEffect(() => {
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
                setFetchErrorMsg(errorMsg);
            } finally {
                // 成功した場合も失敗した場合もローディング状態を解除
                setIsLoading(false);
            }
        };

        fetchCategories();
    }, []);

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

    const updateNewTitle = (e: React.ChangeEvent<HTMLInputElement>) => {
        // タイトルのバリデーション処理
        setNewTitle(e.target.value);
    };

    const updateNewContent = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        // 本文のバリデーション処理
        setNewContent(e.target.value);
    };

    const updateNewCoverImageKey = (e: React.ChangeEvent<HTMLInputElement>) => {
        // カバーイメージキーのバリデーション処理
        setNewCoverImageKey(e.target.value);
    };

    // フォームの送信処理
    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const requestBody = {
                title: newTitle,
                content: newContent,
                coverImageKey: newCoverImageKey,
                categoryIds: checkableCategories
                    ? checkableCategories.filter((c) => c.isSelect).map((c) => c.id)
                    : [],
            };

            if (!token) {
                window.alert("予期せぬ動作: トークンが取得できません");
                return;
            }

            const requestUrl = "/api/admin/posts";
            console.log(`${requestUrl} => ${JSON.stringify(requestBody, null, 2)}`);
            const res = await fetch(requestUrl, {
                method: "POST",
                cache: "no-store",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": token,
                },
                body: JSON.stringify(requestBody),
            });

            if (!res.ok) {
                throw new Error(`${res.status}: ${res.statusText}`);
            }

            const postResponse = await res.json();
            setIsSubmitting(false);
            router.push(`/posts/${postResponse.id}`); // 投稿記事の詳細ページに移動
        } catch (error) {
            const errorMsg =
                error instanceof Error
                    ? `投稿記事のPOSTリクエストに失敗しました\n${error.message}`
                    : `予期せぬエラーが発生しました\n${error}`;
            console.error(errorMsg);
            window.alert(errorMsg);
            setIsSubmitting(false);
        }
    };


    // 画像アップロード
    const handleImageChange = async (e: ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;
    
        const file = e.target.files[0];
        setIsSubmitting(true); // アップロード中も送信中状態にする

        try {
            const fileHash = await calculateMD5Hash(file);
            const path = `private/${fileHash}`;
            const { data, error } = await supabase.storage
                .from(bucketName)
                .upload(path, file, { upsert: true });
            if (error || !data) throw new Error(error.message);
            setNewCoverImageKey(data.path); // キーをStateに保存
        } catch (error) {
            window.alert(`画像のアップロードに失敗しました: ${error}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isAuthLoading || isLoading) {
        return (
            <div className="text-gray-500">
                <FontAwesomeIcon icon={faSpinner} className="mr-1 animate-spin" />
                Loading...
            </div>
        );
    }

    if (!token) return null; // ログインしていない場合は何も表示しない 

    if (!checkableCategories) {
        return <div className="text-red-500">{fetchErrorMsg}</div>;
    }

    return (
        <main>
            <div className="mb-4 text-2xl font-bold">投稿記事の新規作成</div>

            {isSubmitting && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="flex items-center rounded-lg bg-white px-8 py-4 shadow-lg">
                        <FontAwesomeIcon
                            icon={faSpinner}
                            className="mr-2 animate-spin text-gray-500"
                        />
                        <div className="flex items-center text-gray-500">処理中...</div>
                    </div>
                </div>
            )}

            <form
                onSubmit={handleSubmit}
                className={twMerge("space-y-4", isSubmitting && "opacity-50")}
            >
                <div className="space-y-1">
                    <label htmlFor="title" className="block font-bold">
                        タイトル
                    </label>
                    <input
                        type="text"
                        id="title"
                        name="title"
                        className="w-full rounded-md border-2 px-2 py-1"
                        value={newTitle}
                        onChange={updateNewTitle}
                        placeholder="タイトルを記入してください"
                        required
                    />
                </div>

                <div className="space-y-1">
                    <label htmlFor="content" className="block font-bold">
                        本文
                    </label>
                    <textarea
                        id="content"
                        name="content"
                        className="h-48 w-full rounded-md border-2 px-2 py-1"
                        value={newContent}
                        onChange={updateNewContent}
                        placeholder="本文を記入してください"
                        required
                    />
                </div>

                <div className="space-y-1">
                    <label htmlFor="coverImageKey" className="block font-bold">
                        カバーイメージ
                    </label>
                    <input
                        type="file"
                        accept="image/*"
                        className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                        onChange={handleImageChange}
                        placeholder="カバーイメージを選択してください"
                        required
                    />
                    {newCoverImageKey && (
                        <div className="text-xs text-grey-500 break-all mt-1">
                            アップロード画像のキー: {newCoverImageKey}
                        </div>
                    )}
                </div>

                <div className="space-y-1">
                    <div className="font-bold">タグ</div>
                    <div className="flex flex-wrap gap-x-3.5">
                        {checkableCategories.length > 0 ? (
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

                <div className="flex justify-end">
                    <button
                        type="submit"
                        className={twMerge(
                            "rounded-md px-5 py-1 font-bold",
                            "bg-indigo-500 text-white hover:bg-indigo-600",
                            "disabled:cursor-not-allowed"
                        )}
                        disabled={isSubmitting}
                    >
                        記事を投稿
                    </button>
                </div>
            </form>
        </main>
    );
};

export default Page;