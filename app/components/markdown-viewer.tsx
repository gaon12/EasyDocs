"use client";

import {
  isValidElement,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
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

interface MarkdownViewerProps {
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

type TocItem = {
  id: string;
  text: string;
  level: number;
};

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const extractMarkdownHeadings = (value: string): TocItem[] => {
  const lines = value.split(/\r?\n/);
  const items: TocItem[] = [];
  const counts = new Map<string, number>();
  let inFence = false;

  for (const line of lines) {
    if (line.trim().startsWith("```")) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;
    const match = line.match(/^(#{1,6})\s+(.+)$/);
    if (!match) continue;
    const level = match[1]?.length ?? 1;
    const rawText = match[2]?.replace(/\s+#+\s*$/, "") ?? "";
    const text = rawText.trim();
    if (!text) continue;
    const base = slugify(text);
    const count = counts.get(base) ?? 0;
    counts.set(base, count + 1);
    const id = count ? `${base}-${count + 1}` : base;
    items.push({ id, text, level });
  }

  return items;
};

const toPlainText = (value: React.ReactNode): string => {
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  if (Array.isArray(value)) {
    return value.map((item) => toPlainText(item)).join("");
  }
  if (isValidElement(value)) {
    return toPlainText((value.props as any).children);
  }
  return "";
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

const FONT_STEPS = [0.9, 1, 1.1, 1.2];
const LINE_HEIGHTS = [1.5, 1.7, 1.9];

export function MarkdownViewer({
  fileKey,
  url,
  page,
  showHomeLink = false,
  showToolbar = false,
  documentLabel,
  theme = "light",
  useProxy = false,
}: MarkdownViewerProps) {
  const [content, setContent] = useState<string>("");
  const [error, setError] = useState<ViewerError | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [matchCount, setMatchCount] = useState(0);
  const [activeMatchIndex, setActiveMatchIndex] = useState(0);
  const [fileName, setFileName] = useState("");
  const [localFile, setLocalFile] = useState<File | null>(null);
  const [showToc, setShowToc] = useState(false);
  const [fontScale, setFontScale] = useState(1);
  const [lineHeight, setLineHeight] = useState(1.7);
  const [systemTheme, setSystemTheme] = useState<"light" | "dark">("light");
  const contentRef = useRef<HTMLElement | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const headingIndexRef = useRef(0);

  const tocItems = useMemo(() => extractMarkdownHeadings(content), [content]);
  headingIndexRef.current = 0;
  const resolvedBaseUrl = url || undefined;

  useEffect(() => {
    let active = true;

    async function loadMarkdown() {
      try {
        setError(null);
        setIsLoading(true);
        setContent("");
        setLocalFile(null);
        setFileName("");
        if (fileKey) {
          // Load from local file store
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

          const text = await file.text();
          if (!active) return;
          setContent(text);
          setLocalFile(file);
          setFileName(file.name);
          setIsLoading(false);
        } else if (url) {
          // Load from URL
          const response = await fetch(resolveProxyUrl(url, useProxy));
          if (!active) return;
          if (!response.ok) {
            setError({
              title: "Couldn't load the document",
              description:
                "The link might be unavailable or blocked. Check the URL and try again.",
              details: `${response.status} ${response.statusText}`,
            });
            setIsLoading(false);
            return;
          }
          const text = await response.text();
          if (!active) return;
          setContent(text);
          setFileName(getFileNameFromUrl(url) || documentLabel || "");
          setIsLoading(false);
        } else {
          setIsLoading(false);
        }
      } catch (err) {
        if (!active) return;
        setError({
          title: "Something went wrong",
          description: "We could not load this Markdown document.",
          details: err instanceof Error ? err.message : undefined,
        });
        setIsLoading(false);
      }
    }

    loadMarkdown();

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
  }, [query, content, showToolbar]);

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
  }, [page, content, fontScale, lineHeight, showToc]);

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
      localFile?.name || fileName || documentLabel || "document",
      "md",
    );
    const blob =
      localFile ?? new Blob([content], { type: "text/markdown;charset=utf-8" });
    triggerDownload(blob, resolvedName);
  }, [content, documentLabel, fileName, isLoading, localFile]);

  const handleSavePdf = useCallback(() => {
    if (isLoading) return;
    const title = documentLabel || fileName || "Markdown document";
    const cloned = contentRef.current?.cloneNode(true) as HTMLElement | null;
    cloned
      ?.querySelectorAll("mark[data-highlight='true']")
      .forEach((mark) => mark.replaceWith(mark.textContent ?? ""));
    const bodyHtml = `<article class="markdown-content">${cloned?.innerHTML ?? ""}</article>`;
    printHtml({
      title,
      bodyHtml,
      styles:
        'body{margin:32px;font-family:var(--font-manrope,Segoe UI,sans-serif);color:#0f172a;} .markdown-content{line-height:1.7;} .markdown-content h1{font-size:2rem;font-weight:700;margin:2rem 0 1rem;} .markdown-content h2{font-size:1.5rem;font-weight:600;margin:1.5rem 0 .875rem;} .markdown-content h3{font-size:1.25rem;font-weight:600;margin:1.25rem 0 .75rem;} .markdown-content p{margin:0 0 1rem;} .markdown-content ul,.markdown-content ol{margin:0 0 1rem;padding-left:1.5rem;} .markdown-content li{margin:.25rem 0;} .markdown-content code{background:#f1f5f9;padding:.125rem .375rem;border-radius:.25rem;font-size:.85em;font-family:ui-monospace,monospace;} .markdown-content pre{background:#0f172a;color:#e2e8f0;padding:1rem;border-radius:.5rem;overflow-x:auto;margin-bottom:1rem;} .markdown-content blockquote{border-left:4px solid #cbd5e1;padding-left:1rem;margin:0 0 1rem;color:#64748b;font-style:italic;} .markdown-content a{color:#0f766e;text-decoration:underline;} .markdown-content table{width:100%;border-collapse:collapse;margin-bottom:1rem;} .markdown-content th,.markdown-content td{border:1px solid #e2e8f0;padding:.5rem;text-align:left;} .markdown-content th{background:#f8fafc;font-weight:600;} .markdown-content img{max-width:100%;height:auto;border-radius:.5rem;margin:1rem 0;} .markdown-content hr{border:none;border-top:1px solid #e2e8f0;margin:2rem 0;} @media print{body{margin:24px;} .markdown-content pre{page-break-inside:avoid;} .markdown-content h1,.markdown-content h2,.markdown-content h3{page-break-after:avoid;}}',
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
  const contentBgClass = themeMode === "dark" ? "bg-slate-900" : "bg-white";
  const tocClass =
    themeMode === "dark"
      ? "border-white/10 bg-slate-900/80 text-slate-200"
      : "border-black/5 bg-white/70 text-slate-600";

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
            <button
              type="button"
              onClick={() => setShowToc((prev) => !prev)}
              className={`rounded-lg border px-3 py-2 text-xs font-semibold transition ${controlClass}`}
            >
              {showToc ? "Hide TOC" : "Show TOC"}
            </button>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() =>
                  setFontScale((current) => {
                    const index = FONT_STEPS.indexOf(current);
                    return index > 0 ? FONT_STEPS[index - 1] : current;
                  })
                }
                className={`rounded-md border px-2 py-1 text-xs font-semibold transition ${controlClass}`}
                aria-label="Decrease font size"
              >
                A-
              </button>
              <button
                type="button"
                onClick={() =>
                  setFontScale((current) => {
                    const index = FONT_STEPS.indexOf(current);
                    return index < FONT_STEPS.length - 1
                      ? FONT_STEPS[index + 1]
                      : current;
                  })
                }
                className={`rounded-md border px-2 py-1 text-xs font-semibold transition ${controlClass}`}
                aria-label="Increase font size"
              >
                A+
              </button>
            </div>
            <select
              value={lineHeight}
              onChange={(event) => setLineHeight(Number(event.target.value))}
              className={`rounded-md border px-2 py-1 text-xs transition ${controlClass}`}
              aria-label="Line height"
            >
              {LINE_HEIGHTS.map((value) => (
                <option key={value} value={value}>
                  Line {value}
                </option>
              ))}
            </select>
            <div className="relative w-full max-w-xs">
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Find in document"
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
                    className="flex h-7 w-7 items-center justify-center rounded-md border border-black/10 bg-white text-xs text-slate-600 transition hover:border-emerald-200 hover:text-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
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
                    className="flex h-7 w-7 items-center justify-center rounded-md border border-black/10 bg-white text-xs text-slate-600 transition hover:border-emerald-200 hover:text-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                    aria-label="Next match"
                  >
                    &gt;
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
      <div className="flex-1 overflow-hidden">
        <div className="flex h-full">
          {showToc ? (
            <aside className={`w-full max-w-xs overflow-auto border-b p-4 text-xs md:w-64 md:border-b-0 md:border-r ${tocClass}`}>
              <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                Table of contents
              </div>
              <div className="mt-3 space-y-2">
                {tocItems.length ? (
                  tocItems.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        const target = document.getElementById(item.id);
                        target?.scrollIntoView({
                          behavior: "smooth",
                          block: "start",
                        });
                      }}
                      className="block w-full truncate text-left text-xs text-slate-600 transition hover:text-emerald-700"
                      style={{ paddingLeft: `${(item.level - 1) * 12}px` }}
                    >
                      {item.text}
                    </button>
                  ))
                ) : (
                  <p className="text-xs text-slate-400">No headings found.</p>
                )}
              </div>
            </aside>
          ) : null}
          <div
            ref={scrollContainerRef}
            className={`flex-1 overflow-auto ${contentBgClass}`}
          >
            <div className="mx-auto max-w-4xl p-8">
              <article
                ref={contentRef}
                className={`markdown-content ${themeMode === "dark" ? "text-slate-100" : "text-slate-900"}`}
                style={{
                  fontSize: `${fontScale}rem`,
                  lineHeight,
                }}
              >
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
                    h1: ({ children, ...props }) => {
                      const index = headingIndexRef.current++;
                      const fallback = toPlainText(children);
                      const id = tocItems[index]?.id || slugify(fallback);
                      return (
                        <h1 id={id} {...props}>
                          {children}
                        </h1>
                      );
                    },
                    h2: ({ children, ...props }) => {
                      const index = headingIndexRef.current++;
                      const fallback = toPlainText(children);
                      const id = tocItems[index]?.id || slugify(fallback);
                      return (
                        <h2 id={id} {...props}>
                          {children}
                        </h2>
                      );
                    },
                    h3: ({ children, ...props }) => {
                      const index = headingIndexRef.current++;
                      const fallback = toPlainText(children);
                      const id = tocItems[index]?.id || slugify(fallback);
                      return (
                        <h3 id={id} {...props}>
                          {children}
                        </h3>
                      );
                    },
                    h4: ({ children, ...props }) => {
                      const index = headingIndexRef.current++;
                      const fallback = toPlainText(children);
                      const id = tocItems[index]?.id || slugify(fallback);
                      return (
                        <h4 id={id} {...props}>
                          {children}
                        </h4>
                      );
                    },
                    h5: ({ children, ...props }) => {
                      const index = headingIndexRef.current++;
                      const fallback = toPlainText(children);
                      const id = tocItems[index]?.id || slugify(fallback);
                      return (
                        <h5 id={id} {...props}>
                          {children}
                        </h5>
                      );
                    },
                    h6: ({ children, ...props }) => {
                      const index = headingIndexRef.current++;
                      const fallback = toPlainText(children);
                      const id = tocItems[index]?.id || slugify(fallback);
                      return (
                        <h6 id={id} {...props}>
                          {children}
                        </h6>
                      );
                    },
                  }}
                >
                  {content}
                </ReactMarkdown>
              </article>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
