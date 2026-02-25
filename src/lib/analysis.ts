import type { VideoData, ChannelInfo } from "./youtube";

// ---- Types ----

export interface PerformanceTier {
  label: string;
  threshold: number;
  color: string;
  count: number;
  percentage: number;
  avgViews: number;
  videos: VideoData[];
}

export interface TitlePattern {
  name: string;
  pattern: RegExp;
  matchCount: number;
  nonMatchCount: number;
  avgViewsWith: number;
  avgViewsWithout: number;
  lift: number;
  direction: "positive" | "negative" | "neutral";
}

export interface DurationBucket {
  label: string;
  minSeconds: number;
  maxSeconds: number;
  count: number;
  avgViews: number;
  medianViews: number;
  totalViews: number;
  isBest: boolean;
}

export interface FormatSplit {
  shorts: {
    count: number;
    medianViews: number;
    avgViews: number;
    totalViews: number;
  };
  longForm: {
    count: number;
    medianViews: number;
    avgViews: number;
    totalViews: number;
  };
}

export interface YearlyUpload {
  year: number;
  count: number;
  avgViews: number;
  medianViews: number;
  totalViews: number;
}

export interface MonthlyUpload {
  month: string; // "2026-01"
  count: number;
  avgViews: number;
}

export interface UploadCadence {
  yearly: YearlyUpload[];
  monthly: MonthlyUpload[];
  avgUploadsPerMonth: number;
  avgUploadsPerWeek: number;
}

export interface ChannelAnalysis {
  channelInfo: ChannelInfo;
  totalVideos: number;
  longFormCount: number;
  shortsCount: number;
  medianViews: number;
  avgViews: number;
  performanceTiers: PerformanceTier[];
  topVideos: VideoData[];
  formatSplit: FormatSplit;
  titlePatterns: TitlePattern[];
  durationBuckets: DurationBucket[];
  uploadCadence: UploadCadence;
  engagementRate: number;
}

// ---- Helpers ----

function median(arr: number[]): number {
  if (!arr.length) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0
    ? sorted[mid]
    : Math.round((sorted[mid - 1] + sorted[mid]) / 2);
}

function avg(arr: number[]): number {
  if (!arr.length) return 0;
  return Math.round(arr.reduce((s, v) => s + v, 0) / arr.length);
}

// ---- Analysis Functions ----

export function calculatePerformanceTiers(
  longFormVideos: VideoData[],
  medianViews: number
): PerformanceTier[] {
  const tiers = [
    { label: "Viral", multiplier: 10, color: "#10b981" },
    { label: "Strong", multiplier: 5, color: "#34d399" },
    { label: "Above Average", multiplier: 2, color: "#6ee7b7" },
    { label: "Average", multiplier: 0.5, color: "#94a3b8" },
    { label: "Below Average", multiplier: 0.2, color: "#f87171" },
    { label: "Poor", multiplier: 0, color: "#ef4444" },
  ];

  const total = longFormVideos.length;

  return tiers.map((tier, i) => {
    const threshold = Math.round(medianViews * tier.multiplier);
    const upperThreshold = i === 0 ? Infinity : Math.round(medianViews * tiers[i - 1].multiplier);

    const videos = longFormVideos.filter((v) => {
      if (i === 0) return v.viewCount >= threshold;
      if (i === tiers.length - 1) return v.viewCount < upperThreshold;
      return v.viewCount >= threshold && v.viewCount < upperThreshold;
    });

    return {
      label: tier.label,
      threshold,
      color: tier.color,
      count: videos.length,
      percentage: total > 0 ? Math.round((videos.length / total) * 100) : 0,
      avgViews: avg(videos.map((v) => v.viewCount)),
      videos,
    };
  });
}

