import { NextRequest, NextResponse } from "next/server";
import { resolveChannel, fetchAllChannelVideos } from "@/lib/youtube";
import { analyzeChannel } from "@/lib/analysis";
import { getUserFromToken, countAudits, saveAudit } from "@/lib/supabase";

const FREE_LIMIT = 1; // 1st audit free (anonymous), 2nd-3rd require sign-in, 4th+ require Pro

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const { input, sessionId } = body || {};

  if (!input?.trim()) {
    return NextResponse.json({ error: "Channel URL or handle required" }, { status: 400 });
  }

  // Auth (optional)
  const token = request.headers.get("authorization")?.replace("Bearer ", "");
  const user = token ? await getUserFromToken(token) : null;

  // Check paywall
  const auditCount = await countAudits(user?.id, sessionId);

  if (auditCount >= 3 && !user) {
    // Need to sign in
    return NextResponse.json({
      paywall: true,
      reason: "signin",
      count: auditCount,
      limit: 3,
    });
  }

  // Check Pro requirement (will be checked after analysis for Pro gate)

  try {
    // Step 1: Resolve channel
    const channelInfo = await resolveChannel(input);

    // Step 2: Fetch all videos
    const videos = await fetchAllChannelVideos(channelInfo.channelId);

    if (videos.length === 0) {
      return NextResponse.json(
        { error: "No videos found for this channel" },
        { status: 400 }
      );
    }

    // Step 3: Run analysis
    const analysis = analyzeChannel(videos, channelInfo);

    // Step 4: Save to DB
    const { data: audit } = await saveAudit({
      userId: user?.id,
      sessionId: sessionId || undefined,
      channelId: channelInfo.channelId,
      channelTitle: channelInfo.title,
      channelThumbnail: channelInfo.thumbnail,
      channelSubs: channelInfo.subscriberCount,
      analysisData: analysis,
    });

    // Check if Pro required (4th+ audit for signed-in users)
    // We check subscription via header from frontend
    const needsPro = auditCount >= 3 && user;

    return NextResponse.json({
      analysis,
      channelInfo,
      auditId: audit?.id || null,
      videoCount: videos.length,
      needsPro: needsPro || false,
      auditCount: auditCount + 1,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Analysis failed";
    console.error("Analyze error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
