"use client";

import type { VideoData } from "@/lib/youtube";

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export default function TopVideos({ videos }: { videos: VideoData[] }) {
  return (
    <div className="bg-white border border-stone-200 rounded-xl p-5">
      <h3 className="font-semibold text-stone-900 text-sm mb-3">Top 10 Videos (All Time)</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-stone-100">
              <th className="text-[10px] font-medium text-stone-400 uppercase tracking-wider pb-2 pr-3">#</th>
              <th className="text-[10px] font-medium text-stone-400 uppercase tracking-wider pb-2 pr-3">Title</th>
              <th className="text-[10px] font-medium text-stone-400 uppercase tracking-wider pb-2 pr-3 text-right">Views</th>
              <th className="text-[10px] font-medium text-stone-400 uppercase tracking-wider pb-2 pr-3 text-right">Likes</th>
              <th className="text-[10px] font-medium text-stone-400 uppercase tracking-wider pb-2 text-right">Duration</th>
            </tr>
          </thead>
          <tbody>
            {videos.map((video, i) => (
              <tr key={video.videoId} className="border-b border-stone-50 hover:bg-stone-50 transition-colors">
                <td className="py-2 pr-3 text-xs text-stone-400">{i + 1}</td>
                <td className="py-2 pr-3 max-w-xs">
                  <a
                    href={`https://www.youtube.com/watch?v=${video.videoId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-stone-800 hover:text-teal-600 transition-colors line-clamp-2"
                  >
                    {video.title}
                  </a>
                  <p className="text-[10px] text-stone-400 mt-0.5">
                    {new Date(video.publishedAt).toLocaleDateString()}
                  </p>
                </td>
                <td className="py-2 pr-3 text-xs font-medium text-stone-700 text-right whitespace-nowrap">
                  {formatNumber(video.viewCount)}
                </td>
                <td className="py-2 pr-3 text-xs text-stone-500 text-right whitespace-nowrap">
                  {formatNumber(video.likeCount)}
                </td>
                <td className="py-2 text-xs text-stone-500 text-right whitespace-nowrap">
                  {formatDuration(video.durationSeconds)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
