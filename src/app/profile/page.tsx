"use client";

import { useEffect, useState } from "react";
import { useLiff } from "@/components/LiffProvider";
import Image from "next/image";

type Member = { id: string; name: string };

export default function ProfilePage() {
  const { user, loading, isLiff, refresh } = useLiff();
  const [members, setMembers] = useState<Member[]>([]);
  const [selected, setSelected] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/members")
      .then((r) => r.json())
      .then(setMembers)
      .catch(() => {});
  }, []);

  async function handleLink() {
    if (!user || !selected) return;
    setSaving(true);
    try {
      await fetch("/api/line-users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lineUserId: user.lineUserId,
          memberName: selected,
          displayName: user.displayName,
        }),
      });
      refresh();
      setSaved(true);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-gray-500">読み込み中...</div>
      </div>
    );
  }

  if (!isLiff && !user) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">プロフィール</h1>
        </div>
        <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800 text-center space-y-4">
          <div className="text-4xl">📱</div>
          <p className="text-gray-300 font-semibold">LINEから開いてください</p>
          <p className="text-gray-500 text-sm">
            このページはLINEアプリ内から開くことでLINEアカウントと連携できます。
          </p>
          <div className="bg-gray-800 rounded-xl p-4 text-left">
            <p className="text-xs text-gray-400 mb-1">LINEで開くURL</p>
            <p className="text-green-400 text-sm font-mono break-all">
              https://liff.line.me/{process.env.NEXT_PUBLIC_LIFF_ID}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">プロフィール</h1>
        <p className="text-gray-500 text-sm mt-1">LINEアカウントとメンバーを紐付ける</p>
      </div>

      {/* LINEプロフィール */}
      {user && (
        <div className="bg-gray-900 rounded-2xl p-5 border border-gray-800 flex items-center gap-4">
          {user.pictureUrl && (
            <Image
              src={user.pictureUrl}
              alt={user.displayName}
              width={56}
              height={56}
              className="rounded-full"
            />
          )}
          <div>
            <div className="font-semibold text-white">{user.displayName}</div>
            <div className="text-xs text-green-400 mt-0.5">LINE連携済み</div>
          </div>
        </div>
      )}

      {/* メンバー紐付け */}
      {user?.memberName ? (
        <div className="bg-green-900/20 rounded-2xl p-5 border border-green-700/40 space-y-3">
          <div className="text-green-400 font-semibold">✓ メンバー紐付け完了</div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center font-bold text-gray-200">
              {user.memberName[0]}
            </div>
            <span className="text-white font-semibold">{user.memberName}</span>
          </div>
          <p className="text-gray-500 text-sm">別のメンバー名に変更することもできます。</p>
          <select
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-green-500"
          >
            <option value="">変更する場合は選択...</option>
            {members.map((m) => (
              <option key={m.id} value={m.name}>{m.name}</option>
            ))}
          </select>
          {selected && (
            <button
              onClick={handleLink}
              disabled={saving}
              className="w-full bg-green-500 hover:bg-green-400 disabled:opacity-50 text-black font-bold py-3 rounded-xl transition-colors"
            >
              {saving ? "変更中..." : `${selected} に変更する`}
            </button>
          )}
        </div>
      ) : (
        <div className="bg-gray-900 rounded-2xl p-5 border border-gray-800 space-y-4">
          <div>
            <p className="text-white font-semibold mb-1">あなたのメンバー名を選択</p>
            <p className="text-gray-500 text-sm">選択すると戦績が自動で表示されます</p>
          </div>
          {saved ? (
            <div className="text-center py-4">
              <div className="text-3xl mb-2">🎉</div>
              <p className="text-green-400 font-semibold">紐付け完了！</p>
              <p className="text-gray-500 text-sm mt-1">ホームに戻って戦績を確認してください</p>
            </div>
          ) : (
            <>
              <select
                value={selected}
                onChange={(e) => setSelected(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-green-500"
              >
                <option value="">メンバーを選択...</option>
                {members.map((m) => (
                  <option key={m.id} value={m.name}>{m.name}</option>
                ))}
              </select>
              <button
                onClick={handleLink}
                disabled={saving || !selected}
                className="w-full bg-green-500 hover:bg-green-400 disabled:opacity-50 text-black font-bold py-3 rounded-xl transition-colors"
              >
                {saving ? "設定中..." : "紐付ける"}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
