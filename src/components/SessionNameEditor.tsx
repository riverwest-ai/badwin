"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SessionNameEditor({
  date,
  initialName,
}: {
  date: string;
  initialName: string;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(initialName);
  const [input, setInput] = useState(initialName);
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    try {
      await fetch("/api/sessions", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date, name: input.trim() }),
      });
      setName(input.trim());
      setEditing(false);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  function cancel() {
    setInput(name);
    setEditing(false);
  }

  if (editing) {
    return (
      <div className="flex items-center gap-2 mt-2">
        <input
          autoFocus
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") save();
            if (e.key === "Escape") cancel();
          }}
          placeholder="月曜サークル など..."
          className="flex-1 bg-gray-800 border border-gray-600 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:border-green-500"
        />
        <button
          onClick={save}
          disabled={saving}
          className="px-3 py-1.5 bg-green-500 hover:bg-green-400 text-black text-sm font-semibold rounded-lg disabled:opacity-50 shrink-0"
        >
          {saving ? "..." : "保存"}
        </button>
        <button
          onClick={cancel}
          className="px-3 py-1.5 text-gray-400 hover:text-white text-sm rounded-lg shrink-0"
        >
          キャンセル
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => { setInput(name); setEditing(true); }}
      className="flex items-center gap-1.5 mt-1.5 group"
    >
      {name ? (
        <span className="text-base font-medium text-gray-300 group-hover:text-white transition-colors">
          {name}
        </span>
      ) : (
        <span className="text-sm text-gray-600 italic group-hover:text-gray-400 transition-colors">
          名前を追加...
        </span>
      )}
      <span className="text-xs opacity-0 group-hover:opacity-100 transition-opacity">✏️</span>
    </button>
  );
}
