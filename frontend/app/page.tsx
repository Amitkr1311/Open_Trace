"use client";

import { useEffect, useState, useCallback } from "react";
import {
  getSessions,
  getSessionEvents,
  type SessionSummary,
  type EventData,
} from "@/lib/api";

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function truncateId(id: string): string {
  return id.length > 12 ? `${id.slice(0, 8)}…${id.slice(-4)}` : id;
}

// ── Session Detail Modal ─────────────────────────────────────────────
function SessionModal({
  session,
  onClose,
}: {
  session: SessionSummary;
  onClose: () => void;
}) {
  const [events, setEvents] = useState<EventData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const data = await getSessionEvents(session.sessionId);
        if (!cancelled) setEvents(data);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load events");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [session.sessionId]);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-brand-text/40 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl max-h-[80vh] mx-4 rounded border border-brand-surface bg-brand-bg shadow-xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-brand-surface bg-white">
          <div>
            <h2 className="text-lg font-bold text-brand-text">Session Timeline</h2>
            <p className="text-xs text-brand-text/60 font-mono mt-0.5">
              {session.sessionId}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded flex items-center justify-center text-brand-text hover:text-brand-primary hover:bg-brand-hover/20 transition-all"
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        {/* Stats bar */}
        <div className="flex gap-4 px-6 py-3 border-b border-brand-surface bg-brand-surface/30">
          <div className="text-center">
            <p className="text-xs text-brand-text/60 font-medium">Events</p>
            <p className="text-sm font-bold text-brand-text">
              {session.totalEvents}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-brand-text/60 font-medium">Pages</p>
            <p className="text-sm font-bold text-brand-text">
              {session.pages.length}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-brand-text/60 font-medium">Started</p>
            <p className="text-sm font-semibold text-brand-text/80">
              {formatDate(session.startTime)}
            </p>
          </div>
        </div>

        {/* Timeline */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {loading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex gap-4">
                  <div className="w-3 h-3 rounded-full skeleton mt-1" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-24 skeleton" />
                    <div className="h-3 w-48 skeleton" />
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-8 text-red-400 text-sm">{error}</div>
          ) : (
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-[5px] top-2 bottom-2 w-[2px] bg-brand-surface" />

              <div className="space-y-0">
                {events.map((event, idx) => (
                  <div
                    key={event._id}
                    className="flex gap-4 relative group animate-slide-up"
                    style={{ animationDelay: `${idx * 50}ms` }}
                  >
                    {/* Dot */}
                    <div
                      className="relative z-10 mt-1.5 w-3 h-3 rounded-full border-2 shrink-0 transition-transform group-hover:scale-125 bg-brand-primary border-brand-primary"
                    />

                    {/* Event content */}
                    <div className="flex-1 pb-5 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded ${
                            event.eventType === "page_view"
                              ? "bg-brand-surface/50 text-brand-text"
                              : "bg-brand-hover/30 text-brand-text"
                          }`}
                        >
                          {event.eventType === "page_view" ? "👁 View" : "🖱 Click"}
                        </span>
                        <span className="text-[10px] text-brand-text/60">
                          {formatDate(event.timestamp)}
                        </span>
                      </div>
                      <p className="text-sm text-brand-text/80 truncate">
                        {event.pageUrl}
                      </p>
                      {event.eventType === "click" &&
                        event.meta.x != null &&
                        event.meta.y != null && (
                          <p className="text-[11px] text-brand-text/50 mt-0.5 font-mono">
                            coords: ({Math.round(event.meta.x)},{" "}
                            {Math.round(event.meta.y)})
                          </p>
                        )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main Sessions Page ──────────────────────────────────────────────
export default function SessionsPage() {
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSession, setSelectedSession] = useState<SessionSummary | null>(null);

  const fetchSessions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getSessions();
      setSessions(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load sessions");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function loadInitialSessions() {
      try {
        const data = await getSessions();
        if (!cancelled) {
          setSessions(data);
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load sessions");
          setLoading(false);
        }
      }
    }
    loadInitialSessions();
    return () => { cancelled = true; };
  }, []);

  const totalEvents = sessions.reduce((sum, s) => sum + s.totalEvents, 0);
  const totalPages = new Set(sessions.flatMap((s) => s.pages)).size;

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-brand-text tracking-tight">
          Session Explorer
        </h1>
        <p className="text-brand-text/60 mt-1 text-sm">
          Track and analyze user sessions across your application
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="rounded border border-brand-surface bg-white p-5 hover:border-brand-primary transition-colors group">
          <p className="text-xs text-brand-text/60 uppercase tracking-wider font-medium mb-1">
            Total Sessions
          </p>
          <p className="text-3xl font-extrabold text-brand-text group-hover:text-brand-primary transition-colors">
            {loading ? "—" : sessions.length}
          </p>
        </div>
        <div className="rounded border border-brand-surface bg-white p-5 hover:border-brand-primary transition-colors group">
          <p className="text-xs text-brand-text/60 uppercase tracking-wider font-medium mb-1">
            Total Events
          </p>
          <p className="text-3xl font-extrabold text-brand-text group-hover:text-brand-primary transition-colors">
            {loading ? "—" : totalEvents}
          </p>
        </div>
        <div className="rounded border border-brand-surface bg-white p-5 hover:border-brand-primary transition-colors group">
          <p className="text-xs text-brand-text/60 uppercase tracking-wider font-medium mb-1">
            Unique Pages
          </p>
          <p className="text-3xl font-extrabold text-brand-text group-hover:text-brand-primary transition-colors">
            {loading ? "—" : totalPages}
          </p>
        </div>
      </div>

      {/* Refresh button */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-brand-text">All Sessions</h2>
        <button
          onClick={fetchSessions}
          disabled={loading}
          className="px-4 py-2 text-xs font-medium rounded bg-brand-primary text-white hover:bg-brand-hover transition-all disabled:opacity-50"
        >
          {loading ? "Loading…" : "↻ Refresh"}
        </button>
      </div>

      {/* Error state */}
      {error && (
        <div className="rounded border border-red-500/20 bg-red-50 p-4 mb-6 text-sm text-red-600">
          <p className="font-medium">Failed to load sessions</p>
          <p className="text-xs mt-1 text-red-500/80">{error}</p>
          <button
            onClick={fetchSessions}
            className="mt-2 text-xs underline text-red-500 hover:text-red-600"
          >
            Try again
          </button>
        </div>
      )}

      {/* Loading state */}
      {loading && !error && (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="rounded border border-brand-surface bg-white p-5"
            >
              <div className="flex items-center gap-4">
                <div className="h-5 w-32 skeleton" />
                <div className="h-4 w-16 skeleton" />
                <div className="flex-1" />
                <div className="h-4 w-24 skeleton" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && sessions.length === 0 && (
        <div className="text-center py-16 rounded border border-dashed border-brand-surface bg-white">
          <div className="text-5xl mb-4">📭</div>
          <h3 className="text-xl font-bold text-brand-text mb-2">No sessions yet</h3>
          <p className="text-sm text-brand-text/60 max-w-md mx-auto">
            Open the demo site and interact with it to generate tracking events.
            Sessions will appear here in real-time.
          </p>
        </div>
      )}

      {/* Sessions table */}
      {!loading && !error && sessions.length > 0 && (
        <div className="rounded border border-brand-surface overflow-hidden bg-white">
          <table className="w-full">
            <thead>
              <tr className="border-b border-brand-surface bg-brand-surface">
                <th className="text-left px-5 py-3 text-[10px] font-semibold uppercase tracking-wider text-brand-text/70">
                  Session ID
                </th>
                <th className="text-center px-5 py-3 text-[10px] font-semibold uppercase tracking-wider text-brand-text/70">
                  Events
                </th>
                <th className="text-center px-5 py-3 text-[10px] font-semibold uppercase tracking-wider text-brand-text/70">
                  Pages
                </th>
                <th className="text-right px-5 py-3 text-[10px] font-semibold uppercase tracking-wider text-brand-text/70">
                  Started
                </th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((session, idx) => (
                <tr
                  key={session.sessionId}
                  onClick={() => setSelectedSession(session)}
                  className="border-b border-brand-surface/50 cursor-pointer hover:bg-brand-surface/30 transition-colors animate-slide-up group"
                  style={{ animationDelay: `${idx * 40}ms` }}
                >
                  <td className="px-5 py-4">
                    <span className="font-mono text-sm text-brand-text group-hover:text-brand-primary transition-colors">
                      {truncateId(session.sessionId)}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-center">
                    <span className="inline-flex items-center justify-center min-w-[2rem] px-2 py-0.5 rounded-full text-xs font-bold bg-brand-primary/20 text-brand-primary">
                      {session.totalEvents}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-center">
                    <span className="text-sm text-brand-text/60">
                      {session.pages.length}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <span className="text-xs text-brand-text/60">
                      {timeAgo(session.startTime)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Session detail modal */}
      {selectedSession && (
        <SessionModal
          session={selectedSession}
          onClose={() => setSelectedSession(null)}
        />
      )}
    </div>
  );
}
