"use client";

import { createContext, useContext, useEffect, useState } from "react";

type LiffUser = {
  lineUserId: string;
  displayName: string;
  pictureUrl?: string;
  memberName: string | null;
};

type LiffContextType = {
  user: LiffUser | null;
  loading: boolean;
  isLiff: boolean;
  refresh: () => void;
};

const LiffContext = createContext<LiffContextType>({
  user: null,
  loading: true,
  isLiff: false,
  refresh: () => {},
});

export function useLiff() {
  return useContext(LiffContext);
}

export default function LiffProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<LiffUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLiff, setIsLiff] = useState(false);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function init() {
      try {
        const { initLiff, liff } = await import("@/lib/liff-client");
        await initLiff();

        const inLiff = liff.isInClient();
        setIsLiff(inLiff);

        if (!liff.isLoggedIn()) {
          // ブラウザアクセス時はログインを強制しない
          if (inLiff) liff.login();
          setLoading(false);
          return;
        }

        const profile = await liff.getProfile();
        // サーバーからメンバー名の紐付けを取得
        const res = await fetch(`/api/line-users?lineUserId=${profile.userId}`);
        const data = await res.json();

        if (!cancelled) {
          setUser({
            lineUserId: profile.userId,
            displayName: profile.displayName,
            pictureUrl: profile.pictureUrl,
            memberName: data.memberName ?? null,
          });
        }
      } catch {
        // LIFF初期化失敗（ブラウザ直アクセスなど）は無視
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    init();
    return () => { cancelled = true; };
  }, [tick]);

  return (
    <LiffContext.Provider value={{ user, loading, isLiff, refresh: () => setTick((t) => t + 1) }}>
      {children}
    </LiffContext.Provider>
  );
}
