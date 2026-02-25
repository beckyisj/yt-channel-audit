"use client";

import type { DurationBucket } from "@/lib/analysis";

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

export default function DurationAnalysis({ buckets }: { buckets: DurationBucket[] }) {
  const maxMedian = Math.max(...buckets.map((b) => b.medianViews), 1);

  return (
    <div className="bg-white border border-stone-200 rounded-xl p-5">
      <h3 className="font-semibold text-stone-900 text-sm mb-1">Duration Sweet Spots</h3>
      <p className="text-xs text-stone-400 mb-4">Long-form videos only. Best bucket highlighted.</p>

      <div className="flex flex-col gap-2">
        {buckets.map((bucket) => (
          <div
            key={bucket.label}
            className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-colors ${
              bucket.isBest ? "bg-teal-50 ring-1 ring-teal-200" : "bg-stone-50"
            }`}
          >
            <span className="text-xs text-stone-700 w-20 shrink-0 font-medium">
              {bucket.label}
              {bucket.isBest && (
                <span className="text-[10px] text-teal-600 font-normal ml-1">Best</span>
              )}
            </span>
            <div className="flex-1 h-4 bg-stone-200/50 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  bucket.isBest ? "bg-teal-500" : "bg-stone-400"
                }`}
                style={{
                  width: `${bucket.count > 0 ? Math.max((bucket.medianViews / maxMedian) * 100, 3) : 0}%`,
                }}
              />
            </div>
            <div className="text-right shrink-0 w-32">
              <span className="text-xs font-medium text-stone-700">
                {bucket.count > 0 ? formatNumber(bucket.medianViews) : "-"}
              </span>
              <span className="text-[10px] text-stone-400 ml-1">median</span>
              <span className="text-[10px] text-stone-400 ml-2">({bucket.count})</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
