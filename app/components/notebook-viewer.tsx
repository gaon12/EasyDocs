"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import remarkGfm from "remark-gfm";
import { applyHighlights } from "@/app/lib/text-search";
import {
  ensureExtension,
  getFileNameFromUrl,
  printHtml,
  triggerDownload,
} from "@/app/lib/download";
import { resolveProxyUrl } from "@/app/lib/proxy";
import { subscribeToViewerDownload } from "@/app/lib/viewer-download";
import { ViewerErrorState } from "./viewer-error";

interface NotebookViewerProps {
  fileKey?: string;
  url?: string;
  page?: number | null;
  showHomeLink?: boolean;
  showToolbar?: boolean;
  documentLabel?: string;
  theme?: "light" | "dark" | "system";
  useProxy?: boolean;
}

type ViewerError = {
  title: string;
  description: string;
  details?: string;
};

type NotebookOutput =
  | { kind: "stream"; text: string; name?: string }
  | { kind: "text"; text: string }
  | { kind: "image"; dataUrl: string; alt: string }
  | { kind: "error"; name: string; value: string; traceback: string };

type NotebookCell = {
  id: string;
  cellType: "markdown" | "code" | "raw";
  source: string;
  outputs: NotebookOutput[];
  executionCount: number | null;
};

type NotebookData = {
  cells: NotebookCell[];
  language?: string;
};

const resolveAssetUrl = (
  value: string | undefined,
  baseUrl: string | undefined,
  useProxy: boolean,
) => {
  if (!value) return "";
  if (!useProxy) return value;
  let resolved = value;
  if (baseUrl) {
    try {
      resolved = new URL(value, baseUrl).toString();
    } catch {
      resolved = value;
    }
  }
  return resolveProxyUrl(resolved, useProxy);
};

const normalizeSource = (value: unknown): string => {
  if (Array.isArray(value)) return value.join("");
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  return "";
};

const toPlainTextFromHtml = (value: string): string => {
  if (typeof DOMParser !== "undefined") {
    const doc = new DOMParser().parseFromString(value, "text/html");
    return doc.body.textContent ?? "";
  }
  return value.replace(/<[^>]*>/g, "");
};

const parseOutputs = (outputs: unknown): NotebookOutput[] => {
  if (!Array.isArray(outputs)) return [];
  const parsed: NotebookOutput[] = [];

  outputs.forEach((output) => {
    if (!output || typeof output !== "object") return;
    const record = output as Record<string, unknown>;
    const outputType = String(record.output_type ?? "");

    if (outputType === "stream") {
      const text = normalizeSource(record.text);
      if (text) {
        parsed.push({
          kind: "stream",
          text,
          name: typeof record.name === "string" ? record.name : undefined,
        });
      }
      return;
    }

    if (outputType === "error") {
      const name = typeof record.ename === "string" ? record.ename : "Error";
      const value = typeof record.evalue === "string" ? record.evalue : "";
      const tracebackRaw = Array.isArray(record.traceback)
        ? record.traceback.map((line) => String(line)).join("\n")
        : "";
      parsed.push({
        kind: "error",
        name,
        value,
        traceback: tracebackRaw,
      });
      return;
    }

    if (outputType === "execute_result" || outputType === "display_data") {
      const data = record.data as Record<string, unknown> | undefined;
      if (!data) return;
      const text = normalizeSource(data["text/plain"]);
      if (text) {
        parsed.push({ kind: "text", text });
        return;
      }
      const html = normalizeSource(data["text/html"]);
      if (html) {
        parsed.push({ kind: "text", text: toPlainTextFromHtml(html) });
        return;
      }
      const png = normalizeSource(data["image/png"]);
      if (png) {
        parsed.push({
          kind: "image",
          dataUrl: `data:image/png;base64,${png}`,
          alt: "Notebook output",
        });
        return;
      }
      const jpeg = normalizeSource(data["image/jpeg"]);
      if (jpeg) {
        parsed.push({
          kind: "image",
          dataUrl: `data:image/jpeg;base64,${jpeg}`,
          alt: "Notebook output",
        });
      }
    }
  });

  return parsed;
};

