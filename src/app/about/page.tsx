"use client";
import Image from "next/image";
import { twMerge } from "tailwind-merge";

const Page: React.FC = () => {
  return (
    <main>
      <div className="mb-5 text-2xl font-bold">About</div>

      <div
        className={twMerge(
          "mx-auto mb-5 w-full md:w-2/3",
          "flex justify-center"
        )}
      >
        <Image
          src="/images/avatar.png"
          alt="Example Image"
          width={350}
          height={350}
          priority
          className="rounded-full border-4 border-slate-500 p-1.5"
        />
      </div>
      <div className="mx-auto mb-5 w-full md:w-2/3 text-center text-lg text-slate-700">
        <h1 className="text-2xl font-bold">About</h1>
          <p className="mt-4">
            閲覧者との活発なコミュニケーションを楽しみたい発信者に向けて開発したブログアプリです。
            通常の投稿全体に対するコメントだけでなく、記事内の「特定の文」に対してピンポイントでコメントを残せる機能を備えています。
            管理者（記事作成者）のコメントを視覚的に強調することで、読者の疑問に対する補足や回答が埋もれない設計にしています。
          </p>

        <h2 className="text-xl font-bold mt-4">開発の背景・経緯</h2>
          <p className="mt-2">
            従来のブログで、記事のどの部分に対する感想や質問なのかが伝わりにくいと思うことがありました。
            文単位でコメントができることで、読者が「この部分に補足がほしい」「この一文に共感した」といった具体的なフィードバックを伝えやすくなると考え、この機能を実装しました。
          </p>
      </div>
    </main>
  );
};

export default Page;