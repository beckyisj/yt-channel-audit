"use client";

import type { ChannelAnalysis } from "@/lib/analysis";

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

export default function ChannelSnapshot({ analysis }: { analysis: ChannelAnalysis }) {
  const { channelInfo, totalVideos, longFormCount, shortsCount } = analysis;
  const recent = analysis.recentStats;

  const stats = [
    { label: "Subscribers", value: formatNumber(channelInfo.subscriberCount) },
    { label: "Total Views", value: formatNumber(channelInfo.viewCount) },
    { label: "Videos", value: `${totalVideos} (${longFormCount} long, ${shortsCount} shorts)` },
    { label: "Median Views", value: recent ? formatNumber(recent.medianViews) : formatNumber(analysis.medianViews), sublabel: recent ? "long-form, last 12 mo" : "long-form" },
    { label: "Avg Views", value: recent ? formatNumber(recent.avgViews) : formatNumber(analysis.avgViews), sublabel: recent ? "long-form, last 12 mo" : "long-form" },
    { label: "Upload Rate", value: recent ? `${recent.uploadsPerMonth}/mo` : `${analysis.uploadCadence.avgUploadsPerMonth}/mo`, sublabel: recent ? "last 12 mo" : undefined },
    { label: "Engagement", value: `${recent ? recent.engagementRate : analysis.engagementRate}%`, sublabel: recent ? "likes/views, last 12 mo" : "likes/views" },
  ];

  return (
    <div className="bg-white border border-stone-200 rounded-xl p-5">
      <div className="flex items-center gap-3 mb-4">
        {channelInfo.thumbnail && (
          <img src={channelInfo.thumbnail} alt="" className="w-10 h-10 rounded-full" />
        )}
        <div>
          <h3 className="font-semibold text-stone-900 text-sm">{channelInfo.title}</h3>
          {channelInfo.customUrl && (
            <p className="text-xs text-stone-400">{channelInfo.customUrl}</p>
          )}
        </div>
      </div>
      <p className="text-xs text-stone-400 mb-3">Channel overview. Performance stats are from the last 12 months.</p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-stone-50 rounded-lg p-3">
            <p className="text-xs text-stone-500">{stat.label}</p>
            <p className="text-lg font-semibold text-stone-900 mt-0.5">{stat.value}</p>
            {stat.sublabel && (
              <p className="text-[10px] text-stone-400">{stat.sublabel}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
