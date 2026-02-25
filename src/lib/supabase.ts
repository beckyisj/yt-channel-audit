import { createClient } from "@supabase/supabase-js";

export function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  );
}

export async function getUserFromToken(token: string) {
  const supabase = getServiceClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);
  if (error || !user) return null;
  return user;
}

export async function countAudits(
  userId?: string,
  sessionId?: string
): Promise<number> {
  const supabase = getServiceClient();

  if (userId) {
    const { count } = await supabase
      .from("channel_audits")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId);
    return count || 0;
  }

  if (sessionId) {
    const { count } = await supabase
      .from("channel_audits")
      .select("*", { count: "exact", head: true })
      .eq("session_id", sessionId)
      .is("user_id", null);
    return count || 0;
  }

  return 0;
}

export async function saveAudit(data: {
  userId?: string;
  sessionId?: string;
  channelId: string;
  channelTitle: string;
  channelThumbnail: string;
  channelSubs: number;
  analysisData: unknown;
  recommendations?: unknown;
}) {
  const supabase = getServiceClient();
  const { data: row, error } = await supabase
    .from("channel_audits")
    .insert({
      user_id: data.userId || null,
      session_id: data.sessionId || null,
      channel_id: data.channelId,
      channel_title: data.channelTitle,
      channel_thumbnail: data.channelThumbnail,
      channel_subs: data.channelSubs,
      analysis_data: data.analysisData,
      recommendations: data.recommendations || null,
    })
    .select("id")
    .single();
  return { data: row, error };
}

export async function updateAuditRecommendations(
  auditId: string,
  recommendations: unknown
) {
  const supabase = getServiceClient();
  return supabase
    .from("channel_audits")
    .update({ recommendations })
    .eq("id", auditId);
}

export async function getHistory(userId?: string, sessionId?: string) {
  const supabase = getServiceClient();

  let query = supabase
    .from("channel_audits")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(20);

  if (userId) {
    query = query.eq("user_id", userId);
  } else if (sessionId) {
    query = query.eq("session_id", sessionId).is("user_id", null);
  } else {
    return { data: [], error: null };
  }

  return query;
}

export async function migrateSessionToUser(
  sessionId: string,
  userId: string
) {
  const supabase = getServiceClient();
  return supabase
    .from("channel_audits")
    .update({ user_id: userId })
    .eq("session_id", sessionId)
    .is("user_id", null);
}
