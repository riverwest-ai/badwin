import Link from "next/link";
import { getMatches } from "@/lib/sheets";
import { Match } from "@/lib/types";
import { format } from "date-fns";
import { ja } from "date-fns/locale";

const MY_NAME = "ぎんじ";

function calcStats(matches: Match[]) {
  const myMatches = matches.filter(
    (m) => m.team1.includes(MY_NAME) || m.team2.includes(MY_NAME)
  );
  const wins = myMatches.filter((m) =>
    m.team1.includes(MY_NAME) ? m.score1 > m.score2 : m.score2 > m.score1
  ).length;
  const losses = myMatches.length - wins;
  const winRate = myMatches.length > 0 ? Math.round((wins / myMatches.length) * 100) : 0;
  return { total: myMatches.length, wins, losses, winRate };
}

function calcPartnerStats(matches: Match[]) {
  const partnerMap: Record<string, { wins: number; total: number }> = {};
  for (const m of matches) {
    const inTeam1 = m.team1.includes(MY_NAME);
    const inTeam2 = m.team2.includes(MY_NAME);
    if (!inTeam1 && !inTeam2) continue;

    const partner = inTeam1
      ? m.team1.find((p) => p !== MY_NAME)!
      : m.team2.find((p) => p !== MY_NAME)!;
    const won = inTeam1 ? m.score1 > m.score2 : m.score2 > m.score1;

    if (!partnerMap[partner]) partnerMap[partner] = { wins: 0, total: 0 };
    partnerMap[partner].total++;
    if (won) partnerMap[partner].wins++;
  }
  return Object.entries(partnerMap)
    .map(([name, s]) => ({
      name,
      wins: s.wins,
      total: s.total,
      winRate: Math.round((s.wins / s.total) * 100),
    }))
    .sort((a, b) => b.winRate - a.winRate);
}

function MatchCard({ match }: { match: Match }) {
  const inTeam1 = match.team1.includes(MY_NAME);
  const myTeam = inTeam1 ? match.team1 : match.team2;
  const oppTeam = inTeam1 ? match.team2 : match.team1;
  const myScore = inTeam1 ? match.score1 : match.score2;
  const oppScore = inTeam1 ? match.score2 : match.score1;
  const won = myScore > oppScore;

  return (
    <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-gray-500">
          {format(new Date(match.date), "M月d日(E)", { locale: ja })}
        </span>
        <span
          className={`text-xs font-bold px-2 py-0.5 rounded-full ${
            won
              ? "bg-green-500/20 text-green-400"
              : "bg-red-500/20 text-red-400"
          }`}
        >
          {won ? "WIN" : "LOSE"}
        </span>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex-1 text-sm">
          <div className="font-semibold text-white">{myTeam.join(" & ")}</div>
          <div className="text-gray-500 text-xs mt-0.5">vs {oppTeam.join(" & ")}</div>
        </div>
        <div className="text-right">
          <span className={`text-2xl font-bold ${won ? "text-green-400" : "text-red-400"}`}>
            {myScore}
          </span>
          <span className="text-gray-600 mx-1">-</span>
          <span className="text-xl font-semibold text-gray-400">{oppScore}</span>
        </div>
      </div>
    </div>
  );
}

export default async function HomePage() {
  let matches: Match[] = [];
  try {
    matches = await getMatches();
  } catch {
    // 初回など接続失敗時は空配列
  }

  const sorted = [...matches].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  const stats = calcStats(matches);
  const partnerStats = calcPartnerStats(matches);
  const recent = sorted.slice(0, 5);

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div>
        <h1 className="text-2xl font-bold text-white">
          こんにちは、<span className="text-green-400">{MY_NAME}</span> さん 👋
        </h1>
        <p className="text-gray-500 text-sm mt-1">あなたの戦績をチェックしよう</p>
      </div>

      {/* 勝率ビッグカード */}
      <div className="bg-gradient-to-br from-green-900/40 to-gray-900 rounded-2xl p-6 border border-green-800/30">
        <p className="text-gray-400 text-sm mb-1">通算勝率</p>
        <div className="flex items-end gap-3">
          <span className="text-6xl font-black text-green-400">{stats.winRate}%</span>
          <span className="text-gray-500 mb-2 text-sm">{stats.total}試合</span>
        </div>
        <div className="flex gap-4 mt-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-400">{stats.wins}</div>
            <div className="text-xs text-gray-500">勝ち</div>
          </div>
          <div className="text-gray-700">|</div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-400">{stats.losses}</div>
            <div className="text-xs text-gray-500">負け</div>
          </div>
        </div>
        {/* 勝率バー */}
        {stats.total > 0 && (
          <div className="mt-4 h-2 bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500 rounded-full transition-all"
              style={{ width: `${stats.winRate}%` }}
            />
          </div>
        )}
      </div>

      {/* クイックアクション */}
      <Link
        href="/matches/new"
        className="block w-full text-center bg-green-500 hover:bg-green-400 text-black font-bold py-4 rounded-xl transition-colors text-lg"
      >
        🏸 試合結果を記録する
      </Link>

      {/* パートナー別勝率 */}
      {partnerStats.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
            パートナー別
          </h2>
          <div className="space-y-2">
            {partnerStats.map((p) => (
              <div
                key={p.name}
                className="bg-gray-900 rounded-xl px-4 py-3 border border-gray-800 flex items-center justify-between"
              >
                <div>
                  <span className="font-semibold text-white">{p.name}</span>
                  <span className="text-gray-500 text-xs ml-2">{p.total}試合</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">
                    {p.wins}勝{p.total - p.wins}敗
                  </span>
                  <span
                    className={`font-bold text-sm ${
                      p.winRate >= 50 ? "text-green-400" : "text-red-400"
                    }`}
                  >
                    {p.winRate}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 直近の試合 */}
      {recent.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
              最近の試合
            </h2>
            <Link href="/matches" className="text-xs text-green-400 hover:text-green-300">
              すべて見る →
            </Link>
          </div>
          <div className="space-y-2">
            {recent.map((m) => (
              <MatchCard key={m.id} match={m} />
            ))}
          </div>
        </div>
      )}

      {matches.length === 0 && (
        <div className="text-center py-12 text-gray-600">
          <div className="text-4xl mb-3">🏸</div>
          <p>まだ試合が記録されていません</p>
          <p className="text-sm mt-1">最初の試合を記録しよう！</p>
        </div>
      )}
    </div>
  );
}
