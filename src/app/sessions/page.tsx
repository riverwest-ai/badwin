
import { Suspense } from "react";
import { getMatches, getSessionNames } from "@/lib/sheets";
import { Match } from "@/lib/types";
import { format, getDay } from "date-fns";
import { ja } from "date-fns/locale";
import Link from "next/link";
import { ListSkeleton } from "@/components/Skeleton";

const MY_NAME = "ぎんじ";
const DAY_NAMES = ["日", "月", "火", "水", "木", "金", "土"];

type Session = {
  date: string;
  matches: Match[];
  myWins: number;
  myLosses: number;
  totalMatches: number;
  name: string;
};

type DayStats = {
  day: number;
  wins: number;
  losses: number;
  sessions: number;
};

function groupByDate(matches: Match[], sessionNames: Record<string, string>): Session[] {
  const map: Record<string, Match[]> = {};
  for (const m of matches) {
    if (!map[m.date]) map[m.date] = [];
    map[m.date].push(m);
  }
  return Object.entries(map)
    .map(([date, ms]) => {
      const myMatches = ms.filter((m) => m.team1.includes(MY_NAME) || m.team2.includes(MY_NAME));
      const myWins = myMatches.filter((m) => m.team1.includes(MY_NAME) ? m.score1 > m.score2 : m.score2 > m.score1).length;
      return { date, matches: ms, myWins, myLosses: myMatches.length - myWins, totalMatches: ms.length, name: sessionNames[date] ?? "" };
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

function calcDayStats(sessions: Session[]): DayStats[] {
  const map: Record<number, DayStats> = {};
  for (const s of sessions) {
    if (s.myWins + s.myLosses === 0) continue;
    const day = getDay(new Date(s.date));
    if (!map[day]) map[day] = { day, wins: 0, losses: 0, sessions: 0 };
    map[day].wins += s.myWins;
    map[day].losses += s.myLosses;
    map[day].sessions += 1;
  }
  return Object.values(map).sort((a, b) => a.day - b.day);
}

function DayStatsSection({ dayStats }: { dayStats: DayStats[] }) {
  if (dayStats.length === 0) return null;
  return (
    <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
      <div className="px-4 py-2.5 border-b border-gray-800">
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">曜日別（サークル別）勝率</span>
      </div>
      <div className="divide-y divide-gray-800">
        {dayStats.map((s) => {
          const total = s.wins + s.losses;
          const winRate = Math.round((s.wins / total) * 100);
          return (
            <div key={s.day} className="flex items-center gap-4 px-4 py-3">
              <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center font-bold text-gray-200 shrink-0">
                {DAY_NAMES[s.day]}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-white">{DAY_NAMES[s.day]}曜日</div>
                <div className="text-xs text-gray-500 mt-0.5">{s.sessions}回 · {s.wins}勝{s.losses}敗</div>
              </div>
              <div className="flex items-center gap-2 w-24 shrink-0">
                <div className="flex-1 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${winRate >= 60 ? "bg-green-500" : winRate >= 40 ? "bg-yellow-500" : "bg-red-500"}`}
                    style={{ width: `${winRate}%` }}
                  />
                </div>
                <span className={`text-sm font-bold w-10 text-right ${winRate >= 60 ? "text-green-400" : winRate >= 40 ? "text-yellow-400" : "text-red-400"}`}>
                  {winRate}%
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SessionCard({ session }: { session: Session }) {
  const total = session.myWins + session.myLosses;
  const winRate = total > 0 ? Math.round((session.myWins / total) * 100) : null;
  const players = new Set<string>();
  for (const m of session.matches) {
    m.team1.forEach((p) => players.add(p));
    m.team2.forEach((p) => players.add(p));
  }
  return (
    <Link href={`/sessions/${session.date}`}>
      <div className="bg-gray-900 rounded-xl p-4 border border-gray-800 hover:border-gray-600 transition-colors">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-white">
              {format(new Date(session.date), "yyyy年M月d日(E)", { locale: ja })}
            </div>
            {session.name && (
              <div className="text-sm text-gray-400 mt-0.5">{session.name}</div>
            )}
            <div className="text-xs text-gray-500 mt-1">{session.totalMatches}試合 · 参加{players.size}名</div>
            <div className="flex flex-wrap gap-1 mt-2">
              {[...players].map((p) => (
                <span key={p} className={`text-xs px-2 py-0.5 rounded-full ${p === MY_NAME ? "bg-green-500/20 text-green-400" : "bg-gray-800 text-gray-400"}`}>
                  {p}
                </span>
              ))}
            </div>
          </div>
          {winRate !== null && (
            <div className="text-right ml-4 shrink-0">
              <div className={`text-2xl font-black ${winRate >= 50 ? "text-green-400" : "text-red-400"}`}>{winRate}%</div>
              <div className="text-xs text-gray-500 mt-0.5">{session.myWins}勝{session.myLosses}敗</div>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}

async function SessionList() {
  let matches: Match[] = [];
  let sessionNames: Record<string, string> = {};
  try {
    [matches, sessionNames] = await Promise.all([getMatches(), getSessionNames()]);
  } catch {
    // 接続失敗時は空
  }
  const sessions = groupByDate(matches, sessionNames);
  const dayStats = calcDayStats(sessions);

  if (sessions.length === 0) {
    return (
      <div className="text-center py-16 text-gray-600">
        <div className="text-4xl mb-3">📅</div>
        <p>まだ練習データがありません</p>
      </div>
    );
  }
  return (
    <div className="space-y-4">
      <DayStatsSection dayStats={dayStats} />
      <div className="space-y-3">
        {sessions.map((s) => <SessionCard key={s.date} session={s} />)}
      </div>
    </div>
  );
}

export default function SessionsPage() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-white">練習セッション</h1>
        <p className="text-gray-500 text-sm mt-1">日付ごとの練習履歴</p>
      </div>
      <Suspense fallback={<ListSkeleton count={3} />}>
        <SessionList />
      </Suspense>
    </div>
  );
}