const parseNotebook = (raw: string): NotebookData => {
  const parsed = JSON.parse(raw) as Record<string, unknown>;
  const cellsRaw = Array.isArray(parsed?.cells) ? parsed.cells : [];
  const metadata = parsed?.metadata as Record<string, unknown> | undefined;
  const language =
    (metadata?.language_info as Record<string, unknown> | undefined)?.name;

  const cells = cellsRaw.map((cell, index) => {
    const record = cell as Record<string, unknown>;
    const cellTypeRaw = String(record.cell_type ?? "");
    const cellType =
      cellTypeRaw === "markdown" || cellTypeRaw === "code" ? cellTypeRaw : "raw";
    const executionCountRaw = record.execution_count;
    const executionCount =
      typeof executionCountRaw === "number" && Number.isFinite(executionCountRaw)
        ? executionCountRaw
        : null;

    return {
      id: typeof record.id === "string" ? record.id : `cell-${index}`,
      cellType,
      source: normalizeSource(record.source),
      outputs: cellType === "code" ? parseOutputs(record.outputs) : [],
      executionCount,
    } satisfies NotebookCell;
  });

  return {
    cells,
    language: typeof language === "string" ? language : undefined,
  };
};

export function NotebookViewer({
  fileKey,
  url,
  page,
  showHomeLink = false,
  showToolbar = false,
  documentLabel,
  theme = "light",
  useProxy = false,
}: NotebookViewerProps) {
  const [rawContent, setRawContent] = useState("");
  const [notebook, setNotebook] = useState<NotebookData | null>(null);
  const [error, setError] = useState<ViewerError | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [matchCount, setMatchCount] = useState(0);
  const [activeMatchIndex, setActiveMatchIndex] = useState(0);
  const [fileName, setFileName] = useState("");
  const [localFile, setLocalFile] = useState<File | null>(null);
  const [systemTheme, setSystemTheme] = useState<"light" | "dark">("light");
  const contentRef = useRef<HTMLDivElement | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const resolvedBaseUrl = url || undefined;

  useEffect(() => {
    let active = true;

    async function loadNotebook() {
      try {
        setError(null);
        setIsLoading(true);
        setRawContent("");
        setNotebook(null);
        setLocalFile(null);
        setFileName("");

        let text = "";
        let name = "";
        let local: File | null = null;

        if (fileKey) {
          const { getLocalFile } = await import("@/app/lib/local-files");
          const file = await getLocalFile(fileKey);

          if (!active) return;
          if (!file) {
            setError({
              title: "Local upload unavailable",
              description:
                "This local upload is no longer available. Please upload it again to continue.",
            });
            setIsLoading(false);
            return;
          }

          text = await file.text();
          name = file.name;
          local = file;
        } else if (url) {
          const response = await fetch(resolveProxyUrl(url, useProxy));
          if (!active) return;
          if (!response.ok) {
            setError({
              title: "Couldn't load the notebook",
              description:
                "The link might be unavailable or blocked. Check the URL and try again.",
              details: `${response.status} ${response.statusText}`,
            });
            setIsLoading(false);
            return;
          }
          text = await response.text();
          name = getFileNameFromUrl(url) || documentLabel || "";
        }

        if (!active) return;
        setRawContent(text);
        setFileName(name);
        setLocalFile(local);

        try {
          const parsed = parseNotebook(text);
          if (!active) return;
          setNotebook(parsed);
          setIsLoading(false);
        } catch (parseError) {
          if (!active) return;
          setError({
            title: "Unsupported notebook",
            description: "We could not read this .ipynb file.",
            details:
              parseError instanceof Error ? parseError.message : undefined,
          });
          setIsLoading(false);
        }
      } catch (err) {
        if (!active) return;
        setError({
          title: "Something went wrong",
          description: "We could not load this notebook.",
          details: err instanceof Error ? err.message : undefined,
        });
        setIsLoading(false);
      }
    }

    loadNotebook();

    return () => {
      active = false;
    };
  }, [fileKey, url, documentLabel, useProxy]);

  useEffect(() => {
    setQuery("");
    setMatchCount(0);
    setActiveMatchIndex(0);
  }, [fileKey, url]);

  useEffect(() => {
    setActiveMatchIndex(0);
  }, [query]);

  useEffect(() => {
    if (!showToolbar) return;
    const root = contentRef.current;
    if (!root) return;
    const { count } = applyHighlights(root, query);
    setMatchCount(count);
    setActiveMatchIndex((current) => {
      if (count <= 0) return 0;
      return Math.min(current, count - 1);
    });
  }, [query, notebook, showToolbar]);

  useEffect(() => {
    if (!showToolbar) return;
    if (!query.trim()) return;
    if (matchCount <= 0) return;
    const root = contentRef.current;
    if (!root) return;
    const matches = Array.from(
      root.querySelectorAll("mark[data-highlight='true']"),
    ) as HTMLElement[];
    if (!matches.length) return;

    const normalizedIndex =
      ((activeMatchIndex % matches.length) + matches.length) % matches.length;

    root
      .querySelectorAll("mark[data-highlight='true'][data-active='true']")
      .forEach((mark) => {
        mark.removeAttribute("data-active");
        (mark as HTMLElement).style.backgroundColor = "";
        (mark as HTMLElement).style.outline = "";
        (mark as HTMLElement).style.borderRadius = "";
      });

    const active = matches[normalizedIndex];
    active.dataset.active = "true";
    active.style.backgroundColor = "rgba(16, 185, 129, 0.35)";
    active.style.outline = "2px solid rgba(16, 185, 129, 0.65)";
    active.style.borderRadius = "2px";
    active.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [activeMatchIndex, matchCount, query, showToolbar]);

  useEffect(() => {
    if (!page || page < 1) return;
    const container = scrollContainerRef.current;
    if (!container) return;
    const viewportHeight = container.clientHeight;
    if (!viewportHeight) return;
    const maxScroll = Math.max(0, container.scrollHeight - viewportHeight);
    const target = Math.min(Math.max((page - 1) * viewportHeight, 0), maxScroll);
    container.scrollTo({ top: target });
  }, [page, notebook]);

  useEffect(() => {
    if (theme !== "system") return;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const update = () => setSystemTheme(media.matches ? "dark" : "light");
    update();
    media.addEventListener("change", update);
    return () => {
      media.removeEventListener("change", update);
    };
  }, [theme]);

  const handleDownloadOriginal = useCallback(() => {
    if (isLoading) return;
    const resolvedName = ensureExtension(
      localFile?.name || fileName || documentLabel || "notebook",
      "ipynb",
    );
    const blob =
      localFile ??
      new Blob([rawContent], { type: "application/x-ipynb+json" });
    triggerDownload(blob, resolvedName);
  }, [documentLabel, fileName, isLoading, localFile, rawContent]);

  const handleSavePdf = useCallback(() => {
    if (isLoading) return;
    const title = documentLabel || fileName || "Notebook";
    const cloned = contentRef.current?.cloneNode(true) as HTMLElement | null;
    cloned
      ?.querySelectorAll("mark[data-highlight='true']")
      .forEach((mark) => mark.replaceWith(mark.textContent ?? ""));
    const bodyHtml = `<div class="notebook-print">${cloned?.innerHTML ?? ""}</div>`;
    printHtml({
      title,
      bodyHtml,
      styles:
        'body{margin:32px;font-family:var(--font-manrope,Segoe UI,sans-serif);color:#0f172a;} .notebook-print{display:flex;flex-direction:column;gap:16px;} .notebook-cell{border:1px solid #e2e8f0;border-radius:16px;overflow:hidden;} .notebook-cell-header{padding:8px 16px;background:#f8fafc;font-size:10px;text-transform:uppercase;letter-spacing:0.2em;color:#64748b;display:flex;justify-content:space-between;} .notebook-cell-body{padding:16px;} .notebook-code{background:#0f172a;color:#e2e8f0;padding:12px;border-radius:12px;white-space:pre-wrap;font-family:ui-monospace,monospace;font-size:12px;} .notebook-output{border-top:1px solid #e2e8f0;background:#f8fafc;padding:12px;} .notebook-output pre{white-space:pre-wrap;font-family:ui-monospace,monospace;font-size:12px;margin:0;} .notebook-output img{max-width:100%;height:auto;border-radius:8px;} .markdown-content{line-height:1.7;} .markdown-content h1{font-size:1.6rem;margin:1.5rem 0 .75rem;} .markdown-content h2{font-size:1.3rem;margin:1.25rem 0 .6rem;} .markdown-content h3{font-size:1.1rem;margin:1rem 0 .5rem;} .markdown-content p{margin:0 0 .75rem;} .markdown-content pre{background:#0f172a;color:#e2e8f0;padding:12px;border-radius:10px;overflow:auto;} @media print{body{margin:24px;}}',
    });
  }, [documentLabel, fileName, isLoading]);

  useEffect(() => {
    return subscribeToViewerDownload((detail) => {
      if (detail.kind === "original") {
        handleDownloadOriginal();
      }
      if (detail.kind === "pdf") {
        handleSavePdf();
      }
    });
  }, [handleDownloadOriginal, handleSavePdf]);

  const hasQuery = query.trim().length > 0;
  const matchLabel = hasQuery
    ? matchCount > 0
      ? `${activeMatchIndex + 1}/${matchCount}`
      : "No matches"
    : "Find text";

  const themeMode = theme === "system" ? systemTheme : theme;
  const containerClass =
    themeMode === "dark" ? "bg-slate-950 text-slate-100" : "bg-white text-slate-900";
  const toolbarClass =
    themeMode === "dark"
      ? "border-white/10 bg-slate-950/95 text-slate-200"
      : "border-black/5 bg-white/80 text-slate-600";
  const controlClass =
    themeMode === "dark"
      ? "border-white/10 bg-slate-900 text-slate-200"
      : "border-black/10 bg-white text-slate-600";
  const cellClass =
    themeMode === "dark"
      ? "border-white/10 bg-slate-900/60"
      : "border-black/10 bg-white";
  const cellHeaderClass =
    themeMode === "dark"
      ? "border-white/10 bg-slate-900 text-slate-400"
      : "border-black/5 bg-slate-50 text-slate-500";
  const outputClass =
    themeMode === "dark"
      ? "border-white/10 bg-slate-900"
      : "border-black/5 bg-slate-50";
  const codeClass =
    themeMode === "dark"
      ? "bg-slate-950 text-slate-100"
      : "bg-slate-900 text-slate-100";
  const outputTextClass =
    themeMode === "dark" ? "text-slate-300" : "text-slate-600";

  if (error) {
    return (
      <ViewerErrorState
        title={error.title}
        description={error.description}
        details={error.details}
        action={showHomeLink ? { label: "Back to open", href: "/open" } : undefined}
      />
    );
  }

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <div className={`flex h-full w-full flex-col ${containerClass}`}>
      {showToolbar ? (
        <div
          className={`flex flex-col gap-3 border-b px-4 py-3 sm:flex-row sm:items-center sm:justify-between ${toolbarClass}`}
        >
          <div className="flex flex-1 flex-wrap items-center gap-3">
            <div className="relative w-full max-w-xs">
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Find in notebook"
                className={`w-full rounded-lg border px-3 py-2 text-xs shadow-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 ${
                  themeMode === "dark"
                    ? "border-white/10 bg-slate-900 text-slate-100 placeholder:text-slate-500"
                    : "border-black/10 bg-white text-slate-700 placeholder:text-slate-400"
                }`}
                type="search"
                disabled={isLoading}
              />
              {query ? (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-400 transition hover:text-slate-600"
                >
                  X
                </button>
              ) : null}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs tabular-nums text-slate-500">
                {matchLabel}
              </span>
              {hasQuery ? (
                <div className="inline-flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      if (matchCount <= 0) return;
                      setActiveMatchIndex(
                        (current) => (current - 1 + matchCount) % matchCount,
                      );
                    }}
                    disabled={matchCount <= 1}
                    className={`flex h-7 w-7 items-center justify-center rounded-md border text-xs transition disabled:cursor-not-allowed disabled:opacity-50 ${controlClass}`}
                    aria-label="Previous match"
                  >
                    &lt;
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (matchCount <= 0) return;
                      setActiveMatchIndex(
                        (current) => (current + 1) % matchCount,
                      );
                    }}
                    disabled={matchCount <= 1}
                    className={`flex h-7 w-7 items-center justify-center rounded-md border text-xs transition disabled:cursor-not-allowed disabled:opacity-50 ${controlClass}`}
                    aria-label="Next match"
                  >
                    &gt;
                  </button>
                </div>
              ) : null}
            </div>
            {notebook?.language ? (
              <span
                className={`rounded-full border px-3 py-1 text-[10px] uppercase tracking-[0.2em] ${controlClass}`}
              >
                {notebook.language}
              </span>
            ) : null}
          </div>
        </div>
      ) : null}
      <div ref={scrollContainerRef} className="flex-1 overflow-auto">
        <div
          ref={contentRef}
          className={`notebook-viewer ${themeMode === "dark" ? "dark" : "light"} mx-auto flex max-w-5xl flex-col gap-4 p-6`}
        >
          {notebook?.cells.map((cell) => (
            <section key={cell.id} className={`notebook-cell rounded-2xl border ${cellClass}`}>
              <div
                className={`notebook-cell-header flex items-center justify-between border-b px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.25em] ${cellHeaderClass}`}
              >
                <span>
                  {cell.cellType === "code"
                    ? "Code"
                    : cell.cellType === "markdown"
                      ? "Markdown"
                      : "Raw"}
                </span>
                {cell.cellType === "code" ? (
                  <span>{`In [${cell.executionCount ?? " "}]`}</span>
                ) : null}
              </div>
              <div className="notebook-cell-body px-4 py-4">
                {cell.cellType === "markdown" ? (
                  <article className="markdown-content">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      rehypePlugins={[rehypeHighlight]}
                      components={{
                        img: ({ src, alt, ...props }) => (
                          <img
                            src={resolveAssetUrl(typeof src === 'string' ? src : undefined, resolvedBaseUrl, useProxy)}
                            alt={alt ?? ""}
                            {...props}
                          />
                        ),
                      }}
                    >
                      {cell.source}
                    </ReactMarkdown>
                  </article>
                ) : (
                  <pre className={`notebook-code rounded-xl p-4 text-xs ${codeClass}`}>
                    <code>{cell.source || " "}</code>
                  </pre>
                )}
              </div>
              {cell.outputs.length ? (
                <div className={`notebook-output border-t px-4 py-3 ${outputClass}`}>
                  <div className="space-y-3">
                    {cell.outputs.map((output, index) => {
                      if (output.kind === "image") {
                        return (
                          <img
                            key={`${cell.id}-out-${index}`}
                            src={output.dataUrl}
                            alt={output.alt}
                            className="max-w-full rounded-lg"
                          />
                        );
                      }
                      if (output.kind === "error") {
                        return (
                          <pre
                            key={`${cell.id}-out-${index}`}
                            className="whitespace-pre-wrap rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700"
                          >
                            {`${output.name}: ${output.value}`}
                            {output.traceback ? `\n${output.traceback}` : ""}
                          </pre>
                        );
                      }
                      const text = output.text;
                      return (
                        <pre
                          key={`${cell.id}-out-${index}`}
                          className={`whitespace-pre-wrap text-xs ${outputTextClass}`}
                        >
                          {text}
                        </pre>
                      );
                    })}
                  </div>
                </div>
              ) : null}
            </section>
          ))}
          {!notebook?.cells.length ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-6 py-8 text-center text-xs text-slate-400">
              This notebook has no cells.
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
