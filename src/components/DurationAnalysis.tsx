"use client";

import type { DurationBucket } from "@/lib/analysis";

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

export default function DurationAnalysis({ buckets }: { buckets: DurationBucket[] }) {
  const maxMedian = Math.max(...buckets.filter((b) => b.count >= 3).map((b) => b.medianViews), 1);

  return (
    <div className="bg-white border border-stone-200 rounded-xl p-5">
      <h3 className="font-semibold text-stone-900 text-sm mb-1">Duration Sweet Spots</h3>
      <p className="text-xs text-stone-400 mb-4">
        Long-form videos only. Best bucket needs 3+ videos to qualify.
      </p>

      <div className="flex flex-col gap-2">
        {buckets.map((bucket) => {
          const tooFew = bucket.count > 0 && bucket.count < 3;
          return (
            <div
              key={bucket.label}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-colors ${
                bucket.isBest
                  ? "bg-teal-50 ring-1 ring-teal-200"
                  : tooFew
                    ? "bg-stone-50/60"
                    : "bg-stone-50"
              }`}
            >
              <div className="w-20 shrink-0">
                <span className={`text-xs font-medium ${tooFew ? "text-stone-400" : "text-stone-700"}`}>
                  {bucket.label}
                </span>
                {bucket.isBest && (
                  <span className="text-[10px] text-teal-600 font-normal ml-1">Best</span>
                )}
              </div>
              <div className="flex-1 h-4 bg-stone-200/50 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    bucket.isBest
                      ? "bg-teal-500"
                      : tooFew
                        ? "bg-stone-300/60"
                        : "bg-stone-400"
                  }`}
                  style={{
                    width: `${bucket.count >= 3 ? Math.max((bucket.medianViews / maxMedian) * 100, 3) : bucket.count > 0 ? 3 : 0}%`,
                  }}
                />
              </div>
              <div className="text-right shrink-0 w-36">
                <span className={`text-xs font-semibold ${tooFew ? "text-stone-400" : "text-stone-700"}`}>
                  {bucket.count > 0 ? formatNumber(bucket.medianViews) : "—"}
                </span>
                <span className="text-[10px] text-stone-400 ml-1">median</span>
                <span className={`text-[10px] ml-2 ${tooFew ? "text-amber-500 font-medium" : "text-stone-400"}`}>
                  {bucket.count} video{bucket.count !== 1 ? "s" : ""}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
