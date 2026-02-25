"use client";

import type { UploadCadence as UploadCadenceType } from "@/lib/analysis";

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

export default function UploadCadence({ data }: { data: UploadCadenceType }) {
  const maxMonthlyCount = Math.max(...data.monthly.map((m) => m.count), 1);

  return (
    <div className="bg-white border border-stone-200 rounded-xl p-5">
      <h3 className="font-semibold text-stone-900 text-sm mb-4">Upload Cadence</h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Yearly */}
        <div>
          <p className="text-xs font-medium text-stone-600 mb-2">By Year</p>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-stone-100">
                  <th className="text-[10px] font-medium text-stone-400 uppercase pb-1">Year</th>
                  <th className="text-[10px] font-medium text-stone-400 uppercase pb-1 text-right">Videos</th>
                  <th className="text-[10px] font-medium text-stone-400 uppercase pb-1 text-right">Median</th>
                </tr>
              </thead>
              <tbody>
                {data.yearly.map((y) => (
                  <tr key={y.year} className="border-b border-stone-50">
                    <td className="py-1.5 text-xs text-stone-700">{y.year}</td>
                    <td className="py-1.5 text-xs text-stone-600 text-right">{y.count}</td>
                    <td className="py-1.5 text-xs text-stone-600 text-right">{formatNumber(y.medianViews)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Monthly (last 12) */}
        <div>
          <p className="text-xs font-medium text-stone-600 mb-2">Last 12 Months</p>
          <div className="flex flex-col gap-1">
            {data.monthly.map((m) => (
              <div key={m.month} className="flex items-center gap-2">
                <span className="text-[10px] text-stone-500 w-14 shrink-0">{m.month}</span>
                <div className="flex-1 h-3 bg-stone-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-teal-400 rounded-full transition-all"
                    style={{ width: `${(m.count / maxMonthlyCount) * 100}%` }}
                  />
                </div>
                <span className="text-[10px] text-stone-500 w-6 text-right">{m.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
