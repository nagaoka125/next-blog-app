import { useState, useEffect } from "react";
import { Session } from "@supabase/supabase-js";
import { supabase } from "@/utils/supabase";

export const useAuth = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    // 初期セッションの取得
    const FIRST_VISIT_KEY = "app_has_visited_v1";
    const initAuth = async () => {
      try {
        // 初回訪問の場合はブラウザに残っているセッションを破棄して
        // 初期状態をログアウトにする
        if (typeof window !== "undefined" && !localStorage.getItem(FIRST_VISIT_KEY)) {
          try {
            await supabase.auth.signOut();
          } catch (e) {
            console.warn("初回訪問のサインアウトに失敗しました", e);
          }
          localStorage.setItem(FIRST_VISIT_KEY, "1");
        }

        const {
          data: { session },
        } = await supabase.auth.getSession();
        setSession(session);
        setToken(session?.access_token || null);
        setIsLoading(false);
      } catch (error) {
        console.error(
          `セッションの取得に失敗しました。\n${JSON.stringify(error, null, 2)}`
        );
        setIsLoading(false);
      }
    };
    initAuth();

    // 認証状態の変更を監視
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setToken(session?.access_token || null);
      }
    );

    // アンマウント時に監視を解除（クリーンアップ）
    return () => authListener?.subscription?.unsubscribe();
  }, []);

  return { isLoading, session, token };
};