export function analyzeTitlePatterns(longFormVideos: VideoData[]): TitlePattern[] {
  const patterns: { name: string; pattern: RegExp }[] = [
    { name: "Numbers", pattern: /\d+/ },
    { name: "Question marks", pattern: /\?/ },
    { name: "How to / How I", pattern: /\bhow\s+(to|i)\b/i },
    { name: "Strong emotion words", pattern: /\b(brutal|hard|honest|truth|crisis|shocking|insane|impossible|devastating|terrifying|crazy|incredible|amazing|unbelievable)\b/i },
    { name: "Negative framing", pattern: /\b(worst|never|don't|stop|quit|fail|wrong|bad|hate|ugly|mistake|problem|lose|risk|danger)\b/i },
    { name: "ALL CAPS words", pattern: /\b[A-Z]{3,}\b/ },
    { name: "Personal framing (I/My)", pattern: /\b(I|My|I'm|I've|I'll|Me)\b/ },
    { name: "Promise language", pattern: /\b(guaranteed|promise|secret|exactly|proven|ultimate|complete|definitive|must|need)\b/i },
    { name: "Brackets/parentheses", pattern: /[\[\(]/ },
    { name: "Listicle (starts with number)", pattern: /^\d+\s/ },
    { name: "Colon/dash separator", pattern: /[:\u2013\u2014-]\s/ },
  ];

  return patterns.map(({ name, pattern }) => {
    const matching = longFormVideos.filter((v) => pattern.test(v.title));
    const nonMatching = longFormVideos.filter((v) => !pattern.test(v.title));

    const avgViewsWith = avg(matching.map((v) => v.viewCount));
    const avgViewsWithout = avg(nonMatching.map((v) => v.viewCount));

    const lift = avgViewsWithout > 0
      ? Math.round(((avgViewsWith - avgViewsWithout) / avgViewsWithout) * 100)
      : 0;

    return {
      name,
      pattern,
      matchCount: matching.length,
      nonMatchCount: nonMatching.length,
      avgViewsWith,
      avgViewsWithout,
      lift,
      direction: lift > 15 ? "positive" : lift < -15 ? "negative" : "neutral" as const,
    };
  });
}

export function analyzeDuration(longFormVideos: VideoData[]): DurationBucket[] {
  const buckets = [
    { label: "Under 5 min", minSeconds: 61, maxSeconds: 300 },
    { label: "5-10 min", minSeconds: 300, maxSeconds: 600 },
    { label: "10-15 min", minSeconds: 600, maxSeconds: 900 },
    { label: "15-20 min", minSeconds: 900, maxSeconds: 1200 },
    { label: "20-30 min", minSeconds: 1200, maxSeconds: 1800 },
    { label: "30-60 min", minSeconds: 1800, maxSeconds: 3600 },
    { label: "60+ min", minSeconds: 3600, maxSeconds: Infinity },
  ];

  const results = buckets.map((bucket) => {
    const videos = longFormVideos.filter(
      (v) => v.durationSeconds > bucket.minSeconds && v.durationSeconds <= bucket.maxSeconds
    );
    const views = videos.map((v) => v.viewCount);

    return {
      ...bucket,
      count: videos.length,
      avgViews: avg(views),
      medianViews: median(views),
      totalViews: views.reduce((s, v) => s + v, 0),
      isBest: false,
    };
  });

  // Mark the best bucket (highest median views with at least 3 videos)
  const eligible = results.filter((b) => b.count >= 3);
  if (eligible.length > 0) {
    const best = eligible.reduce((a, b) => (a.medianViews > b.medianViews ? a : b));
    const idx = results.findIndex((b) => b.label === best.label);
    if (idx >= 0) results[idx].isBest = true;
  }

  return results;
}

export function analyzeFormatSplit(videos: VideoData[]): FormatSplit {
  const shorts = videos.filter((v) => v.isShort);
  const longForm = videos.filter((v) => !v.isShort);

  return {
    shorts: {
      count: shorts.length,
      medianViews: median(shorts.map((v) => v.viewCount)),
      avgViews: avg(shorts.map((v) => v.viewCount)),
      totalViews: shorts.reduce((s, v) => s + v.viewCount, 0),
    },
    longForm: {
      count: longForm.length,
      medianViews: median(longForm.map((v) => v.viewCount)),
      avgViews: avg(longForm.map((v) => v.viewCount)),
      totalViews: longForm.reduce((s, v) => s + v.viewCount, 0),
    },
  };
}

export function analyzeUploadCadence(videos: VideoData[]): UploadCadence {
  // Group by year
  const byYear = new Map<number, VideoData[]>();
  const byMonth = new Map<string, VideoData[]>();

  for (const v of videos) {
    const date = new Date(v.publishedAt);
    const year = date.getFullYear();
    const month = `${year}-${String(date.getMonth() + 1).padStart(2, "0")}`;

    if (!byYear.has(year)) byYear.set(year, []);
    byYear.get(year)!.push(v);

    if (!byMonth.has(month)) byMonth.set(month, []);
    byMonth.get(month)!.push(v);
  }

  const yearly: YearlyUpload[] = Array.from(byYear.entries())
    .map(([year, vids]) => ({
      year,
      count: vids.length,
      avgViews: avg(vids.map((v) => v.viewCount)),
      medianViews: median(vids.map((v) => v.viewCount)),
      totalViews: vids.reduce((s, v) => s + v.viewCount, 0),
    }))
    .sort((a, b) => a.year - b.year);

  // Last 12 months
  const monthKeys = Array.from(byMonth.keys()).sort().slice(-12);
  const monthly: MonthlyUpload[] = monthKeys.map((month) => {
    const vids = byMonth.get(month)!;
    return {
      month,
      count: vids.length,
      avgViews: avg(vids.map((v) => v.viewCount)),
    };
  });

  // Calculate upload frequency
  if (videos.length < 2) {
    return { yearly, monthly, avgUploadsPerMonth: 0, avgUploadsPerWeek: 0 };
  }

  const dates = videos.map((v) => new Date(v.publishedAt).getTime()).sort();
  const spanMs = dates[dates.length - 1] - dates[0];
  const spanWeeks = spanMs / (7 * 24 * 60 * 60 * 1000);
  const spanMonths = spanWeeks / 4.33;

  return {
    yearly,
    monthly,
    avgUploadsPerMonth: spanMonths > 0 ? Math.round((videos.length / spanMonths) * 10) / 10 : 0,
    avgUploadsPerWeek: spanWeeks > 0 ? Math.round((videos.length / spanWeeks) * 10) / 10 : 0,
  };
}

// ---- Main Analysis ----

export function analyzeChannel(
  videos: VideoData[],
  channelInfo: ChannelInfo
): ChannelAnalysis {
  const longFormVideos = videos.filter((v) => !v.isShort);
  const shorts = videos.filter((v) => v.isShort);

  const longFormViews = longFormVideos.map((v) => v.viewCount);
  const medianViews = median(longFormViews);
  const avgViews = avg(longFormViews);

  // Engagement rate (videos with 500+ views)
  const engagementVideos = longFormVideos.filter((v) => v.viewCount >= 500);
  const engagementRate = engagementVideos.length > 0
    ? Math.round(
        (engagementVideos.reduce((s, v) => s + (v.likeCount / v.viewCount) * 100, 0) /
          engagementVideos.length) *
          100
      ) / 100
    : 0;

  return {
    channelInfo,
    totalVideos: videos.length,
    longFormCount: longFormVideos.length,
    shortsCount: shorts.length,
    medianViews,
    avgViews,
    performanceTiers: calculatePerformanceTiers(longFormVideos, medianViews),
    topVideos: longFormVideos.slice(0, 10), // already sorted by views desc
    formatSplit: analyzeFormatSplit(videos),
    titlePatterns: analyzeTitlePatterns(longFormVideos),
    durationBuckets: analyzeDuration(longFormVideos),
    uploadCadence: analyzeUploadCadence(videos),
    engagementRate,
  };
}
