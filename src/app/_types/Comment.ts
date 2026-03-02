export interface Comment {
  id: string;
  postId: string;
  position: number; // word index where comment is anchored
  text: string;
  type: "inline" | "global";
  userId: string | null;
  createdAt: string;
  isAdmin?: boolean; // フロントエンドで管理者かどうかを判定するためのフィールド（オプショナル）
}
