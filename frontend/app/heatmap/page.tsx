"use client";

import { useEffect, useState, useCallback } from "react";
import { getTrackedPages, getHeatmapData, type HeatmapClick } from "@/lib/api";

const VIEWPORT_WIDTH = 1440;
const VIEWPORT_HEIGHT = 900;

function getHeatColor(intensity: number): string {
  // intensity: 0-1, maps through opacity of brand-primary (rgb 255, 164, 164)
  if (intensity < 0.25) {
    return `rgba(255, 164, 164, ${0.3 + intensity * 2})`; // low
  } else if (intensity < 0.5) {
    return `rgba(255, 164, 164, ${0.4 + intensity})`; // medium
  } else if (intensity < 0.75) {
    return `rgba(255, 164, 164, ${0.6 + intensity * 0.5})`; // high
  }
  return `rgba(255, 164, 164, ${0.8 + intensity * 0.2})`; // hotspot
}

export default function HeatmapPage() {
  const [pages, setPages] = useState<string[]>([]);
  const [selectedPage, setSelectedPage] = useState<string>("");
  const [clicks, setClicks] = useState<HeatmapClick[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagesLoading, setPagesLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load tracked pages
  useEffect(() => {
    async function loadPages() {
      try {
        const data = await getTrackedPages();
        setPages(data);
        if (data.length > 0) setSelectedPage(data[0]);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load pages");
      } finally {
        setPagesLoading(false);
      }
    }
    loadPages();
  }, []);

  // Load heatmap data when page changes
  const fetchHeatmap = useCallback(async () => {
    if (!selectedPage) return;
    try {
      setLoading(true);
      setError(null);
      const data = await getHeatmapData(selectedPage);
      setClicks(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load heatmap");
    } finally {
      setLoading(false);
    }
  }, [selectedPage]);

  useEffect(() => {
    if (!selectedPage) return;
    let cancelled = false;
    async function loadInitialHeatmap() {
      try {
        setLoading(true);
        const data = await getHeatmapData(selectedPage);
        if (!cancelled) {
          setClicks(data);
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load heatmap");
          setLoading(false);
        }
      }
    }
    loadInitialHeatmap();
    return () => { cancelled = true; };
  }, [selectedPage]);

  // Calculate density for color intensity
  const maxClicks = clicks.length;
  const getIntensity = (idx: number) =>
    maxClicks > 1 ? idx / maxClicks : 0.5;

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-brand-text tracking-tight">
          Click Heatmap
        </h1>
        <p className="text-brand-text/60 mt-1 text-sm">
          Visualize where users click most on your tracked pages
        </p>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-4 mb-6">
        <div className="flex-1 min-w-[250px]">
          <label className="block text-[10px] font-semibold uppercase tracking-wider text-brand-text/60 mb-2">
            Select Page
          </label>
          {pagesLoading ? (
            <div className="h-10 w-full skeleton rounded" />
          ) : (
            <select
              value={selectedPage}
              onChange={(e) => setSelectedPage(e.target.value)}
              className="w-full px-4 py-2.5 bg-white border border-brand-surface rounded text-sm text-brand-text focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-all appearance-none cursor-pointer shadow-sm"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%231F2937' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                backgroundPosition: "right 0.75rem center",
                backgroundSize: "1.25rem",
                backgroundRepeat: "no-repeat",
              }}
            >
              {pages.length === 0 && (
                <option value="">No pages tracked yet</option>
              )}
              {pages.map((page) => (
                <option key={page} value={page}>
                  {page}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="flex items-center gap-3 pt-5">
          <button
            onClick={fetchHeatmap}
            disabled={loading || !selectedPage}
            className="px-4 py-2.5 text-xs font-medium rounded bg-brand-primary text-white hover:bg-brand-hover transition-all disabled:opacity-50 shadow-sm"
          >
            {loading ? "Loading…" : "↻ Refresh"}
          </button>

          <div className="flex items-center gap-2 px-3 py-2.5 rounded bg-brand-surface/30 border border-brand-surface">
            <span className="text-[10px] uppercase tracking-wider text-brand-text/60 font-medium">
              Clicks:
            </span>
            <span className="text-sm font-bold text-brand-text">
              {clicks.length}
            </span>
          </div>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="rounded border border-red-500/20 bg-red-50 p-4 mb-6 text-sm text-red-600">
          <p className="font-medium">Error loading heatmap data</p>
          <p className="text-xs mt-1 text-red-500/80">{error}</p>
        </div>
      )}

      {/* Heatmap Viewport */}
      <div className="rounded border border-brand-surface overflow-hidden bg-white">
        {/* Viewport header */}
        <div className="flex items-center gap-2 px-4 py-2.5 border-b border-brand-surface bg-brand-surface/30">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-400" />
            <div className="w-3 h-3 rounded-full bg-yellow-400" />
            <div className="w-3 h-3 rounded-full bg-green-400" />
          </div>
          <div className="flex-1 mx-2 px-3 py-1 rounded bg-white border border-brand-surface">
            <p className="text-[11px] text-brand-text/60 font-mono truncate">
              {selectedPage || "Select a page to view heatmap"}
            </p>
          </div>
          <span className="text-[10px] text-brand-text/60">
            {VIEWPORT_WIDTH}×{VIEWPORT_HEIGHT}
          </span>
        </div>

        {/* Viewport area */}
        <div className="overflow-auto bg-brand-surface/10">
          <div
            className="relative bg-white"
            style={{
              width: VIEWPORT_WIDTH,
              height: VIEWPORT_HEIGHT,
              backgroundImage:
                "radial-gradient(circle at 1px 1px, rgba(31,41,55,0.08) 1px, transparent 0)",
              backgroundSize: "40px 40px",
            }}
          >
            {loading ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-10 h-10 rounded-full border-2 border-brand-primary border-t-transparent animate-spin mx-auto mb-3" />
                  <p className="text-sm text-brand-text/60">
                    Loading click data…
                  </p>
                </div>
              </div>
            ) : clicks.length === 0 ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-5xl mb-3">🖱️</div>
                  <p className="text-sm text-brand-text/60">
                    No click data for this page yet
                  </p>
                  <p className="text-xs text-brand-text/50 mt-1">
                    Visit the demo site and click around to generate data
                  </p>
                </div>
              </div>
            ) : (
              clicks.map((click, idx) => {
                if (click.meta.x == null || click.meta.y == null) return null;
                const intensity = getIntensity(idx);
                return (
                  <div
                    key={click._id}
                    className="absolute w-5 h-5 rounded-full -translate-x-1/2 -translate-y-1/2 animate-pulse-dot pointer-events-none"
                    style={{
                      left: click.meta.x,
                      top: click.meta.y,
                      backgroundColor: getHeatColor(intensity),
                      boxShadow: `0 0 12px 4px ${getHeatColor(intensity)}`,
                      animationDelay: `${(idx * 100) % 2000}ms`,
                    }}
                    title={`Click at (${Math.round(click.meta.x)}, ${Math.round(click.meta.y)})`}
                  />
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 mt-4 text-[10px] text-brand-text/60 uppercase tracking-wider">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'rgba(255, 164, 164, 0.4)' }} />
          <span>Low</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'rgba(255, 164, 164, 0.6)' }} />
          <span>Medium</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'rgba(255, 164, 164, 0.8)' }} />
          <span>High</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'rgba(255, 164, 164, 1.0)' }} />
          <span>Hotspot</span>
        </div>
      </div>
    </div>
  );
}
