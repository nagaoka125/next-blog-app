"use client";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowRight } from "@fortawesome/free-solid-svg-icons";
import { twMerge } from "tailwind-merge";
import { faChevronLeft } from "@fortawesome/free-solid-svg-icons";

const Page: React.FC = () => {
  return (
    <main>
      <div className="mb-2 text-2xl font-bold">管理者用機能の一覧</div>
      <ul>
        <li>
          <FontAwesomeIcon icon={faArrowRight} className="mr-2" />
          投稿一覧
          <Link className="text-blue-500 underline" href="/admin/posts">
            /admin/posts
          </Link>
        </li>
        <li>
          <FontAwesomeIcon icon={faArrowRight} className="mr-2" />
          投稿新規作成
          <Link className="text-blue-500 underline" href="/admin/posts/new">
            /admin/posts/new
          </Link>
        </li>
        <li>
          <FontAwesomeIcon icon={faArrowRight} className="mr-2" />
          カテゴリ一覧
          <Link className="text-blue-500 underline" href="/admin/categories">
            /admin/categories
          </Link>
        </li>
        <li>
          <FontAwesomeIcon icon={faArrowRight} className="mr-2" />
          カテゴリ新規作成
          <Link
            className="text-blue-500 underline"
            href="/admin/categories/new"
          >
            /admin/categories/new
          </Link>
        </li>
      </ul>

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
    </main>
  );
};

export default Page;