
import { Suspense } from "react";
import { getMatches, getMembers } from "@/lib/sheets";
import { Match, Member } from "@/lib/types";
import { ListSkeleton } from "@/components/Skeleton";

function calcAllStats(matches: Match[], members: Member[]) {
  const statsMap: Record<string, { wins: number; losses: number }> = {};
  for (const member of members) {
    statsMap[member.name] = { wins: 0, losses: 0 };
  }
  for (const m of matches) {
    const team1Won = m.score1 > m.score2;
    for (const name of m.team1) {
      if (!statsMap[name]) statsMap[name] = { wins: 0, losses: 0 };
      team1Won ? statsMap[name].wins++ : statsMap[name].losses++;
    }
    for (const name of m.team2) {
      if (!statsMap[name]) statsMap[name] = { wins: 0, losses: 0 };
      team1Won ? statsMap[name].losses++ : statsMap[name].wins++;
    }
  }
  return Object.entries(statsMap)
    .map(([name, s]) => {
      const total = s.wins + s.losses;
      return { name, wins: s.wins, losses: s.losses, total, winRate: total > 0 ? Math.round((s.wins / total) * 100) : 0 };
    })
    .sort((a, b) => b.winRate !== a.winRate ? b.winRate - a.winRate : b.total - a.total);
}

const MEDALS = ["🥇", "🥈", "🥉"];

async function RankingList() {
  let matches: Match[] = [];
  let members: Member[] = [];
  try {
    [matches, members] = await Promise.all([getMatches(), getMembers()]);
  } catch {
    // 接続失敗時は空
  }

  const stats = calcAllStats(matches, members);
  const playedStats = stats.filter((s) => s.total > 0);
  const noGameStats = stats.filter((s) => s.total === 0);

  if (playedStats.length === 0) {
    return (
      <div className="text-center py-16 text-gray-600">
        <div className="text-4xl mb-3">🏆</div>
        <p>まだ試合データがありません</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-2">
        {playedStats.map((s, i) => (
          <div key={s.name} className={`rounded-xl p-4 border flex items-center gap-4 ${i === 0 ? "bg-yellow-900/20 border-yellow-700/40" : i === 1 ? "bg-gray-400/10 border-gray-500/40" : i === 2 ? "bg-orange-900/20 border-orange-700/40" : "bg-gray-900 border-gray-800"}`}>
            <div className="w-10 text-center">
              {i < 3 ? <span className="text-2xl">{MEDALS[i]}</span> : <span className="text-gray-500 font-bold text-lg">{i + 1}</span>}
            </div>
            <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center font-bold text-gray-200">
              {s.name[0]}
            </div>
            <div className="flex-1">
              <div className="font-semibold text-white">{s.name}</div>
              <div className="text-xs text-gray-500 mt-0.5">{s.total}試合 · {s.wins}勝{s.losses}敗</div>
            </div>
            <div className="text-right">
              <div className={`text-xl font-black ${s.winRate >= 60 ? "text-green-400" : s.winRate >= 40 ? "text-yellow-400" : "text-red-400"}`}>{s.winRate}%</div>
              <div className="w-20 h-1.5 bg-gray-800 rounded-full mt-1 overflow-hidden">
                <div className={`h-full rounded-full ${s.winRate >= 60 ? "bg-green-500" : s.winRate >= 40 ? "bg-yellow-500" : "bg-red-500"}`} style={{ width: `${s.winRate}%` }} />
              </div>
            </div>
          </div>
        ))}
      </div>
      {noGameStats.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wider mb-2 mt-4">未出場</h2>
          <div className="space-y-2">
            {noGameStats.map((s) => (
              <div key={s.name} className="bg-gray-900/50 rounded-xl px-4 py-3 border border-gray-800/50 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center font-bold text-gray-500 text-sm">{s.name[0]}</div>
                <span className="text-gray-500">{s.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

export default function RankingPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">勝率ランキング</h1>
        <p className="text-gray-500 text-sm mt-1">全メンバーの戦績</p>
      </div>
      <Suspense fallback={<ListSkeleton count={4} />}>
        <RankingList />
      </Suspense>
    </div>
  );
}
