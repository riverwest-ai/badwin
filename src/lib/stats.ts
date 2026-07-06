import { Match } from "./types";

export const MY_NAME = "ぎんじ";

export type MyMatch = {
  id: string;
  date: string;
  createdAt: string;
  myScore: number;
  oppScore: number;
  margin: number;
  won: boolean;
  hasOpponents: boolean;
  partner: string | null;
};

// 自分が含まれる試合だけを時系列(古い順)で返す
export function toMyMatches(matches: Match[]): MyMatch[] {
  return matches
    .filter((m) => m.team1.includes(MY_NAME) || m.team2.includes(MY_NAME))
    .map((m) => {
      const inTeam1 = m.team1.includes(MY_NAME);
      const myTeam = inTeam1 ? m.team1 : m.team2;
      const oppTeam = inTeam1 ? m.team2 : m.team1;
      const myScore = inTeam1 ? m.score1 : m.score2;
      const oppScore = inTeam1 ? m.score2 : m.score1;
      return {
        id: m.id,
        date: m.date,
        createdAt: m.createdAt ?? "",
        myScore,
        oppScore,
        margin: myScore - oppScore,
        won: myScore > oppScore,
        hasOpponents: oppTeam.length > 0,
        partner: myTeam.find((p) => p !== MY_NAME) ?? null,
      };
    })
    .sort((a, b) =>
      a.date !== b.date
        ? a.date.localeCompare(b.date)
        : a.createdAt.localeCompare(b.createdAt)
    );
}

// --- フォームスコア ---
// 勝敗と点差で毎試合変動する1人レーティング。
// 点差を±15にキャップして4倍(1試合あたり±60が上限)。

export const FORM_START = 1000;

export type FormScorePoint = {
  n: number; // 通算何試合目か(1始まり)
  date: string;
  score: number;
  delta: number;
  won: boolean;
};

export function calcFormScore(myMatches: MyMatch[]): FormScorePoint[] {
  let score = FORM_START;
  return myMatches.map((m, i) => {
    const capped = Math.max(-15, Math.min(15, m.margin));
    const delta = capped * 4;
    score += delta;
    return { n: i + 1, date: m.date, score, delta, won: m.won };
  });
}

// --- 直近フォーム ---

export function calcRecentForm(myMatches: MyMatch[], n = 10) {
  const recent = myMatches.slice(-n);
  const wins = recent.filter((m) => m.won).length;
  return {
    games: recent.length,
    wins,
    losses: recent.length - wins,
    winRate: recent.length > 0 ? Math.round((wins / recent.length) * 100) : 0,
  };
}

// --- ストリーク ---

export function calcStreaks(myMatches: MyMatch[]) {
  let bestWin = 0;
  let run = 0;
  for (const m of myMatches) {
    run = m.won ? run + 1 : 0;
    if (run > bestWin) bestWin = run;
  }
  let currentLen = 0;
  const last = myMatches.at(-1);
  if (last) {
    for (let i = myMatches.length - 1; i >= 0; i--) {
      if (myMatches[i].won === last.won) currentLen++;
      else break;
    }
  }
  return {
    current: currentLen,
    currentType: (last?.won ? "win" : "loss") as "win" | "loss",
    bestWin,
  };
}

// --- 点差分析 ---

export function calcMarginStats(myMatches: MyMatch[]) {
  const total = myMatches.length;
  const sumFor = myMatches.reduce((s, m) => s + m.myScore, 0);
  const sumAgainst = myMatches.reduce((s, m) => s + m.oppScore, 0);
  const close = myMatches.filter((m) => Math.abs(m.margin) <= 2);
  const closeWins = close.filter((m) => m.won).length;
  const deuce = myMatches.filter((m) => m.myScore >= 20 && m.oppScore >= 20);
  const deuceWins = deuce.filter((m) => m.won).length;
  const shutoutWins = myMatches.filter((m) => m.won && m.oppScore <= 10).length;
  const round1 = (v: number) => Math.round(v * 10) / 10;
  return {
    total,
    avgFor: total > 0 ? round1(sumFor / total) : 0,
    avgAgainst: total > 0 ? round1(sumAgainst / total) : 0,
    avgMargin: total > 0 ? round1((sumFor - sumAgainst) / total) : 0,
    close: {
      count: close.length,
      wins: closeWins,
      winRate: close.length > 0 ? Math.round((closeWins / close.length) * 100) : 0,
    },
    deuce: {
      count: deuce.length,
      wins: deuceWins,
      winRate: deuce.length > 0 ? Math.round((deuceWins / deuce.length) * 100) : 0,
    },
    shutoutWins,
  };
}

// --- 点差分布 ---

export type MarginBucket = {
  label: string;
  count: number;
  side: "win" | "loss";
};

