"use client";

import type { PerformanceTier } from "@/lib/analysis";

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

export default function PerformanceTiers({ tiers, medianViews }: { tiers: PerformanceTier[]; medianViews: number }) {
  const maxCount = Math.max(...tiers.map((t) => t.count), 1);

  return (
    <div className="bg-white border border-stone-200 rounded-xl p-5">
      <div className="flex items-center justify-between mb-1">
        <h3 className="font-semibold text-stone-900 text-sm">Performance Tiers</h3>
        <span className="text-xs text-stone-400">Median: {formatNumber(medianViews)} views</span>
      </div>
      <p className="text-xs text-stone-400 mb-4">Every long-form video sorted into tiers based on how it performed relative to the channel's median views. A healthy channel has most videos in Average with a few breakouts.</p>

      <div className="flex flex-col gap-2">
        {tiers.map((tier) => (
          <div key={tier.label} className="flex items-center gap-3">
            <div className="w-28 shrink-0 text-right">
              <span className="text-xs font-medium text-stone-700">{tier.label}</span>
              <span className="text-[10px] text-stone-400 ml-1">
                {tier.threshold > 0 ? `${formatNumber(tier.threshold)}+` : ""}
              </span>
            </div>
            <div className="flex-1 h-6 bg-stone-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500 flex items-center justify-end pr-2"
                style={{
                  width: `${Math.max((tier.count / maxCount) * 100, tier.count > 0 ? 8 : 0)}%`,
                  backgroundColor: tier.color,
                }}
              >
                {tier.count > 0 && (
                  <span className="text-[10px] font-semibold text-white drop-shadow-sm">
                    {tier.count}
                  </span>
                )}
              </div>
            </div>
            <span className="text-xs text-stone-500 w-10 text-right">{tier.percentage}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
