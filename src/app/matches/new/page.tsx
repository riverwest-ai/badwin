"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Member } from "@/lib/types";
import { format } from "date-fns";

const MY_NAME = "ぎんじ";

export default function NewMatchPage() {
  const router = useRouter();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const today = format(new Date(), "yyyy-MM-dd");
  const [date, setDate] = useState(today);
  const [team1p2, setTeam1p2] = useState("");
  const [team2p1, setTeam2p1] = useState("");
  const [team2p2, setTeam2p2] = useState("");
  const [score1, setScore1] = useState("");
  const [score2, setScore2] = useState("");

  useEffect(() => {
    fetch("/api/members")
      .then((r) => r.json())
      .then(setMembers)
      .catch(() => setError("メンバーの取得に失敗しました"));
  }, []);

  const otherMembers = members.filter((m) => m.name !== MY_NAME);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!team1p2 || !team2p1 || !team2p2) {
      setError("全員選択してください");
      return;
    }
    if (team1p2 === team2p1 || team1p2 === team2p2 || team2p1 === team2p2) {
      setError("同じプレイヤーを重複して選択できません");
      return;
    }
    if (!score1 || !score2) {
      setError("スコアを入力してください");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/matches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date,
          team1: [MY_NAME, team1p2],
          team2: [team2p1, team2p2],
          score1: Number(score1),
          score2: Number(score2),
        }),
      });
      if (!res.ok) throw new Error();
      router.push("/");
      router.refresh();
    } catch {
      setError("保存に失敗しました。もう一度試してください。");
    } finally {
      setLoading(false);
    }
  }

  const SelectField = ({
    label,
    value,
    onChange,
    exclude = [],
    disabled = false,
  }: {
    label: string;
    value: string;
    onChange: (v: string) => void;
    exclude?: string[];
    disabled?: boolean;
  }) => (
    <div className="flex-1">
      <label className="block text-xs text-gray-500 mb-1">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-green-500 disabled:opacity-50"
      >
        <option value="">選択...</option>
        {(disabled
          ? [{ id: MY_NAME, name: MY_NAME }]
          : otherMembers.filter((m) => !exclude.includes(m.name))
        ).map((m) => (
          <option key={m.id} value={m.name}>
            {m.name}
          </option>
        ))}
      </select>
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">試合を記録する</h1>
        <p className="text-gray-500 text-sm mt-1">今日の戦績を残そう</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* 日付 */}
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">日付</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-green-500"
          />
        </div>

        {/* チーム1 */}
        <div className="bg-gray-900 rounded-xl p-4 border border-green-800/40">
          <div className="text-xs font-semibold text-green-400 uppercase tracking-wider mb-3">
            あなたのチーム
          </div>
          <div className="flex gap-3">
            <SelectField label="プレイヤー1（あなた）" value={MY_NAME} onChange={() => {}} disabled exclude={[]} />
            <SelectField
              label="パートナー"
              value={team1p2}
              onChange={setTeam1p2}
              exclude={[team2p1, team2p2]}
            />
          </div>
        </div>

        {/* vs */}
        <div className="text-center text-gray-600 font-bold text-sm">VS</div>

        {/* チーム2 */}
        <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
            相手チーム
          </div>
          <div className="flex gap-3">
            <SelectField
              label="プレイヤー3"
              value={team2p1}
              onChange={setTeam2p1}
              exclude={[team1p2, team2p2]}
            />
            <SelectField
              label="プレイヤー4"
              value={team2p2}
              onChange={setTeam2p2}
              exclude={[team1p2, team2p1]}
            />
          </div>
        </div>

        {/* スコア */}
        <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
            スコア
          </div>
          <div className="flex items-center gap-4">
            <div className="flex-1 text-center">
              <label className="block text-xs text-green-400 mb-1">あなたのチーム</label>
              <input
                type="number"
                min="0"
                max="99"
                value={score1}
                onChange={(e) => setScore1(e.target.value)}
                placeholder="21"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-3 text-white text-center text-2xl font-bold focus:outline-none focus:border-green-500"
              />
            </div>
            <span className="text-gray-600 text-xl font-bold">-</span>
            <div className="flex-1 text-center">
              <label className="block text-xs text-gray-400 mb-1">相手チーム</label>
              <input
                type="number"
                min="0"
                max="99"
                value={score2}
                onChange={(e) => setScore2(e.target.value)}
                placeholder="15"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-3 text-white text-center text-2xl font-bold focus:outline-none focus:border-green-500"
              />
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 text-red-400 text-sm">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-green-500 hover:bg-green-400 disabled:opacity-50 text-black font-bold py-4 rounded-xl transition-colors text-lg"
        >
          {loading ? "保存中..." : "記録する"}
        </button>
      </form>
    </div>
  );
}
