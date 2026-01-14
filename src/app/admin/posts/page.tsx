"use client";
import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpinner, faPen, faPlus } from "@fortawesome/free-solid-svg-icons";
import { supabase } from "@/utils/supabase";
import type { Post } from "@/app/_types/Post";

// 取得データの型を定義
type PostWithCategoryResponse = {
    id: string;
    title: string;
    createdAt: string;
    coverImageURL?: string;
    PostCategory: {
        Category: {
            id: string;
            name: string;
        }[];
    }[];
};

const AdminPostsPage: React.FC = () => {
    const [posts, setPosts] = useState<Post[] | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    // ソート状態を管理するためのState
    const [sortBy, setSortBy] = useState<string>("newest");

    useEffect(() => {
        const fetchPosts = async () => {
            try {
                setIsLoading(true);
                const { data, error } = await supabase
                    .from("Post")
                    .select("id, title, createdAt, coverImageURL, PostCategory(Category(id, name))")
                    .order("createdAt", { ascending: false });

                if (error) throw error;

                const mapped = (data as unknown as PostWithCategoryResponse[] || []).map((row) => ({
                    id: row.id,
                    title: row.title,
                    content: "",
                    createdAt: row.createdAt,
                    coverImage: { url: row.coverImageURL || "", width: 1365, height: 768 },
                    categories: row.PostCategory
                        .filter((pc) => pc.Category && pc.Category.length > 0) 
                        .map((pc) => ({
                            id: pc.Category[0].id,
                            name: pc.Category[0]?.name,
                    })),
                })) as Post[];
                
                setPosts(mapped);
            } catch (e) {
                setError(e instanceof Error ? e.message : String(e));
            } finally {
                setIsLoading(false);
            }
        };
        fetchPosts();
    }, []);

    // ソートロジック
    const sortedPosts = useMemo(() => {
        if (!posts) return null;

        const clonedPosts = [...posts];

        switch (sortBy) {
            case "newest": // 新しい順
                return clonedPosts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            case "oldest": // 古い順
                return clonedPosts.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
            default:
                return clonedPosts;
        }
    }, [posts, sortBy]);

    if (isLoading) return <div className="text-gray-500"><FontAwesomeIcon icon={faSpinner} className="mr-1 animate-spin"/> Loading...</div>;
    if (error) return <div className="text-red-500">{error}</div>;
    if (!posts || posts.length === 0) return <div className="text-gray-500">投稿がありません。</div>;

    return (
        <main>
            <div className="mb-4 flex items-center justify-between">
                <div className="text-2xl font-bold">投稿一覧（管理）</div>
                <Link href="/admin/posts/new" className="rounded bg-indigo-500 px-3 py-1 text-white">
                    <FontAwesomeIcon icon={faPlus} />新規作成
                </Link>
            </div>

            <div className="mb-4 flex justify-end items-center gap-2">
                <label htmlFor="sort" className="text-sm font-bold text-slate-700">並び替え:</label>
                <select 
                    id="sort"
                    className="rounded border md:w-48 px-2 py-1 outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                >
                    <option value="newest">投稿が新しい順</option>
                    <option value="oldest">投稿が古い順</option>
                </select>
            </div>

            <div className="space-y-2 mb-8">
                {sortedPosts?.map((p) => (
                    <div key={p.id} className="flex items-center justify-between border p-3 bg-white">
                        <div>
                            <div className="font-bold">{p.title}</div>
                            <div className="flex gap-2 items-center">
                                <div className="text-sm text-slate-500">
                                    {(() => {
                                    const utcDate = p.createdAt.endsWith("Z") ? p.createdAt : `${p.createdAt}Z`;
                                    const date = new Date(utcDate);
                                        return date.toLocaleString("ja-JP", {
                                            timeZone: "Asia/Tokyo",
                                            year: "numeric",
                                            month: "2-digit",
                                            day: "2-digit",
                                            hour: "2-digit",
                                            minute: "2-digit",
                                        });
                                    })()}
                                </div>
                                <div className="flex gap-1">
                                    {p.categories.map((c, index) => (
                                        <span key={`${p.id}-${c.id}-${index}`} className="text-xs bg-slate-100 px-1 rounded">{c.name}</span>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Link href={`/admin/posts/${p.id}`} className="inline-flex items-center gap-2 rounded bg-blue-800 px-3 py-1 text-white">
                                <FontAwesomeIcon icon={faPen} /> 編集
                            </Link>
                        </div>
                    </div>
                ))}
            </div>
        </main>
    );
};

export default AdminPostsPage;