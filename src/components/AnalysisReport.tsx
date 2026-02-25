"use client";

import { useState } from "react";
import type { ChannelAnalysis } from "@/lib/analysis";
import type { Recommendation } from "@/lib/ai";
import ChannelSnapshot from "./ChannelSnapshot";
import PerformanceTiers from "./PerformanceTiers";
import TopVideos from "./TopVideos";
import FormatSplit from "./FormatSplit";
import TitlePatterns from "./TitlePatterns";
import DurationAnalysis from "./DurationAnalysis";
import UploadCadence from "./UploadCadence";
import Recommendations from "./Recommendations";

interface AnalysisReportProps {
  analysis: ChannelAnalysis;
  recommendations: Recommendation[];
  recommendationsLoading: boolean;
  auditId?: string | null;
}

export default function AnalysisReport({
  analysis,
  recommendations,
  recommendationsLoading,
  auditId,
}: AnalysisReportProps) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    if (!auditId) return;
    const url = `https://audit.youtubeproducer.app/share/${auditId}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const input = document.createElement("input");
      input.value = url;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Share bar */}
      {auditId && (
        <div className="flex justify-end">
          <button
            onClick={handleShare}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-stone-500 hover:text-teal-600 bg-white border border-stone-200 hover:border-teal-200 rounded-lg px-3 py-1.5 transition-colors"
          >
            {copied ? (
              <>
                <svg className="w-3.5 h-3.5 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                Link copied
              </>
            ) : (
              <>
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
                Share audit
              </>
            )}
          </button>
        </div>
      )}

      <ChannelSnapshot analysis={analysis} />
      <PerformanceTiers tiers={analysis.performanceTiers} medianViews={analysis.medianViews} />
      <TopVideos videos={analysis.topVideos} />
      <FormatSplit data={analysis.formatSplit} />
      <TitlePatterns patterns={analysis.titlePatterns} />
      <DurationAnalysis buckets={analysis.durationBuckets} />
      <UploadCadence data={analysis.uploadCadence} />
      <Recommendations recommendations={recommendations} loading={recommendationsLoading} />
    </div>
  );
}
