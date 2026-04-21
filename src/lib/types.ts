export type Member = {
  id: string;
  name: string;
};

export type Match = {
  id: string;
  date: string;
  team1: [string, string];
  team2: [string, string];
  score1: number;
  score2: number;
  createdAt: string;
};

export type MatchResult = "win" | "lose";

export type PlayerStats = {
  name: string;
  wins: number;
  losses: number;
  winRate: number;
};
