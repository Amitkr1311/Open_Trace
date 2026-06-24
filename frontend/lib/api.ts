const API_BASE = process.env.NEXT_PUBLIC_API_URL;

if (!API_BASE) {
  throw new Error("FATAL ERROR: NEXT_PUBLIC_API_URL is not defined in environment variables.");
}

export interface SessionSummary {
  sessionId: string;
  totalEvents: number;
  startTime: string;
  lastActivity: string;
  pages: string[];
}

export interface EventData {
  _id: string;
  sessionId: string;
  eventType: "page_view" | "click";
  pageUrl: string;
  timestamp: string;
  meta: {
    x?: number;
    y?: number;
  };
}

export interface HeatmapClick {
  _id: string;
  sessionId: string;
  meta: {
    x?: number;
    y?: number;
  };
  timestamp: string;
}

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE}${path}`;
  let res: Response;
  try {
    res = await fetch(url, {
      ...options,
      cache: "no-store",
    });
  } catch (error) {
    // This catches network errors (like ERR_CONNECTION_REFUSED when backend is down)
    console.error("apiFetch network error:", error);
    throw new Error("Unable to connect to the Analytics API. Please check if the backend is running.");
  }

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: "Request failed" }));
    throw new Error(error.error || `API error: ${res.status}`);
  }

  return res.json();
}

export async function getSessions(): Promise<SessionSummary[]> {
  return apiFetch<SessionSummary[]>("/api/sessions");
}

export async function getSessionEvents(
  sessionId: string
): Promise<EventData[]> {
  return apiFetch<EventData[]>(
    `/api/sessions/${encodeURIComponent(sessionId)}/events`
  );
}

export async function getHeatmapData(
  pageUrl: string
): Promise<HeatmapClick[]> {
  return apiFetch<HeatmapClick[]>(
    `/api/heatmap?pageUrl=${encodeURIComponent(pageUrl)}`
  );
}

export async function getTrackedPages(): Promise<string[]> {
  return apiFetch<string[]>("/api/pages");
}
