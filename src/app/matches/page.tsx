
import { Suspense } from "react";
import { getMatches } from "@/lib/sheets";
import { Match } from "@/lib/types";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import Link from "next/link";
import DeleteMatchButton from "./DeleteMatchButton";
import { ListSkeleton } from "@/components/Skeleton";

const MY_NAME = "ぎんじ";

function MatchRow({ match }: { match: Match }) {
  const inTeam1 = match.team1.includes(MY_NAME);
  const myTeam = inTeam1 ? match.team1 : match.team2;
  const oppTeam = inTeam1 ? match.team2 : match.team1;
  const myScore = inTeam1 ? match.score1 : match.score2;
  const oppScore = inTeam1 ? match.score2 : match.score1;
  const won = myScore > oppScore;

  return (
    <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs text-gray-500">
              {format(new Date(match.date), "yyyy年M月d日(E)", { locale: ja })}
            </span>
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${won ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>
              {won ? "WIN" : "LOSE"}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex-1 space-y-1">
              <div className="text-sm font-semibold text-white">{myTeam.join(" & ")}</div>
              <div className="text-xs text-gray-500">vs {oppTeam.join(" & ")}</div>
            </div>
            <div className="text-right">
              <span className={`text-xl font-bold ${won ? "text-green-400" : "text-red-400"}`}>{myScore}</span>
              <span className="text-gray-600 mx-1">-</span>
              <span className="text-lg font-semibold text-gray-400">{oppScore}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1 ml-2 shrink-0">
          <Link
            href={`/matches/${match.id}/edit`}
            className="p-2 rounded-lg text-gray-500 hover:text-gray-300 hover:bg-gray-800 transition-colors"
            title="編集"
          >
            ✏️
          </Link>
          <DeleteMatchButton matchId={match.id} />
        </div>
      </div>
    </div>
  );
}

async function MatchList() {
  let matches: Match[] = [];
  try {
    matches = await getMatches();
  } catch {
    // 接続失敗時は空
  }
  const sorted = [...matches].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  if (sorted.length === 0) {
    return (
      <div className="text-center py-16 text-gray-600">
        <div className="text-4xl mb-3">🏸</div>
        <p>まだ試合が記録されていません</p>
      </div>
    );
  }
  return (
    <div className="space-y-2">
      {sorted.map((m) => <MatchRow key={m.id} match={m} />)}
    </div>
  );
}

export default function MatchesPage() {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">試合履歴</h1>
        </div>
        <Link href="/matches/new" className="px-4 py-2 bg-green-500 hover:bg-green-400 text-black font-semibold rounded-lg text-sm transition-colors">
          + 記録
        </Link>
      </div>
      <Suspense fallback={<ListSkeleton count={5} />}>
        <MatchList />
      </Suspense>
    </div>
  );
}
