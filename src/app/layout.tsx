import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import Link from "next/link";
import LiffProvider from "@/components/LiffProvider";
import BottomNav from "@/components/BottomNav";
import "./globals.css";

const geist = Geist({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "BadWin - バドミントン戦績",
  description: "バドミントンの勝敗を記録するアプリ",
};

export const viewport: Viewport = {
  themeColor: "#030712",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body className={`${geist.className} bg-gray-950 text-white min-h-screen`}>
        {/* ヘッダー */}
        <header className="border-b border-gray-800 bg-gray-900/80 backdrop-blur sticky top-0 z-10">
          <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 font-bold text-lg text-green-400">
              <span>🏸</span>
              <span>BadWin</span>
            </Link>
            {/* PCナビ */}
            <nav className="hidden md:flex items-center gap-1">
              <Link href="/" className="px-3 py-1.5 rounded-lg text-sm text-gray-300 hover:text-white hover:bg-gray-800 transition-colors">
                ホーム
              </Link>
              <Link href="/ranking" className="px-3 py-1.5 rounded-lg text-sm text-gray-300 hover:text-white hover:bg-gray-800 transition-colors">
                🏆 ランキング
              </Link>
              <Link href="/sessions" className="px-3 py-1.5 rounded-lg text-sm text-gray-300 hover:text-white hover:bg-gray-800 transition-colors">
                📅 セッション
              </Link>
              <Link href="/matches" className="px-3 py-1.5 rounded-lg text-sm text-gray-300 hover:text-white hover:bg-gray-800 transition-colors">
                履歴
              </Link>
              <Link href="/members" className="px-3 py-1.5 rounded-lg text-sm text-gray-300 hover:text-white hover:bg-gray-800 transition-colors">
                メンバー
              </Link>
              <Link href="/profile" className="px-3 py-1.5 rounded-lg text-sm text-gray-300 hover:text-white hover:bg-gray-800 transition-colors">
                👤
              </Link>
              <Link href="/matches/new" className="ml-2 px-3 py-1.5 rounded-lg text-sm bg-green-500 hover:bg-green-400 text-black font-semibold transition-colors">
                + 記録
              </Link>
            </nav>
          </div>
        </header>

        <LiffProvider>
          {/* モバイルはボトムナビ分の余白を追加 */}
          <main className="max-w-2xl mx-auto px-4 py-6 pb-24 md:pb-6">
            {children}
          </main>
          <BottomNav />
        </LiffProvider>
      </body>
    </html>
  );
}
