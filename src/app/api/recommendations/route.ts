import { NextRequest, NextResponse } from "next/server";
import { generateRecommendations } from "@/lib/ai";
import { updateAuditRecommendations } from "@/lib/supabase";
import type { ChannelAnalysis } from "@/lib/analysis";
import type { ChannelInfo } from "@/lib/youtube";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const { analysis, channelInfo, auditId } = body || {};

  if (!analysis || !channelInfo) {
    return NextResponse.json(
      { error: "Analysis data and channel info required" },
      { status: 400 }
    );
  }

  try {
    const recommendations = await generateRecommendations(
      analysis as ChannelAnalysis,
      channelInfo as ChannelInfo
    );

    // Update the audit record with recommendations
    if (auditId) {
      await updateAuditRecommendations(auditId, recommendations);
    }

    return NextResponse.json({ recommendations });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to generate recommendations";
    console.error("Recommendations error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
