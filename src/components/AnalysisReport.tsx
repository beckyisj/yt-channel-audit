"use client";

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
}

export default function AnalysisReport({
  analysis,
  recommendations,
  recommendationsLoading,
}: AnalysisReportProps) {
  return (
    <div className="flex flex-col gap-4">
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