const BUCKET_EDGES: { label: string; min: number; max: number }[] = [
  { label: "11点差以上", min: 11, max: 99 },
  { label: "6〜10点差", min: 6, max: 10 },
  { label: "3〜5点差", min: 3, max: 5 },
  { label: "1〜2点差", min: 1, max: 2 },
];

export function calcMarginBuckets(myMatches: MyMatch[]): MarginBucket[] {
  const winBuckets: MarginBucket[] = BUCKET_EDGES.map((b) => ({
    label: b.label,
    side: "win",
    count: myMatches.filter((m) => m.margin >= b.min && m.margin <= b.max).length,
  }));
  const lossBuckets: MarginBucket[] = [...BUCKET_EDGES].reverse().map((b) => ({
    label: b.label,
    side: "loss",
    count: myMatches.filter((m) => -m.margin >= b.min && -m.margin <= b.max).length,
  }));
  return [...winBuckets, ...lossBuckets];
}

// --- 実績 ---

export type Achievement = {
  id: string;
  icon: string;
  title: string;
  desc: string;
  earned: boolean;
  earnedDate?: string;
  current: number;
  target: number;
};

type Counter = {
  id: string;
  icon: string;
  title: string;
  desc: string;
  target: number;
  // 各試合を処理して現在の累計値を返す
  step: (m: MyMatch, prev: number) => number;
};

const COUNTERS: Counter[] = [
  { id: "first-win", icon: "🏸", title: "初勝利", desc: "はじめて試合に勝つ", target: 1, step: (m, p) => p + (m.won ? 1 : 0) },
  { id: "wins-50", icon: "💪", title: "50勝", desc: "通算50勝を達成する", target: 50, step: (m, p) => p + (m.won ? 1 : 0) },
  { id: "wins-100", icon: "👑", title: "100勝", desc: "通算100勝を達成する", target: 100, step: (m, p) => p + (m.won ? 1 : 0) },
  { id: "wins-200", icon: "🏆", title: "200勝", desc: "通算200勝を達成する", target: 200, step: (m, p) => p + (m.won ? 1 : 0) },
  { id: "games-100", icon: "🏃", title: "100試合", desc: "通算100試合に出場する", target: 100, step: (_, p) => p + 1 },
  { id: "games-300", icon: "⛰️", title: "300試合", desc: "通算300試合に出場する", target: 300, step: (_, p) => p + 1 },
  { id: "shutout", icon: "✋", title: "完封級", desc: "相手を10点以下に抑えて勝つ", target: 1, step: (m, p) => p + (m.won && m.oppScore <= 10 ? 1 : 0) },
  { id: "close-10", icon: "🎯", title: "接戦ハンター", desc: "2点差以内の勝利を10回", target: 10, step: (m, p) => p + (m.won && m.margin <= 2 ? 1 : 0) },
  { id: "deuce-5", icon: "🧊", title: "デュース職人", desc: "デュース(20-20以降)の勝利を5回", target: 5, step: (m, p) => p + (m.won && m.myScore >= 20 && m.oppScore >= 20 ? 1 : 0) },
];

const STREAK_TARGETS = [
  { id: "streak-3", icon: "🔥", title: "3連勝", desc: "3連勝を達成する", target: 3 },
  { id: "streak-5", icon: "⚡", title: "5連勝", desc: "5連勝を達成する", target: 5 },
  { id: "streak-10", icon: "🌪️", title: "10連勝", desc: "10連勝を達成する", target: 10 },
];

export function calcAchievements(myMatches: MyMatch[]): Achievement[] {
  const results: Achievement[] = [];

  for (const c of COUNTERS) {
    let value = 0;
    let earnedDate: string | undefined;
    for (const m of myMatches) {
      value = c.step(m, value);
      if (value >= c.target && !earnedDate) earnedDate = m.date;
    }
    results.push({
      id: c.id,
      icon: c.icon,
      title: c.title,
      desc: c.desc,
      earned: value >= c.target,
      earnedDate,
      current: Math.min(value, c.target),
      target: c.target,
    });
  }

  let run = 0;
  let bestWin = 0;
  const streakDates: Record<number, string> = {};
  for (const m of myMatches) {
    run = m.won ? run + 1 : 0;
    if (run > bestWin) bestWin = run;
    for (const s of STREAK_TARGETS) {
      if (run === s.target && !streakDates[s.target]) streakDates[s.target] = m.date;
    }
  }
  for (const s of STREAK_TARGETS) {
    results.push({
      id: s.id,
      icon: s.icon,
      title: s.title,
      desc: s.desc,
      earned: bestWin >= s.target,
      earnedDate: streakDates[s.target],
      current: Math.min(bestWin, s.target),
      target: s.target,
    });
  }

  return results.sort((a, b) => Number(b.earned) - Number(a.earned));
}
