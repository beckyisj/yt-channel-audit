"use client";

import type { FormatSplit as FormatSplitType } from "@/lib/analysis";

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

export default function FormatSplit({ data }: { data: FormatSplitType }) {
  const totalCount = data.shorts.count + data.longForm.count;
  const shortsPercent = totalCount > 0 ? Math.round((data.shorts.count / totalCount) * 100) : 0;
  const longFormPercent = 100 - shortsPercent;

  return (
    <div className="bg-white border border-stone-200 rounded-xl p-5">
      <h3 className="font-semibold text-stone-900 text-sm mb-1">Shorts vs Long-form</h3>
      <p className="text-xs text-stone-400 mb-4">How the channel splits its output between Shorts (under 60 seconds) and long-form videos, and how each format performs.</p>

      {/* Visual bar */}
      <div className="h-3 rounded-full overflow-hidden flex mb-4">
        <div
          className="bg-teal-500 transition-all"
          style={{ width: `${longFormPercent}%` }}
        />
        <div
          className="bg-orange-400 transition-all"
          style={{ width: `${shortsPercent}%` }}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-teal-50 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2.5 h-2.5 rounded-full bg-teal-500" />
            <span className="text-xs font-medium text-stone-700">Long-form ({longFormPercent}%)</span>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-stone-500">
              <span className="font-medium text-stone-700">{data.longForm.count}</span> videos
            </p>
            <p className="text-xs text-stone-500">
              Median: <span className="font-medium text-stone-700">{formatNumber(data.longForm.medianViews)}</span> views
            </p>
            <p className="text-xs text-stone-500">
              Total: <span className="font-medium text-stone-700">{formatNumber(data.longForm.totalViews)}</span> views
            </p>
          </div>
        </div>

        <div className="bg-orange-50 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2.5 h-2.5 rounded-full bg-orange-400" />
            <span className="text-xs font-medium text-stone-700">Shorts ({shortsPercent}%)</span>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-stone-500">
              <span className="font-medium text-stone-700">{data.shorts.count}</span> videos
            </p>
            <p className="text-xs text-stone-500">
              Median: <span className="font-medium text-stone-700">{formatNumber(data.shorts.medianViews)}</span> views
            </p>
            <p className="text-xs text-stone-500">
              Total: <span className="font-medium text-stone-700">{formatNumber(data.shorts.totalViews)}</span> views
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
