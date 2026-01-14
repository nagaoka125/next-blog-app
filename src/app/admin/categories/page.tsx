"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { twMerge } from "tailwind-merge";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpinner, faPlus } from "@fortawesome/free-solid-svg-icons";
import { Category } from "@/app/_types/Category";

const Page: React.FC = () => {
    const [categories, setCategories] = useState<Category[] | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const router = useRouter();
    
    const { id } = useParams() as { id: string };



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

    const handleDelete = async () => {
        if (!window.confirm("本当にこのカテゴリを削除しますか？")) {
            return;
        }
        setIsSubmitting(true);
        // DELETEリクエストを送信
        try {
            const requestUrl = `/api/admin/categories/${id}`;
            const res = await fetch(requestUrl, {
                method: "DELETE",
                cache: "no-store",
            });

            if (!res.ok) {
                throw new Error(`${res.status}: ${res.statusText}`); // -> catch節に移動
            }
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

    if (isLoading) {
        return (
            <div className="text-gray-500">
                <FontAwesomeIcon icon={faSpinner} className="mr-1 animate-spin" />
                Loading...
            </div>
        );
    }

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
                                    onClick={handleDelete}
                                >
                                    削除
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </main>
    );
};


export default Page;
