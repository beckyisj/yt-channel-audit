"use client";

import AnalysisReport from "@/components/AnalysisReport";
import type { ChannelAnalysis } from "@/lib/analysis";
import type { Recommendation } from "@/lib/ai";

interface ShareReportProps {
  audit: {
    id: string;
    channel_title: string;
    channel_thumbnail: string;
    channel_subs: number;
    analysis_data: unknown;
    recommendations: unknown;
  };
}

export default function ShareReport({ audit }: ShareReportProps) {
  const analysis = audit.analysis_data as ChannelAnalysis;
  const recommendations = (audit.recommendations as Recommendation[]) || [];

  return (
    <div className="bg-stone-50 min-h-screen">
      {/* Header */}
      <header className="border-b border-stone-200 bg-white/80 backdrop-blur-sm sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-teal-600 to-teal-500 flex items-center justify-center">
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="white" stroke="white" strokeWidth="1">
                <rect x="3" y="12" width="4" height="9" rx="0.5" />
                <rect x="10" y="7" width="4" height="14" rx="0.5" />
                <rect x="17" y="3" width="4" height="18" rx="0.5" />
              </svg>
            </div>
            <span className="font-semibold text-stone-900 text-sm tracking-tight">Channel Audit</span>
          </div>
          <a
            href="https://audit.youtubeproducer.app"
            className="text-xs font-medium text-teal-600 hover:text-teal-700 transition-colors"
          >
            Run your own audit
          </a>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-3 mb-2">
            {audit.channel_thumbnail && (
              <img
                src={audit.channel_thumbnail}
                alt={audit.channel_title}
                className="w-10 h-10 rounded-full"
              />
            )}
            <h1 className="text-xl font-bold text-stone-900 tracking-tight">
              {audit.channel_title}
            </h1>
          </div>
          <p className="text-xs text-stone-400">Shared audit report</p>
        </div>

        <AnalysisReport
          analysis={analysis}
          recommendations={recommendations}
          recommendationsLoading={false}
        />
      </main>
    </div>
  );
}
