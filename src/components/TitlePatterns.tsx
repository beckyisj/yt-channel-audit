"use client";

import type { TitlePattern } from "@/lib/analysis";

export default function TitlePatterns({ patterns }: { patterns: TitlePattern[] }) {
  const positive = patterns.filter((p) => p.direction === "positive" && p.matchCount >= 3)
    .sort((a, b) => b.lift - a.lift);
  const negative = patterns.filter((p) => p.direction === "negative" && p.matchCount >= 3)
    .sort((a, b) => a.lift - b.lift);
  const neutral = patterns.filter((p) => p.direction === "neutral" || p.matchCount < 3);

  return (
    <div className="bg-white border border-stone-200 rounded-xl p-5">
      <h3 className="font-semibold text-stone-900 text-sm mb-1">Title Patterns</h3>
      <p className="text-xs text-stone-400 mb-4">
        Lift = avg views with pattern vs without (long-form only, min 3 matches)
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
                <div key={p.name} className="flex items-center justify-between bg-teal-50 rounded-lg px-3 py-2">
                  <span className="text-xs text-stone-700">{p.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-stone-400">{p.matchCount} videos</span>
                    <span className="text-xs font-semibold text-teal-700 bg-teal-100 rounded-full px-2 py-0.5">
                      +{p.lift}%
                    </span>
                  </div>
                </div>
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
                <div key={p.name} className="flex items-center justify-between bg-red-50 rounded-lg px-3 py-2">
                  <span className="text-xs text-stone-700">{p.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-stone-400">{p.matchCount} videos</span>
                    <span className="text-xs font-semibold text-red-600 bg-red-100 rounded-full px-2 py-0.5">
                      {p.lift}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Neutral patterns */}
      {neutral.length > 0 && (
        <div className="mt-4 pt-3 border-t border-stone-100">
          <p className="text-xs text-stone-400 mb-2">Inconclusive (too few videos or neutral lift)</p>
          <div className="flex flex-wrap gap-1.5">
            {neutral.map((p) => (
              <span key={p.name} className="text-[10px] text-stone-500 bg-stone-100 rounded-full px-2 py-0.5">
                {p.name} ({p.matchCount}) {p.lift > 0 ? `+${p.lift}%` : `${p.lift}%`}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
