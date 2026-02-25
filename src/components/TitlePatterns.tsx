"use client";

import { useState } from "react";
import type { TitlePattern } from "@/lib/analysis";

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

function PatternRow({
  pattern,
  variant,
}: {
  pattern: TitlePattern;
  variant: "positive" | "negative";
}) {
  const [expanded, setExpanded] = useState(false);
  const isPositive = variant === "positive";

  return (
    <div>
      <button
        onClick={() => setExpanded(!expanded)}
        className={`w-full flex items-center justify-between rounded-lg px-3 py-2 text-left transition-colors ${
          isPositive ? "bg-teal-50 hover:bg-teal-100/60" : "bg-red-50 hover:bg-red-100/60"
        }`}
      >
        <span className="text-xs text-stone-700 flex items-center gap-1.5">
          <svg
            className={`w-3 h-3 text-stone-400 transition-transform ${expanded ? "rotate-90" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
          {pattern.name}
        </span>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-stone-400">{pattern.matchCount} videos</span>
          <span
            className={`text-xs font-semibold rounded-full px-2 py-0.5 ${
              isPositive
                ? "text-teal-700 bg-teal-100"
                : "text-red-600 bg-red-100"
            }`}
          >
            {pattern.lift > 0 ? "+" : ""}
            {pattern.lift}%
          </span>
        </div>
      </button>

      {expanded && pattern.matchingVideos?.length > 0 && (
        <div className={`ml-5 mt-1 mb-1 rounded-lg px-3 py-2 ${isPositive ? "bg-teal-50/50" : "bg-red-50/50"}`}>
          {pattern.matchingVideos.map((v) => (
            <a
              key={v.videoId}
              href={`https://youtube.com/watch?v=${v.videoId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between gap-2 py-1 group"
            >
              <span className="text-[11px] text-stone-600 group-hover:text-teal-700 truncate transition-colors">
                {v.title}
              </span>
              <span className="text-[10px] text-stone-400 shrink-0">
                {formatNumber(v.viewCount)} views
              </span>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

export default function TitlePatterns({ patterns }: { patterns: TitlePattern[] }) {
  const positive = patterns
    .filter((p) => p.direction === "positive" && p.matchCount >= 3)
    .sort((a, b) => b.lift - a.lift);
  const negative = patterns
    .filter((p) => p.direction === "negative" && p.matchCount >= 3)
    .sort((a, b) => a.lift - b.lift);
  const neutral = patterns.filter((p) => p.direction === "neutral" || p.matchCount < 3);

  return (
    <div className="bg-white border border-stone-200 rounded-xl p-5">
      <h3 className="font-semibold text-stone-900 text-sm mb-1">Title Patterns</h3>
      <p className="text-xs text-stone-400 mb-4">
        We check each title for common patterns (numbers, questions, emotional words, etc.) and compare the average views of videos with that pattern vs without. Positive lift means videos with that pattern get more views on average. Click any pattern to see matching titles.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* What works */}
        <div>
          <p className="text-xs font-semibold text-teal-700 mb-2 uppercase tracking-wider">
            What works
          </p>
          {positive.length === 0 ? (
            <p className="text-xs text-stone-400">No clear positive patterns</p>
          ) : (
            <div className="flex flex-col gap-1.5">
              {positive.map((p) => (
                <PatternRow key={p.name} pattern={p} variant="positive" />
              ))}
            </div>
          )}
        </div>

        {/* What hurts */}
        <div>
          <p className="text-xs font-semibold text-red-600 mb-2 uppercase tracking-wider">
            What hurts
          </p>
          {negative.length === 0 ? (
            <p className="text-xs text-stone-400">No clear negative patterns</p>
          ) : (
            <div className="flex flex-col gap-1.5">
              {negative.map((p) => (
                <PatternRow key={p.name} pattern={p} variant="negative" />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Neutral patterns */}
      {neutral.length > 0 && (
        <div className="mt-4 pt-3 border-t border-stone-100">
          <p className="text-xs text-stone-400 mb-2">
            Inconclusive (too few videos or neutral lift)
          </p>
          <div className="flex flex-wrap gap-1.5">
            {neutral.map((p) => (
              <span
                key={p.name}
                className="text-[10px] text-stone-500 bg-stone-100 rounded-full px-2 py-0.5"
              >
                {p.name} ({p.matchCount}) {p.lift > 0 ? `+${p.lift}%` : `${p.lift}%`}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
