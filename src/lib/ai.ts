import OpenAI from "openai";
import type { ChannelAnalysis } from "./analysis";
import type { ChannelInfo } from "./youtube";

// ---- Gemini ----

interface GeminiResponse {
  candidates?: {
    content?: {
      parts?: { text?: string }[];
    };
  }[];
}

async function callGemini(
  systemPrompt: string,
  userPrompt: string,
  temperature: number
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) throw new Error("GEMINI_API_KEY not set");

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
  const combinedText = `${systemPrompt}\n\n---\n\n${userPrompt}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: combinedText }] }],
      generationConfig: {
        temperature,
        responseMimeType: "application/json",
      },
    }),
    signal: AbortSignal.timeout(90_000),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Gemini API ${res.status}: ${body.slice(0, 300)}`);
  }

  const data = (await res.json()) as GeminiResponse;
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
  if (!text) throw new Error("Gemini returned empty content");
  return text;
}

// ---- DeepSeek ----

let _deepseek: OpenAI | null = null;

function getDeepSeek(): OpenAI {
  if (!_deepseek) {
    const key = process.env.DEEPSEEK_API_KEY?.trim();
    if (!key) throw new Error("DEEPSEEK_API_KEY not set");
    _deepseek = new OpenAI({
      apiKey: key,
      baseURL: "https://api.deepseek.com",
      timeout: 90_000,
      maxRetries: 2,
    });
  }
  return _deepseek;
}

async function callDeepSeek(
  systemPrompt: string,
  userPrompt: string,
  temperature: number
): Promise<string> {
  const client = getDeepSeek();
  const response = await client.chat.completions.create({
    model: "deepseek-chat",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    temperature,
    response_format: { type: "json_object" },
  });

  const text = response.choices[0]?.message?.content?.trim();
  if (!text) throw new Error("DeepSeek returned empty content");
  return text;
}

// ---- Fallback ----

async function callWithFallback(
  systemPrompt: string,
  userPrompt: string,
  temperature: number
): Promise<string> {
  const hasGemini = !!process.env.GEMINI_API_KEY?.trim();
  const hasDeepSeek = !!process.env.DEEPSEEK_API_KEY?.trim();

  if (!hasGemini && !hasDeepSeek) {
    throw new Error("No AI API key configured. Set GEMINI_API_KEY or DEEPSEEK_API_KEY.");
  }

  if (hasGemini) {
    try {
      return await callGemini(systemPrompt, userPrompt, temperature);
    } catch (err) {
      if (!hasDeepSeek) throw err;
      console.warn(
        "Gemini failed, falling back to DeepSeek:",
        err instanceof Error ? err.message : err
      );
    }
  }

  return await callDeepSeek(systemPrompt, userPrompt, temperature);
}

// ---- Recommendations ----

export interface Recommendation {
  title: string;
  detail: string;
  priority: "high" | "medium" | "low";
  category: string;
}

export async function generateRecommendations(
  analysis: ChannelAnalysis,
  channelInfo: ChannelInfo
): Promise<Recommendation[]> {
  const systemPrompt = `You are a YouTube strategy consultant. Given quantitative analysis data for a YouTube channel, generate 5-7 actionable, data-backed recommendations ranked by potential impact.

Each recommendation must:
- Reference specific data points from the analysis
- Be actionable (what to do, not just what's wrong)
- Include the "why" backed by the numbers
- Be prioritized (high/medium/low)

Categories: "content", "packaging", "format", "schedule", "growth"

Respond ONLY with valid JSON:
{
  "recommendations": [
    {
      "title": "Short actionable title",
      "detail": "2-3 sentence explanation with specific data references",
      "priority": "high|medium|low",
      "category": "content|packaging|format|schedule|growth"
    }
  ]
}`;

  // Build the data summary for the AI
  const topPatterns = analysis.titlePatterns
    .filter((p) => p.matchCount >= 3)
    .sort((a, b) => b.lift - a.lift)
    .slice(0, 6);

  const bestDuration = analysis.durationBuckets.find((b) => b.isBest);
  const recentMonths = analysis.uploadCadence.monthly.slice(-6);

  const userPrompt = `## Channel: ${channelInfo.title}
- Subscribers: ${channelInfo.subscriberCount.toLocaleString()}
- Total videos: ${analysis.totalVideos}
- Long-form: ${analysis.longFormCount}, Shorts: ${analysis.shortsCount}
- Median views (long-form): ${analysis.medianViews.toLocaleString()}
- Average views (long-form): ${analysis.avgViews.toLocaleString()}
- Engagement rate: ${analysis.engagementRate}%

## Performance Tiers
${analysis.performanceTiers.map((t) => `- ${t.label} (${t.threshold.toLocaleString()}+ views): ${t.count} videos (${t.percentage}%)`).join("\n")}

## Top 10 Videos
${analysis.topVideos.map((v, i) => `${i + 1}. "${v.title}" — ${v.viewCount.toLocaleString()} views`).join("\n")}

## Format Split
- Shorts: ${analysis.formatSplit.shorts.count} videos, median ${analysis.formatSplit.shorts.medianViews.toLocaleString()} views
- Long-form: ${analysis.formatSplit.longForm.count} videos, median ${analysis.formatSplit.longForm.medianViews.toLocaleString()} views

## Title Patterns (lift %)
${topPatterns.map((p) => `- ${p.name}: ${p.lift > 0 ? "+" : ""}${p.lift}% (${p.matchCount} videos)`).join("\n")}

## Duration Sweet Spot
${bestDuration ? `Best: ${bestDuration.label} — median ${bestDuration.medianViews.toLocaleString()} views (${bestDuration.count} videos)` : "No clear sweet spot"}
${analysis.durationBuckets.filter((b) => b.count >= 3).map((b) => `- ${b.label}: median ${b.medianViews.toLocaleString()} views (${b.count} videos)`).join("\n")}

## Upload Cadence
- Average: ${analysis.uploadCadence.avgUploadsPerMonth} uploads/month
- Recent 6 months: ${recentMonths.map((m) => `${m.month}: ${m.count} videos, avg ${m.avgViews.toLocaleString()} views`).join("; ")}

## Yearly Trend
${analysis.uploadCadence.yearly.map((y) => `- ${y.year}: ${y.count} videos, median ${y.medianViews.toLocaleString()} views`).join("\n")}`;

  const content = await callWithFallback(systemPrompt, userPrompt, 0.7);

  let parsed: { recommendations?: Recommendation[] };
  try {
    parsed = JSON.parse(content);
  } catch {
    throw new Error(`AI returned invalid JSON: ${content.slice(0, 200)}`);
  }

  if (!parsed.recommendations || !Array.isArray(parsed.recommendations)) {
    throw new Error("Invalid recommendations response");
  }

  return parsed.recommendations.slice(0, 7);
}
