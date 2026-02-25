"use client";

import { useState, useCallback, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getOrCreateSessionId } from "@/lib/session";
import ChannelInput from "@/components/ChannelInput";
import ProgressSteps from "@/components/ProgressSteps";
import type { Step } from "@/components/ProgressSteps";
import AnalysisReport from "@/components/AnalysisReport";
import PaywallBanner from "@/components/PaywallBanner";
import AuthWidget from "@/components/AuthWidget";
import HistoryPanel from "@/components/HistoryPanel";
import FeedbackModal from "@/components/FeedbackModal";
import type { ChannelAnalysis } from "@/lib/analysis";
import type { Recommendation } from "@/lib/ai";

export default function Home() {
  const { session } = useAuth();

  // State
  const [isLoading, setIsLoading] = useState(false);
  const [analysis, setAnalysis] = useState<ChannelAnalysis | null>(null);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [recommendationsLoading, setRecommendationsLoading] = useState(false);
  const [auditId, setAuditId] = useState<string | null>(null);
  const [paywall, setPaywall] = useState<{ count: number; limit: number; reason?: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState("");

  // UI state
  const [showHistory, setShowHistory] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [errorContext, setErrorContext] = useState<{ error: string; channelUrl?: string } | undefined>();

  // Steps
  const [steps, setSteps] = useState<Step[]>([
    { label: "Resolving channel", status: "pending" },
    { label: "Fetching all videos", status: "pending" },
    { label: "Running analysis", status: "pending" },
    { label: "Generating recommendations", status: "pending" },
  ]);

  const updateStep = (index: number, status: Step["status"], detail?: string) => {
    setSteps((prev) =>
      prev.map((s, i) =>
        i === index ? { ...s, status, detail: detail ?? s.detail } : s
      )
    );
  };

  // Migrate anonymous history on sign-in
  useEffect(() => {
    if (session?.access_token) {
      const sessionId = getOrCreateSessionId();
      if (sessionId) {
        fetch("/api/audit-history/migrate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ sessionId }),
        }).catch(() => {});
      }
    }
  }, [session]);

  const resetState = () => {
    setAnalysis(null);
    setRecommendations([]);
    setRecommendationsLoading(false);
    setAuditId(null);
    setPaywall(null);
    setError(null);
    setErrorContext(undefined);
    setSteps([
      { label: "Resolving channel", status: "pending" },
      { label: "Fetching all videos", status: "pending" },
      { label: "Running analysis", status: "pending" },
      { label: "Generating recommendations", status: "pending" },
    ]);
  };

  const handleSubmit = useCallback(
    async (input: string) => {
      resetState();
      setIsLoading(true);
      setInputValue(input);

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (session?.access_token) {
        headers.Authorization = `Bearer ${session.access_token}`;
      }

      try {
        // Steps 1-3: Analyze channel (resolve + fetch + analyze)
        updateStep(0, "active");
        const sessionId = getOrCreateSessionId();
        const analyzeRes = await fetch("/api/analyze", {
          method: "POST",
          headers,
          body: JSON.stringify({ input, sessionId }),
        });
        const analyzeData = await analyzeRes.json();

        if (analyzeData.paywall) {
          updateStep(0, "error", "Limit reached");
          setPaywall({
            count: analyzeData.count,
            limit: analyzeData.limit,
            reason: analyzeData.reason,
          });
          setIsLoading(false);
          return;
        }

        if (!analyzeRes.ok) {
          throw new Error(analyzeData.error || "Failed to analyze channel");
        }

        const channelAnalysis = analyzeData.analysis as ChannelAnalysis;
        setAnalysis(channelAnalysis);
        setAuditId(analyzeData.auditId || null);

        updateStep(0, "done", channelAnalysis.channelInfo.title);
        updateStep(1, "done", `${analyzeData.videoCount} videos fetched`);
        updateStep(2, "done", `${channelAnalysis.longFormCount} long-form analyzed`);

        // Step 4: AI recommendations (async)
        updateStep(3, "active");
        setRecommendationsLoading(true);
        setIsLoading(false); // Let the report show while recommendations load

        try {
          const recsRes = await fetch("/api/recommendations", {
            method: "POST",
            headers,
            body: JSON.stringify({
              analysis: channelAnalysis,
              channelInfo: channelAnalysis.channelInfo,
              auditId: analyzeData.auditId,
            }),
          });
          const recsData = await recsRes.json();

          if (recsRes.ok && recsData.recommendations) {
            setRecommendations(recsData.recommendations);
            updateStep(3, "done", `${recsData.recommendations.length} recommendations`);
          } else {
            updateStep(3, "error", "Failed to generate");
          }
        } catch {
          updateStep(3, "error", "Failed to generate");
        } finally {
          setRecommendationsLoading(false);
        }
      } catch (e) {
        const message = e instanceof Error ? e.message : "Something went wrong";
        setError(message);
        setErrorContext({ error: message, channelUrl: input });
        setSteps((prev) =>
          prev.map((s) => (s.status === "active" ? { ...s, status: "error" as const } : s))
        );
        setIsLoading(false);
      }
    },
    [session]
  );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleHistorySelect = (audit: any) => {
    setShowHistory(false);
    setAnalysis(audit.analysis_data as ChannelAnalysis);
    setRecommendations((audit.recommendations as Recommendation[]) || []);
    setRecommendationsLoading(false);
    setAuditId(audit.id || null);
    setSteps([
      { label: "Resolving channel", status: "done", detail: audit.channel_title as string },
      { label: "Fetching all videos", status: "done" },
      { label: "Running analysis", status: "done" },
      { label: "Generating recommendations", status: "done" },
    ]);
  };

  const showProgress = steps.some((s) => s.status !== "pending");

  return (
    <div className="bg-stone-50">
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
          <AuthWidget
            onOpenHistory={() => setShowHistory(true)}
            onOpenFeedback={() => {
              setErrorContext(undefined);
              setShowFeedback(true);
            }}
          />
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-4xl mx-auto px-4 py-12">
        {/* Hero */}
        <div className="text-center mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-stone-900 tracking-tight">
            Audit any YouTube channel
          </h1>
          <p className="text-stone-500 mt-2 text-sm sm:text-base max-w-lg mx-auto">
            Get a data-backed analysis with performance tiers, title patterns, duration sweet spots, and AI recommendations.
          </p>
        </div>

        {/* Input */}
        <ChannelInput onSubmit={handleSubmit} isLoading={isLoading} />

        {/* Progress + Results */}
        <div className="mt-8 flex flex-col gap-6">
          {showProgress && <ProgressSteps steps={steps} />}

          {paywall && (
            <PaywallBanner
              count={paywall.count}
              limit={paywall.limit}
              reason={paywall.reason as "signin" | "pro"}
            />
          )}

          {error && !paywall && (
            <div className="w-full max-w-xl mx-auto bg-red-50 border border-red-100 rounded-xl p-4 text-center">
              <p className="text-sm text-red-700">{error}</p>
              <button
                onClick={() => {
                  setErrorContext({ error, channelUrl: inputValue });
                  setShowFeedback(true);
                }}
                className="text-xs text-red-500 hover:text-red-700 mt-2 underline"
              >
                Report issue
              </button>
            </div>
          )}

          {analysis && (
            <AnalysisReport
              analysis={analysis}
              recommendations={recommendations}
              recommendationsLoading={recommendationsLoading}
              auditId={auditId}
            />
          )}
        </div>
      </main>

      {/* History panel */}
      <HistoryPanel
        open={showHistory}
        onClose={() => setShowHistory(false)}
        onSelect={handleHistorySelect}
      />

      {/* Feedback modal */}
      <FeedbackModal
        open={showFeedback}
        onClose={() => setShowFeedback(false)}
        errorContext={errorContext}
      />
    </div>
  );
}
