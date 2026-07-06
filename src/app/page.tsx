
import { Suspense } from "react";
import Link from "next/link";
import { getMatches } from "@/lib/sheets";
import { Match } from "@/lib/types";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { StatsSkeleton, ListSkeleton } from "@/components/Skeleton";
import { toMyMatches, calcFormScore, calcRecentForm, calcStreaks, FORM_START } from "@/lib/stats";

const MY_NAME = "ぎんじ";

function Sparkline({ values }: { values: number[] }) {
  if (values.length < 2) return null;
  const w = 120;
  const h = 36;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = Math.max(max - min, 1);
  const pts = values
    .map((v, i) => `${((i / (values.length - 1)) * w).toFixed(1)},${(h - 3 - ((v - min) / span) * (h - 6)).toFixed(1)}`)
    .join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-28 h-9" aria-hidden>
      <polyline points={pts} fill="none" stroke="#4ade80" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

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
      ? m.team1.find((p) => p !== MY_NAME)
      : m.team2.find((p) => p !== MY_NAME);
    if (!partner) continue;
    const won = inTeam1 ? m.score1 > m.score2 : m.score2 > m.score1;
    if (!partnerMap[partner]) partnerMap[partner] = { wins: 0, total: 0 };
    partnerMap[partner].total++;
    if (won) partnerMap[partner].wins++;
  }
  return Object.entries(partnerMap)
    .map(([name, s]) => ({ name, wins: s.wins, total: s.total, winRate: Math.round((s.wins / s.total) * 100) }))
    .sort((a, b) => b.winRate - a.winRate);
}

function calcOpponentStats(matches: Match[]) {
  const oppMap: Record<string, { wins: number; total: number }> = {};
  for (const m of matches) {
    const inTeam1 = m.team1.includes(MY_NAME);
    const inTeam2 = m.team2.includes(MY_NAME);
    if (!inTeam1 && !inTeam2) continue;
    const opponents = inTeam1 ? m.team2 : m.team1;
    if (opponents.length === 0) continue;
    const key = opponents.join(" & ");
    const won = inTeam1 ? m.score1 > m.score2 : m.score2 > m.score1;
    if (!oppMap[key]) oppMap[key] = { wins: 0, total: 0 };
    oppMap[key].total++;
    if (won) oppMap[key].wins++;
  }
  return Object.entries(oppMap)
    .map(([name, s]) => ({ name, wins: s.wins, total: s.total, winRate: Math.round((s.wins / s.total) * 100) }))
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
        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${won ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>
          {won ? "WIN" : "LOSE"}
        </span>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex-1 text-sm">
          <div className="font-semibold text-white">{myTeam.join(" & ")}</div>
          <div className="text-gray-500 text-xs mt-0.5">vs {oppTeam.join(" & ")}</div>
        </div>
        <div className="text-right">
          <span className={`text-2xl font-bold ${won ? "text-green-400" : "text-red-400"}`}>{myScore}</span>
          <span className="text-gray-600 mx-1">-</span>
          <span className="text-xl font-semibold text-gray-400">{oppScore}</span>
        </div>
      </div>
    </div>
  );
}

async function DashboardContent() {
  let matches: Match[] = [];
  try {
    matches = await getMatches();
  } catch {
    // 接続失敗時は空配列
  }

  const sorted = [...matches].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const stats = calcStats(matches);
  const partnerStats = calcPartnerStats(matches);
  const opponentStats = calcOpponentStats(matches);
  const recent = sorted.slice(0, 5);

  const my = toMyMatches(matches);
  const form = calcFormScore(my);
  const current = form.at(-1);
  const recent10 = calcRecentForm(my, 10);
  const streaks = calcStreaks(my);

  return (
    <>
      {/* フォームスコア ビッグカード */}
      <Link
        href="/stats"
        className="block bg-gradient-to-br from-green-900/40 to-gray-900 rounded-2xl p-6 border border-green-800/30 hover:border-green-700/50 transition-colors"
      >
        <div className="flex items-start justify-between">
          <div>
            <p className="text-gray-400 text-sm mb-1">フォームスコア</p>
            <div className="flex items-end gap-3">
              <span className="text-6xl font-black text-green-400">{current?.score ?? FORM_START}</span>
              {current && (
                <span className={`mb-2 text-sm font-bold ${current.won ? "text-green-400" : "text-red-400"}`}>
                  {current.delta >= 0 ? "+" : ""}{current.delta} {current.won ? "WIN" : "LOSE"}
                </span>
              )}
            </div>
          </div>
          <Sparkline values={form.slice(-20).map((p) => p.score)} />
        </div>
        <div className="flex items-center gap-2 mt-4 flex-wrap">
          <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-gray-800 text-gray-300">
            直近10試合 {recent10.winRate}%
          </span>
          {my.length > 0 && (
            <span
              className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                streaks.currentType === "win" ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
              }`}
            >
              {streaks.currentType === "win" ? "🔥 " : ""}{streaks.current}{streaks.currentType === "win" ? "連勝中" : "連敗中"}
            </span>
          )}
          <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-gray-800 text-gray-300">
            通算 {stats.winRate}% ({stats.wins}勝{stats.losses}敗)
          </span>
          <span className="ml-auto text-xs text-green-400">詳しい分析 →</span>
        </div>
      </Link>

      {/* パートナー別 */}
      {partnerStats.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">パートナー別</h2>
          <div className="space-y-2">
            {partnerStats.map((p) => (
              <div key={p.name} className="bg-gray-900 rounded-xl px-4 py-3 border border-gray-800 flex items-center justify-between">
                <div>
                  <span className="font-semibold text-white">{p.name}</span>
                  <span className="text-gray-500 text-xs ml-2">{p.total}試合</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">{p.wins}勝{p.total - p.wins}敗</span>
                  <span className={`font-bold text-sm ${p.winRate >= 50 ? "text-green-400" : "text-red-400"}`}>{p.winRate}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 対戦相手別 */}
      {opponentStats.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">対戦相手別</h2>
          <div className="space-y-2">
            {opponentStats.map((o) => (
              <div key={o.name} className="bg-gray-900 rounded-xl px-4 py-3 border border-gray-800 flex items-center justify-between">
                <div>
                  <span className="font-semibold text-white text-sm">vs {o.name}</span>
                  <span className="text-gray-500 text-xs ml-2">{o.total}試合</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">{o.wins}勝{o.total - o.wins}敗</span>
                  <span className={`font-bold text-sm ${o.winRate >= 50 ? "text-green-400" : "text-red-400"}`}>{o.winRate}%</span>
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
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">最近の試合</h2>
            <Link href="/matches" className="text-xs text-green-400 hover:text-green-300">すべて見る →</Link>
          </div>
          <div className="space-y-2">
            {recent.map((m) => <MatchCard key={m.id} match={m} />)}
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
    </>
  );
}

export default function HomePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">
          こんにちは、<span className="text-green-400">{MY_NAME}</span> さん 👋
        </h1>
        <p className="text-gray-500 text-sm mt-1">あなたの戦績をチェックしよう</p>
      </div>
      <Link
        href="/matches/new"
        className="block w-full text-center bg-green-500 hover:bg-green-400 text-black font-bold py-4 rounded-xl transition-colors text-lg"
      >
        🏸 試合結果を記録する
      </Link>
      <Suspense fallback={<><StatsSkeleton /><ListSkeleton count={2} /></>}>
        <DashboardContent />
      </Suspense>
    </div>
  );
}
