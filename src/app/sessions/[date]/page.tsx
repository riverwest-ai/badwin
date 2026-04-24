
import { Suspense } from "react";
import { getMatches } from "@/lib/sheets";
import { Match } from "@/lib/types";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import Link from "next/link";
import { ListSkeleton } from "@/components/Skeleton";

const MY_NAME = "ぎんじ";

async function SessionDetail({ date }: { date: string }) {
  let allMatches: Match[] = [];
  try {
    allMatches = await getMatches();
  } catch {
    // 接続失敗時は空
  }

  const matches = allMatches
    .filter((m) => m.date === date)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));

  const players = new Set<string>();
  matches.forEach((m) => {
    m.team1.forEach((p) => players.add(p));
    m.team2.forEach((p) => players.add(p));
  });

  const myMatches = matches.filter((m) => m.team1.includes(MY_NAME) || m.team2.includes(MY_NAME));
  const myWins = myMatches.filter((m) => m.team1.includes(MY_NAME) ? m.score1 > m.score2 : m.score2 > m.score1).length;

  return (
    <>
      <div className="flex gap-3 mt-2 text-sm text-gray-500">
        <span>{matches.length}試合</span>
        <span>·</span>
        <span>参加{players.size}名</span>
        {myMatches.length > 0 && (
          <>
            <span>·</span>
            <span className="text-green-400">{MY_NAME}: {myWins}勝{myMatches.length - myWins}敗</span>
          </>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {[...players].map((p) => (
          <span key={p} className={`px-3 py-1 rounded-full text-sm ${p === MY_NAME ? "bg-green-500/20 text-green-400 border border-green-700/40" : "bg-gray-800 text-gray-300 border border-gray-700"}`}>
            {p}
          </span>
        ))}
      </div>
      <div className="space-y-2">
        {matches.map((m, i) => {
          const myTeamWon = m.score1 > m.score2;
          const inTeam1 = m.team1.includes(MY_NAME);
          const inTeam2 = m.team2.includes(MY_NAME);
          return (
            <div key={m.id} className="bg-gray-900 rounded-xl p-4 border border-gray-800">
              <div className="text-xs text-gray-600 mb-2">第{i + 1}試合</div>
              <div className="flex items-center gap-3">
                <div className={`flex-1 text-sm font-semibold ${myTeamWon && inTeam1 ? "text-green-400" : !myTeamWon && inTeam2 ? "text-green-400" : (inTeam1 || inTeam2) ? "text-red-400" : "text-white"}`}>
                  {m.team1.join(" & ")}
                </div>
                <div className="text-center shrink-0">
                  <span className={`text-lg font-bold ${myTeamWon ? "text-green-400" : "text-gray-400"}`}>{m.score1}</span>
                  <span className="text-gray-600 mx-1">-</span>
                  <span className={`text-lg font-bold ${!myTeamWon ? "text-green-400" : "text-gray-400"}`}>{m.score2}</span>
                </div>
                <div className={`flex-1 text-sm font-semibold text-right ${!myTeamWon && inTeam2 ? "text-green-400" : myTeamWon && inTeam1 ? "text-red-400" : (inTeam1 || inTeam2) ? "text-red-400" : "text-white"}`}>
                  {m.team2.join(" & ")}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

export default async function SessionDetailPage({
  params,
}: {
  params: Promise<{ date: string }>;
}) {
  const { date } = await params;
  const decodedDate = decodeURIComponent(date);

  return (
    <div className="space-y-5">
      <div>
        <Link href="/sessions" className="text-sm text-gray-500 hover:text-gray-300 transition-colors">
          ← セッション一覧
        </Link>
        <h1 className="text-2xl font-bold text-white mt-2">
          {format(new Date(decodedDate), "M月d日(E)の練習", { locale: ja })}
        </h1>
      </div>
      <Suspense fallback={<ListSkeleton count={3} />}>
        <SessionDetail date={decodedDate} />
      </Suspense>
    </div>
  );
}
