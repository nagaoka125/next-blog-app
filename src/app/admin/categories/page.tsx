"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { twMerge } from "tailwind-merge";
import Link from "next/link";
import { faChevronLeft } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpinner, faPlus } from "@fortawesome/free-solid-svg-icons";
import { Category } from "@/app/_types/Category";
import { useAuth } from "@/app/_hooks/useAuth";


const Page: React.FC = () => {
    const [categories, setCategories] = useState<Category[] | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const router = useRouter();
    const { token, isLoading: isAuthLoading } = useAuth();
    
    const { id } = useParams() as { id: string };

    useEffect(() => {
        if (!isAuthLoading && !token) {
            window.alert("ログインが必要です");
            router.push("/login");
        }
    }, [token, isAuthLoading, router]);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                setIsLoading(true);
                const res = await fetch("/api/categories", { cache: "no-store" });
                if (!res.ok) throw new Error(`${res.status}: ${res.statusText}`);
                const data = (await res.json()) as Category[];
                setCategories(data.map((c) => ({ id: c.id, name: c.name })));
            } catch (e) {
                setErrorMsg(e instanceof Error ? e.message : String(e));
                setCategories(null);
            } finally {
                setIsLoading(false);
            }
        };
        fetchCategories();
    }, []);

    const handleDelete = async (id: string, name: string) => {
        if (!window.confirm(`本当にカテゴリ「${name}」を削除しますか？`)) {
            return;
        }
        if (!token) return;
        setIsSubmitting(true);
        // DELETEリクエストを送信
        try {
            const requestUrl = `/api/admin/categories/${id}`;
            const res = await fetch(requestUrl, {
                method: "DELETE",
                headers: { Authorization: token }, // トークンを付与
                cache: "no-store",
            });

            if (!res.ok) {
                throw new Error(`${res.status}: ${res.statusText}`); // -> catch節に移動
            }
            setCategories((prev) => prev?.filter((c) => c.id !== id) || null);
            window.alert(`カテゴリ「${name}」を削除しました。`);
            router.push("/admin/categories"); // カテゴリ一覧ページにリダイレクト
        } catch (error) {
            const errorMsg =
                error instanceof Error
                    ? console.error(`カテゴリのDELETEリクエストに失敗しました\n${error.message}`)
                    : console.error(`予期せぬエラーが発生しました\n${error}`);
        } finally {
            setIsSubmitting(false);
        }
    }

    if (isLoading || isAuthLoading) {
        return (
            <div className="text-gray-500">
                <FontAwesomeIcon icon={faSpinner} className="mr-1 animate-spin" />
                Loading...
            </div>
        );
    }

    if (!token) return null; // トークンがない場合は何も表示しない

    if (errorMsg) {
        return <div className="text-red-500">{errorMsg}</div>;
    }

    return (
        <main className="max-w-4xl mx-auto p-4">
            <div className="mb-6">
                <div className="text-2xl font-bold mb-4">カテゴリ一覧</div>
                <Link
                    href="/admin/categories/new"
                    className="inline-flex items-center gap-2 rounded bg-indigo-500 px-3 py-1 text-white">
                    <FontAwesomeIcon icon={faPlus} /> 新規作成
                </Link>
            </div>

            {categories && categories.length === 0 && (
                <div className="text-gray-500 text-center py-10 border rounded">
                    （カテゴリは1個も作成されていません）
                </div>
            )}

            {categories && categories.length > 0 && (
                <div className="space-y-3">
                    {categories.map((c) => (
                        <div
                            key={c.id}
                            className="flex items-center justify-between border border-slate-300 rounded p-4 bg-white"
                        >
                            <div className="text-lg font-medium text-slate-800">
                                {c.name}
                            </div>
                            <div className="flex gap-3">
                                <Link
                                    href={`/admin/categories/${c.id}`}
                                    className="rounded bg-indigo-500 px-5 py-2 text-white font-bold hover:bg-indigo-600 transition-colors w-24 text-center"
                                >
                                    編集
                                </Link>
                                <button
                                    type="button"
                                    className={twMerge(
                                        "rounded-md px-5 py-1 font-bold",
                                        "bg-red-500 text-white hover:bg-red-600"
                                    )}
                                    onClick={() => handleDelete(c.id, c.name)}
                                >
                                    削除
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
            <div className="space-y-2 pt-8 text-center">
                <Link
                    href="/admin"
                    className={twMerge(
                        "inline-flex items-center justify-center gap-2",
                        "rounded-full bg-slate-100 px-6 py-2 font-bold text-slate-600",
                        "transition-colors hover:bg-slate-200"
                    )}
                >
                    <FontAwesomeIcon icon={faChevronLeft} className="text-xs" />
                    管理一覧に戻る
                </Link>
            </div>
        </main>
    );
};


export default Page;
