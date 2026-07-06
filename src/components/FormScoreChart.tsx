"use client";

import { useRef, useState } from "react";
import { FormScorePoint } from "@/lib/stats";
import { format } from "date-fns";
import { ja } from "date-fns/locale";

const W = 640;
const H = 220;
const PAD = { top: 14, right: 16, bottom: 24, left: 44 };

export default function FormScoreChart({ points }: { points: FormScorePoint[] }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [hover, setHover] = useState<number | null>(null);

  if (points.length < 2) {
    return (
      <div className="text-center py-10 text-gray-600 text-sm">
        試合を2つ以上記録するとグラフが表示されます
      </div>
    );
  }

  const scores = points.map((p) => p.score);
  const min = Math.min(...scores);
  const max = Math.max(...scores);
  const span = Math.max(max - min, 40);
  const yMin = min - span * 0.1;
  const yMax = max + span * 0.1;

  const plotW = W - PAD.left - PAD.right;
  const plotH = H - PAD.top - PAD.bottom;
  const x = (i: number) => PAD.left + (i / (points.length - 1)) * plotW;
  const y = (v: number) => PAD.top + (1 - (v - yMin) / (yMax - yMin)) * plotH;

  const path = points.map((p, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(p.score).toFixed(1)}`).join(" ");
  const area = `${path} L${x(points.length - 1).toFixed(1)},${(PAD.top + plotH).toFixed(1)} L${PAD.left},${(PAD.top + plotH).toFixed(1)} Z`;

  // 目盛り: 4本の水平グリッド
  const ticks = Array.from({ length: 4 }, (_, i) => Math.round(yMin + ((i + 0.5) / 4) * (yMax - yMin)));

  const last = points[points.length - 1];
  const hovered = hover != null ? points[hover] : null;

  function handleMove(e: React.PointerEvent<SVGSVGElement>) {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;
    const px = ((e.clientX - rect.left) / rect.width) * W;
    const ratio = (px - PAD.left) / plotW;
    const i = Math.round(ratio * (points.length - 1));
    setHover(Math.max(0, Math.min(points.length - 1, i)));
  }

  return (
    <div className="relative">
      {hovered && (
        <div
          className="absolute -top-1 z-10 pointer-events-none bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-xs shadow-lg whitespace-nowrap"
          style={{
            left: `${(x(hover!) / W) * 100}%`,
            transform: `translateX(${hover! > points.length / 2 ? "-105%" : "5%"})`,
          }}
        >
          <div className="text-gray-400">
            {format(new Date(hovered.date), "M月d日(E)", { locale: ja })} · {hovered.n}試合目
          </div>
          <div className="font-bold text-white mt-0.5">
            {hovered.score}
            <span className={`ml-2 ${hovered.won ? "text-green-400" : "text-red-400"}`}>
              {hovered.delta >= 0 ? "+" : ""}{hovered.delta} {hovered.won ? "WIN" : "LOSE"}
            </span>
          </div>
        </div>
      )}
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        className="w-full touch-none select-none"
        onPointerMove={handleMove}
        onPointerLeave={() => setHover(null)}
      >
        <defs>
          <linearGradient id="formArea" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#4ade80" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#4ade80" stopOpacity="0" />
          </linearGradient>
        </defs>

        {ticks.map((t) => (
          <g key={t}>
            <line x1={PAD.left} x2={W - PAD.right} y1={y(t)} y2={y(t)} stroke="#1f2937" strokeWidth="1" />
            <text x={PAD.left - 6} y={y(t) + 3} textAnchor="end" fontSize="10" fill="#6b7280">
              {t}
            </text>
          </g>
        ))}

        <path d={area} fill="url(#formArea)" />
        <path d={path} fill="none" stroke="#4ade80" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />

        {hovered && (
          <g>
            <line x1={x(hover!)} x2={x(hover!)} y1={PAD.top} y2={PAD.top + plotH} stroke="#4b5563" strokeWidth="1" strokeDasharray="3 3" />
            <circle cx={x(hover!)} cy={y(hovered.score)} r="4.5" fill="#4ade80" stroke="#030712" strokeWidth="2" />
          </g>
        )}

        {/* 最新値の直接ラベル */}
        <circle cx={x(points.length - 1)} cy={y(last.score)} r="3.5" fill="#4ade80" stroke="#030712" strokeWidth="1.5" />

        <text x={PAD.left} y={H - 6} fontSize="10" fill="#6b7280">
          {format(new Date(points[0].date), "yyyy/M/d")}
        </text>
        <text x={W - PAD.right} y={H - 6} textAnchor="end" fontSize="10" fill="#6b7280">
          {format(new Date(last.date), "yyyy/M/d")}
        </text>
      </svg>
    </div>
  );
}
