"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getOrCreateSessionId } from "@/lib/session";

interface Audit {
  id: string;
  channel_title: string;
  channel_thumbnail: string;
  channel_subs: number;
  analysis_data: unknown;
  recommendations: unknown;
  created_at: string;
}

interface HistoryPanelProps {
  open: boolean;
  onClose: () => void;
  onSelect: (audit: Audit) => void;
}

function formatSubs(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

export default function HistoryPanel({ open, onClose, onSelect }: HistoryPanelProps) {
  const { session } = useAuth();
  const [audits, setAudits] = useState<Audit[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);

    const headers: Record<string, string> = {};
    if (session?.access_token) {
      headers.Authorization = `Bearer ${session.access_token}`;
    }
    const sessionId = getOrCreateSessionId();
    const url = `/api/audit-history${!session ? `?sessionId=${sessionId}` : ""}`;

    fetch(url, { headers })
      .then((r) => r.json())
      .then((data) => setAudits(data.audits || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [open, session]);

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/20 z-40" onClick={onClose} />
      <div className="fixed right-0 top-0 bottom-0 w-full max-w-sm bg-white border-l border-stone-200 z-50 flex flex-col shadow-lg">
        <div className="flex items-center justify-between p-4 border-b border-stone-100">
          <h2 className="font-semibold text-stone-900">Audit History</h2>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-stone-600 transition-colors"
          >
            <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <p className="text-sm text-stone-400 text-center py-8">Loading...</p>
          ) : audits.length === 0 ? (
            <p className="text-sm text-stone-400 text-center py-8">
              No audits yet. Analyze a channel to get started.
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {audits.map((audit) => (
                <button
                  key={audit.id}
                  onClick={() => onSelect(audit)}
                  className="text-left bg-stone-50 hover:bg-stone-100 rounded-lg p-3 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {audit.channel_thumbnail && (
                      <img
                        src={audit.channel_thumbnail}
                        alt=""
                        className="w-8 h-8 rounded-full flex-shrink-0"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-stone-800 truncate">
                        {audit.channel_title}
                      </p>
                      <p className="text-xs text-stone-400">
                        {formatSubs(audit.channel_subs)} subs &middot;{" "}
                        {new Date(audit.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
