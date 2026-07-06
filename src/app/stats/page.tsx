import { Suspense } from "react";
import { getMatches } from "@/lib/sheets";
import { Match } from "@/lib/types";
import {
  toMyMatches,
  calcFormScore,
  calcRecentForm,
  calcStreaks,
  calcMarginStats,
  calcMarginBuckets,
  calcAchievements,
  FORM_START,
} from "@/lib/stats";
import FormScoreChart from "@/components/FormScoreChart";
import { StatsSkeleton, ListSkeleton } from "@/components/Skeleton";
import { format } from "date-fns";
import { ja } from "date-fns/locale";

function Tile({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-gray-900 rounded-xl px-4 py-3 border border-gray-800">
      <div className="text-xs text-gray-500">{label}</div>
      <div className="text-xl font-bold text-white mt-1">{value}</div>
      {sub && <div className="text-xs text-gray-500 mt-0.5">{sub}</div>}
    </div>
  );
}

async function StatsContent() {
  let matches: Match[] = [];
  try {
    matches = await getMatches();
  } catch {
    // 接続失敗時は空配列
  }

  const my = toMyMatches(matches);

  if (my.length === 0) {
    return (
      <div className="text-center py-16 text-gray-600">
        <div className="text-4xl mb-3">📊</div>
        <p>まだ試合データがありません</p>
        <p className="text-sm mt-1">試合を記録すると分析が表示されます</p>
      </div>
    );
  }

  const form = calcFormScore(my);
  const current = form.at(-1)!;
  const best = form.reduce((a, b) => (b.score > a.score ? b : a));
  const recent10 = calcRecentForm(my, 10);
  const streaks = calcStreaks(my);
  const margin = calcMarginStats(my);
  const buckets = calcMarginBuckets(my);
  const maxBucket = Math.max(...buckets.map((b) => b.count), 1);
  const achievements = calcAchievements(my);
  const earnedCount = achievements.filter((a) => a.earned).length;

  return (
    <>
      {/* フォームスコア */}
      <div className="bg-gradient-to-br from-green-900/40 to-gray-900 rounded-2xl p-5 border border-green-800/30">
        <div className="flex items-end justify-between mb-1">
          <div>
            <p className="text-gray-400 text-sm">フォームスコア</p>
            <div className="flex items-end gap-3">
              <span className="text-5xl font-black text-green-400">{current.score}</span>
              <span className={`mb-1.5 text-sm font-bold ${current.won ? "text-green-400" : "text-red-400"}`}>
                前試合 {current.delta >= 0 ? "+" : ""}{current.delta} {current.won ? "WIN" : "LOSE"}
              </span>
            </div>
          </div>
          <div className="text-right text-xs text-gray-500 mb-1 shrink-0">
            <div className="whitespace-nowrap">自己ベスト {best.score}</div>
            <div className="mt-0.5 whitespace-nowrap">開始値 {FORM_START} · {my.length}試合</div>
          </div>
        </div>
        <FormScoreChart points={form} />
        <p className="text-xs text-gray-600 mt-1">勝敗と点差の割合で毎試合変動します(完封で±60。15点/21点マッチどちらも公平)</p>
      </div>

      {/* フォームタイル */}
      <div className="grid grid-cols-3 gap-2">
        <Tile
          label="直近10試合"
          value={`${recent10.winRate}%`}
          sub={`${recent10.wins}勝${recent10.losses}敗`}
        />
        <Tile
          label={streaks.currentType === "win" ? "連勝中" : "連敗中"}
          value={`${streaks.current}${streaks.currentType === "win" ? "連勝" : "連敗"}`}
          sub={streaks.currentType === "win" ? "この調子!" : "切り替えよう"}
        />
        <Tile label="自己ベスト連勝" value={`${streaks.bestWin}連勝`} />
      </div>

      {/* 点差分析 */}
      <div>
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">点差分析</h2>
        {margin.byFormat.map((f) => (
          <div key={f.format} className="mb-2">
            <div className="text-xs text-gray-600 mb-1">{f.format}点マッチ({f.count}試合)</div>
            <div className="grid grid-cols-3 gap-2">
              <Tile label="平均得点" value={f.avgFor.toFixed(1)} />
              <Tile label="平均失点" value={f.avgAgainst.toFixed(1)} />
              <Tile label="平均点差" value={`${f.avgMargin >= 0 ? "+" : ""}${f.avgMargin.toFixed(1)}`} />
            </div>
          </div>
        ))}
        <div className="grid grid-cols-3 gap-2">
          <Tile
            label="接戦勝率"
            value={`${margin.close.winRate}%`}
            sub={`2点差以内 ${margin.close.wins}勝${margin.close.count - margin.close.wins}敗`}
          />
          <Tile
            label="デュース"
            value={margin.deuce.count > 0 ? `${margin.deuce.winRate}%` : "—"}
            sub={margin.deuce.count > 0 ? `${margin.deuce.wins}勝${margin.deuce.count - margin.deuce.wins}敗` : "まだなし"}
          />
          <Tile label="完封級の勝利" value={`${margin.shutoutWins}回`} sub="相手を大差で圧倒" />
        </div>
      </div>

      {/* 点差分布 */}
      <div>
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">点差の分布</h2>
        <div className="bg-gray-900 rounded-xl p-4 border border-gray-800 space-y-1.5">
          {buckets.map((b, i) => (
            <div
              key={`${b.side}-${b.label}`}
              className={`flex items-center gap-2 text-xs ${i === 4 ? "border-t border-gray-800 pt-1.5" : ""}`}
            >
              <span className="w-24 shrink-0 text-gray-500 text-right whitespace-nowrap">
                {b.side === "win" ? "勝ち" : "負け"} {b.label}
              </span>
              <div className="flex-1 h-4 flex items-center">
                <div
                  className={`h-4 rounded-r ${b.side === "win" ? "bg-green-500" : "bg-red-500"}`}
                  style={{ width: `${(b.count / maxBucket) * 100}%`, minWidth: b.count > 0 ? "4px" : "0" }}
                />
                <span className="ml-2 text-gray-400 font-semibold">{b.count}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 実績 */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">実績</h2>
          <span className="text-xs text-gray-500">{earnedCount} / {achievements.length} 解除</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {achievements.map((a) => (
            <div
              key={a.id}
              className={`rounded-xl p-3 border ${
                a.earned
                  ? "bg-green-900/20 border-green-800/40"
                  : "bg-gray-900/60 border-gray-800"
              }`}
            >
              <div className="flex items-center gap-2">
                <span className={`text-2xl ${a.earned ? "" : "grayscale opacity-40"}`}>{a.icon}</span>
                <div className="min-w-0">
                  <div className={`text-sm font-bold truncate ${a.earned ? "text-white" : "text-gray-500"}`}>
                    {a.title}
                  </div>
                  <div className="text-xs text-gray-600 truncate">{a.desc}</div>
                </div>
              </div>
              {a.earned && a.earnedDate ? (
                <div className="text-xs text-green-500/80 mt-2">
                  ✓ {format(new Date(a.earnedDate), "yyyy年M月d日", { locale: ja })} 達成
                </div>
              ) : (
                <div className="mt-2">
                  <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gray-600 rounded-full"
                      style={{ width: `${Math.round((a.current / a.target) * 100)}%` }}
                    />
                  </div>
                  <div className="text-xs text-gray-600 mt-1 text-right">
                    {a.current} / {a.target}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

export default function StatsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">分析</h1>
        <p className="text-gray-500 text-sm mt-1">フォームスコアと点差から調子を読む</p>
      </div>
      <Suspense fallback={<><StatsSkeleton /><ListSkeleton count={3} /></>}>
        <StatsContent />
      </Suspense>
    </div>
  );
}
