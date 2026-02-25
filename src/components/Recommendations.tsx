"use client";

import type { Recommendation } from "@/lib/ai";

const priorityColors = {
  high: "bg-red-50 text-red-700 border-red-200",
  medium: "bg-amber-50 text-amber-700 border-amber-200",
  low: "bg-stone-50 text-stone-600 border-stone-200",
};

const categoryIcons: Record<string, string> = {
  content: "Content",
  packaging: "Packaging",
  format: "Format",
  schedule: "Schedule",
  growth: "Growth",
};

export default function Recommendations({
  recommendations,
  loading,
}: {
  recommendations: Recommendation[];
  loading: boolean;
}) {
  if (loading) {
    return (
      <div className="bg-white border border-stone-200 rounded-xl p-5">
        <h3 className="font-semibold text-stone-900 text-sm mb-3">AI Recommendations</h3>
        <div className="flex items-center gap-3 py-6 justify-center">
          <svg className="animate-spin h-5 w-5 text-teal-600" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span className="text-sm text-stone-500">Generating recommendations...</span>
        </div>
      </div>
    );
  }

  if (!recommendations.length) return null;

  return (
    <div className="bg-white border border-stone-200 rounded-xl p-5">
      <h3 className="font-semibold text-stone-900 text-sm mb-4">AI Recommendations</h3>
      <div className="flex flex-col gap-3">
        {recommendations.map((rec, i) => (
          <div
            key={i}
            className={`border rounded-lg p-4 ${priorityColors[rec.priority]}`}
          >
            <div className="flex items-start gap-3">
              <span className="text-lg font-bold opacity-40 leading-none mt-0.5">{i + 1}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="text-sm font-semibold">{rec.title}</h4>
                  <span className="text-[10px] font-medium bg-white/60 rounded-full px-1.5 py-0.5">
                    {categoryIcons[rec.category] || rec.category}
                  </span>
                </div>
                <p className="text-xs opacity-80 leading-relaxed">{rec.detail}</p>
              </div>
              <span
                className={`text-[10px] font-semibold uppercase tracking-wider shrink-0 ${
                  rec.priority === "high" ? "text-red-600" :
                  rec.priority === "medium" ? "text-amber-600" :
                  "text-stone-500"
                }`}
              >
                {rec.priority}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
