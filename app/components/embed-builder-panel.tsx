"use client";

import { useEffect, useMemo, useState } from "react";
import { encodePdfSrcForPath, resolvePdfSrc } from "../lib/pdf";

type ThemeChoice = "light" | "dark" | "system";

const resolveStartPage = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Number.parseInt(trimmed, 10);
  if (!Number.isFinite(parsed) || parsed < 1) return null;
  return parsed;
};

const normalizeDimension = (value: string, fallback: string) => {
  const trimmed = value.trim();
  if (!trimmed) return fallback;
  return /^\d+$/.test(trimmed) ? `${trimmed}px` : trimmed;
};

const isTaggedShortcut = (value: string) =>
  value.startsWith("arxiv:") || value.startsWith("hitomi:");

export function EmbedBuilderPanel() {
  const [srcInput, setSrcInput] = useState("");
  const [toolbar, setToolbar] = useState(true);
  const [header, setHeader] = useState(false);
  const [theme, setTheme] = useState<ThemeChoice>("light");
  const [heightInput, setHeightInput] = useState("600");
  const [widthInput, setWidthInput] = useState("100%");
  const [startPageInput, setStartPageInput] = useState("");
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    setOrigin(window.location.origin);
  }, []);

  const resolved = useMemo(() => {
    const trimmed = srcInput.trim();
    if (!trimmed) return "";
    if (isTaggedShortcut(trimmed)) return trimmed;
    return resolvePdfSrc(trimmed);
  }, [srcInput]);

  const startPage = useMemo(
    () => resolveStartPage(startPageInput),
    [startPageInput],
  );

  const embedPath = useMemo(() => {
    if (!resolved) return "";
    const base = isTaggedShortcut(resolved)
      ? `/embed/${encodeURIComponent(resolved)}`
      : `/embed/${encodePdfSrcForPath(resolved)}`;
    const params = new URLSearchParams();
    if (startPage) params.set("page", String(startPage));
    if (toolbar) params.set("toolbar", "1");
    if (header) params.set("header", "1");
    if (theme) params.set("theme", theme);
    const query = params.toString();
    return `${base}${query ? `?${query}` : ""}`;
  }, [resolved, startPage, toolbar, header, theme]);

  const fullUrl = embedPath ? `${origin || ""}${embedPath}` : "";
  const widthValue = normalizeDimension(widthInput, "100%");
  const heightValue = normalizeDimension(heightInput, "600px");

  const iframeCode = embedPath
    ? `<iframe src="${fullUrl || embedPath}" style="width:${widthValue};height:${heightValue};border:0;" loading="lazy" title="Embedded document"></iframe>`
    : "";

  const hasInput = Boolean(srcInput.trim());
  const isInvalid = hasInput && !resolved;

  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-black/5 bg-white/90 p-6 shadow-sm">
        <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-emerald-600">
          Embed options
        </p>
        <h2 className="mt-3 font-display text-2xl text-slate-900">
          Build shareable embeds
        </h2>
        <p className="mt-2 text-sm text-slate-500">
          Works for PDFs, HTML, Markdown, Jupyter notebooks (.ipynb), and text. Public URLs only.
        </p>

        <div className="mt-6 grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
          <div className="space-y-3">
            <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              Document URL
            </label>
            <input
              value={srcInput}
              onChange={(event) => setSrcInput(event.target.value)}
              placeholder="https://example.com/file.pdf"
              className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
            />
            {isInvalid ? (
              <p className="text-xs text-rose-500">
                Enter a valid http or https URL.
              </p>
            ) : null}
          </div>
          <div className="space-y-3">
            <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              Start page
            </label>
            <input
              value={startPageInput}
              onChange={(event) => setStartPageInput(event.target.value)}
              placeholder="1"
              inputMode="numeric"
              className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-black/5 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
              Display
            </p>
            <div className="mt-4 flex flex-wrap gap-2 text-xs">
              <label className="flex items-center gap-2 rounded-full border border-black/10 bg-white px-3 py-2">
                <input
                  type="checkbox"
                  checked={toolbar}
                  onChange={(event) => setToolbar(event.target.checked)}
                />
                Toolbar
              </label>
              <label className="flex items-center gap-2 rounded-full border border-black/10 bg-white px-3 py-2">
                <input
                  type="checkbox"
                  checked={header}
                  onChange={(event) => setHeader(event.target.checked)}
                />
                Header
              </label>
            </div>
            <div className="mt-4">
              <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                Theme
              </label>
              <select
                value={theme}
                onChange={(event) =>
                  setTheme(event.target.value as ThemeChoice)
                }
                className="mt-2 w-full rounded-2xl border border-black/10 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
                <option value="system">System</option>
              </select>
            </div>
          </div>

          <div className="rounded-2xl border border-black/5 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
              Frame size
            </p>
            <div className="mt-4 grid gap-3">
              <input
                value={widthInput}
                onChange={(event) => setWidthInput(event.target.value)}
                placeholder="100%"
                className="w-full rounded-2xl border border-black/10 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
              />
              <input
                value={heightInput}
                onChange={(event) => setHeightInput(event.target.value)}
                placeholder="600"
                className="w-full rounded-2xl border border-black/10 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
              />
              <p className="text-[11px] text-slate-400">
                Tip: numeric values are treated as pixels.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid min-w-0 gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="min-w-0 rounded-3xl border border-black/5 bg-white/90 p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-400">
                Iframe code
              </p>
              <h3 className="mt-2 font-display text-xl text-slate-900">
                Copy and paste
              </h3>
            </div>
            <button
              type="button"
              onClick={() => {
                if (iframeCode) {
                  navigator.clipboard.writeText(iframeCode);
                }
              }}
              className="rounded-full bg-emerald-600 px-5 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white transition hover:bg-emerald-700 disabled:opacity-60"
              disabled={!iframeCode}
            >
              Copy
            </button>
          </div>
          <pre className="mt-4 w-full min-w-0 overflow-x-auto rounded-2xl bg-slate-900 p-4 text-xs text-slate-100">
            {iframeCode || "Add a document URL to generate an iframe."}
          </pre>
        </div>

        <div className="min-w-0 rounded-3xl border border-black/5 bg-white/90 p-6 shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-400">
            Embed URL
          </p>
          <h3 className="mt-2 font-display text-xl text-slate-900">
            Share the viewer
          </h3>
          <p className="mt-2 text-sm text-slate-500">
            Use this link for iframes or direct sharing.
          </p>
          <div className="mt-4 break-all rounded-2xl border border-black/5 bg-slate-50 p-4 text-xs text-emerald-700">
            {fullUrl || "Waiting for a valid URL..."}
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                if (fullUrl) {
                  navigator.clipboard.writeText(fullUrl);
                }
              }}
              className="rounded-full border border-black/10 bg-white px-4 py-2 text-xs font-semibold text-slate-600 transition hover:border-emerald-200 hover:text-emerald-700 disabled:opacity-60"
              disabled={!fullUrl}
            >
              Copy URL
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
