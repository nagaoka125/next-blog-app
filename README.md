This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## コメント機能について

このアプリでは投稿の任意位置に吹き出し形式でコメントを付けられる機能を実装しています。

### 必須のデータ構造
Supabase上に以下のようなテーブルが必要です（管理コンソールのSQLエディタやマイグレーションで作成）：

```sql
create table "Comment" (
  id uuid primary key default gen_random_uuid(),
  "postId" text not null references "Post"(id) on delete cascade,
  position integer not null,
  text text not null,
  "createdAt" timestamp with time zone default now()
);
```

カラム名はコード中で使われている通りキャメルケースになっています。
テーブル名は大文字 `Comment` としています。

新しいコメントはUI上の `+` アイコンから追加でき、吹き出しアイコンをクリックすると内容を表示します。
表示/非表示はページ右上のボタンで切り替えられます。

Prisma を使ってローカルの SQLite (dev.db) を管理している場合は、`schema.prisma` に `Comment` モデルを追加済みです。変更後は以下を実行してください：

```bash
npx prisma db push
npx prisma generate
npx prisma db seed
```

これで開発環境でも同じデータ構造が利用可能になります。

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
