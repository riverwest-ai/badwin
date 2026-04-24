
import { Suspense } from "react";
import { getMatches } from "@/lib/sheets";
import { Match } from "@/lib/types";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import Link from "next/link";
import { ListSkeleton } from "@/components/Skeleton";

const MY_NAME = "ぎんじ";

type Session = {
  date: string;
  matches: Match[];
  myWins: number;
  myLosses: number;
  totalMatches: number;
};

function groupByDate(matches: Match[]): Session[] {
  const map: Record<string, Match[]> = {};
  for (const m of matches) {
    if (!map[m.date]) map[m.date] = [];
    map[m.date].push(m);
  }
  return Object.entries(map)
    .map(([date, ms]) => {
      const myMatches = ms.filter((m) => m.team1.includes(MY_NAME) || m.team2.includes(MY_NAME));
      const myWins = myMatches.filter((m) => m.team1.includes(MY_NAME) ? m.score1 > m.score2 : m.score2 > m.score1).length;
      return { date, matches: ms, myWins, myLosses: myMatches.length - myWins, totalMatches: ms.length };
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
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
          <div>
            <div className="font-semibold text-white">
              {format(new Date(session.date), "yyyy年M月d日(E)", { locale: ja })}
            </div>
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
  try {
    matches = await getMatches();
  } catch {
    // 接続失敗時は空
  }
  const sessions = groupByDate(matches);

  if (sessions.length === 0) {
    return (
      <div className="text-center py-16 text-gray-600">
        <div className="text-4xl mb-3">📅</div>
        <p>まだ練習データがありません</p>
      </div>
    );
  }
  return (
    <div className="space-y-3">
      {sessions.map((s) => <SessionCard key={s.date} session={s} />)}
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
