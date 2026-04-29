
import { Suspense } from "react";
import { getMatches } from "@/lib/sheets";
import { Match } from "@/lib/types";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import Link from "next/link";
import { ListSkeleton } from "@/components/Skeleton";

const MY_NAME = "ぎんじ";

function calcPlayerStats(matches: Match[]) {
  const stats: Record<string, { wins: number; losses: number }> = {};
  for (const m of matches) {
    const team1Won = m.score1 > m.score2;
    for (const p of m.team1) {
      if (!stats[p]) stats[p] = { wins: 0, losses: 0 };
      team1Won ? stats[p].wins++ : stats[p].losses++;
    }
    for (const p of m.team2) {
      if (!stats[p]) stats[p] = { wins: 0, losses: 0 };
      team1Won ? stats[p].losses++ : stats[p].wins++;
    }
  }
  return Object.entries(stats)
    .map(([name, s]) => {
      const total = s.wins + s.losses;
      return { name, wins: s.wins, losses: s.losses, total, winRate: total > 0 ? Math.round((s.wins / total) * 100) : 0 };
    })
    .sort((a, b) => b.winRate - a.winRate || b.total - a.total);
}

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

  const playerStats = calcPlayerStats(matches);

  return (
    <>
      <div className="flex gap-3 mt-2 text-sm text-gray-500">
        <span>{matches.length}試合</span>
        <span>·</span>
        <span>参加{playerStats.length}名</span>
      </div>

      {/* 参加者別勝率 */}
      {playerStats.length > 0 && (
        <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
          <div className="px-4 py-2.5 border-b border-gray-800">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">参加者の勝率</span>
          </div>
          <div className="divide-y divide-gray-800">
            {playerStats.map((s, i) => (
              <div key={s.name} className={`flex items-center gap-3 px-4 py-3 ${s.name === MY_NAME ? "bg-green-500/5" : ""}`}>
                <span className="text-gray-600 text-sm w-5 text-right">{i + 1}</span>
                <div className="w-7 h-7 rounded-full bg-gray-700 flex items-center justify-center text-xs font-bold text-gray-300 shrink-0">
                  {s.name[0]}
                </div>
                <span className={`flex-1 text-sm font-medium ${s.name === MY_NAME ? "text-green-400" : "text-white"}`}>
                  {s.name}
                  {s.name === MY_NAME && <span className="ml-1.5 text-xs bg-green-500/20 px-1.5 py-0.5 rounded-full">あなた</span>}
                </span>
                <span className="text-xs text-gray-500">{s.wins}勝{s.losses}敗</span>
                <div className="flex items-center gap-2 w-20">
                  <div className="flex-1 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${s.winRate >= 60 ? "bg-green-500" : s.winRate >= 40 ? "bg-yellow-500" : "bg-red-500"}`}
                      style={{ width: `${s.winRate}%` }}
                    />
                  </div>
                  <span className={`text-sm font-bold w-9 text-right ${s.winRate >= 60 ? "text-green-400" : s.winRate >= 40 ? "text-yellow-400" : "text-red-400"}`}>
                    {s.winRate}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 試合一覧 */}
      <div className="space-y-2">
        {matches.map((m, i) => {
          const team1Won = m.score1 > m.score2;
          const inTeam1 = m.team1.includes(MY_NAME);
          const inTeam2 = m.team2.includes(MY_NAME);
          const myWon = (inTeam1 && team1Won) || (inTeam2 && !team1Won);
          return (
            <div key={m.id} className="bg-gray-900 rounded-xl p-4 border border-gray-800">
              <div className="text-xs text-gray-600 mb-2 flex items-center gap-2">
                <span>第{i + 1}試合</span>
                {(inTeam1 || inTeam2) && (
                  <span className={`px-1.5 py-0.5 rounded text-xs font-semibold ${myWon ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>
                    {myWon ? "勝" : "負"}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3">
                <div className={`flex-1 text-sm font-semibold ${team1Won && inTeam1 ? "text-green-400" : !team1Won && inTeam2 ? "text-green-400" : (inTeam1 || inTeam2) ? "text-red-400" : "text-white"}`}>
                  {m.team1.join(" & ")}
                </div>
                <div className="text-center shrink-0">
                  <span className={`text-lg font-bold ${team1Won ? "text-green-400" : "text-gray-400"}`}>{m.score1}</span>
                  <span className="text-gray-600 mx-1">-</span>
                  <span className={`text-lg font-bold ${!team1Won ? "text-green-400" : "text-gray-400"}`}>{m.score2}</span>
                </div>
                <div className={`flex-1 text-sm font-semibold text-right ${!team1Won && inTeam2 ? "text-green-400" : team1Won && inTeam1 ? "text-red-400" : (inTeam1 || inTeam2) ? "text-red-400" : "text-white"}`}>
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
