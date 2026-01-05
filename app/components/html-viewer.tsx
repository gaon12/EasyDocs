"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { applyHighlights } from "@/app/lib/text-search";
import {
  ensureExtension,
  getFileNameFromUrl,
  triggerDownload,
} from "@/app/lib/download";
import { resolveProxyUrl } from "@/app/lib/proxy";
import { subscribeToViewerDownload } from "@/app/lib/viewer-download";
import { ViewerErrorState } from "./viewer-error";

interface HtmlViewerProps {
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

const isSkippableUrl = (value: string) =>
  value.startsWith("data:") ||
  value.startsWith("blob:") ||
  value.startsWith("mailto:") ||
  value.startsWith("tel:") ||
  value.startsWith("javascript:") ||
  value.startsWith("#");

const resolveResourceUrl = (
  value: string,
  baseUrl: string | undefined,
  useProxy: boolean,
) => {
  if (!value || isSkippableUrl(value)) return value;
  let resolved = value;
  if (baseUrl) {
    try {
      resolved = new URL(value, baseUrl).toString();
    } catch {
      resolved = value;
    }
  }
  return useProxy ? resolveProxyUrl(resolved, true) : resolved;
};

const rewriteResourceLinks = (
  doc: Document,
  baseUrl: string | undefined,
  useProxy: boolean,
) => {
  if (!useProxy) return;
  const srcNodes = doc.querySelectorAll(
    "img[src], source[src], video[src], audio[src], iframe[src]",
  );
  srcNodes.forEach((node) => {
    const element = node as HTMLElement;
    const current = element.getAttribute("src") ?? "";
    const next = resolveResourceUrl(current, baseUrl, useProxy);
    if (next && next !== current) {
      element.setAttribute("src", next);
    }
  });

  const linkNodes = doc.querySelectorAll("link[href]");
  linkNodes.forEach((node) => {
    const element = node as HTMLLinkElement;
    const rel = (element.getAttribute("rel") ?? "").toLowerCase();
    if (rel && rel !== "stylesheet") return;
    const current = element.getAttribute("href") ?? "";
    const next = resolveResourceUrl(current, baseUrl, useProxy);
    if (next && next !== current) {
      element.setAttribute("href", next);
    }
  });
};

const buildHtmlDocument = async (
  input: string,
  options: {
    fontScale: number;
    lineHeight: number;
    theme: "light" | "dark" | "system";
    baseUrl?: string;
    useProxy?: boolean;
  },
): Promise<{ html: string; toc: TocItem[] }> => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(input, "text/html");
  const toc: TocItem[] = [];
  const counts = new Map<string, number>();

  const headings = Array.from(
    doc.querySelectorAll("h1, h2, h3, h4, h5, h6"),
  ) as HTMLElement[];

  headings.forEach((heading) => {
    const text = heading.textContent?.trim() ?? "";
    if (!text) return;
    const base = slugify(text);
    const count = counts.get(base) ?? 0;
    counts.set(base, count + 1);
    const id = heading.id || (count ? `${base}-${count + 1}` : base);
    heading.id = id;
    toc.push({
      id,
      text,
      level: Number(heading.tagName.slice(1)) || 1,
    });
  });

  const codeBlocks = Array.from(doc.querySelectorAll("pre code"));
  if (codeBlocks.length) {
    try {
      const hljsModule = await import("highlight.js/lib/common");
      const hljs = hljsModule.default;
      codeBlocks.forEach((block) => {
        hljs.highlightElement(block as HTMLElement);
        (block as HTMLElement).classList.add("hljs");
      });
    } catch {
      // Ignore highlight failures.
    }
  }

  rewriteResourceLinks(doc, options.baseUrl, Boolean(options.useProxy));

  const themeMode = options.theme === "dark" ? "dark" : "light";
  const baseStyles =
    themeMode === "dark"
      ? "background:#0b1120;color:#e2e8f0;"
      : "background:#ffffff;color:#0f172a;";
  const linkColor = themeMode === "dark" ? "#5eead4" : "#0f766e";
  const printStyles =
    "@media print{body{margin:24px;} pre{page-break-inside:avoid;} h1,h2,h3{page-break-after:avoid;}}";
  const highlightStyles =
    ".hljs{background:#0f172a;color:#e2e8f0;} .hljs-comment{color:#94a3b8;} .hljs-keyword,.hljs-selector-tag,.hljs-literal{color:#7dd3fc;} .hljs-string,.hljs-title,.hljs-name{color:#a7f3d0;} .hljs-number{color:#fcd34d;}";

  const style = doc.createElement("style");
  style.textContent =
    `body{margin:0;padding:24px;font-family:var(--font-manrope,Segoe UI,sans-serif);font-size:${options.fontScale}rem;line-height:${options.lineHeight};${baseStyles}} a{color:${linkColor};} img{max-width:100%;height:auto;} pre{background:#0f172a;color:#e2e8f0;padding:1rem;border-radius:.5rem;overflow:auto;} code{font-family:ui-monospace,monospace;} ${highlightStyles} ${printStyles}`;
  doc.head.appendChild(style);

  return {
    html: `<!doctype html>\n${doc.documentElement.outerHTML}`,
    toc,
  };
};

const FONT_STEPS = [0.9, 1, 1.1, 1.2];
const LINE_HEIGHTS = [1.5, 1.7, 1.9];

export function HtmlViewer({
  fileKey,
  url,
  page,
  showHomeLink = false,
  showToolbar = false,
  documentLabel,
  theme = "light",
  useProxy = false,
}: HtmlViewerProps) {
  const [content, setContent] = useState<string>("");
  const [preparedHtml, setPreparedHtml] = useState<string>("");
  const [tocItems, setTocItems] = useState<TocItem[]>([]);
  const [error, setError] = useState<ViewerError | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [matchCount, setMatchCount] = useState(0);
  const [activeMatchIndex, setActiveMatchIndex] = useState(0);
  const [fileName, setFileName] = useState("");
  const [localFile, setLocalFile] = useState<File | null>(null);
  const [iframeReady, setIframeReady] = useState(false);
  const [showToc, setShowToc] = useState(false);
  const [fontScale, setFontScale] = useState(1);
  const [lineHeight, setLineHeight] = useState(1.7);
  const [systemTheme, setSystemTheme] = useState<"light" | "dark">("light");
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const resolvedTheme = theme === "system" ? systemTheme : theme;

  useEffect(() => {
    let active = true;

    async function loadHtml() {
      try {
        setError(null);
        setIsLoading(true);
        setContent("");
        setLocalFile(null);
        setFileName("");
        setIframeReady(false);
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
          description: "We could not load this HTML document.",
          details: err instanceof Error ? err.message : undefined,
        });
        setIsLoading(false);
      }
    }

    loadHtml();

    return () => {
      active = false;
    };
  }, [fileKey, url, documentLabel, useProxy]);

  useEffect(() => {
    let active = true;
    if (!content) {
      setPreparedHtml("");
      setTocItems([]);
      return () => {
        active = false;
      };
    }

    buildHtmlDocument(content, {
      fontScale,
      lineHeight,
      theme: resolvedTheme,
      baseUrl: url,
      useProxy,
    }).then((result) => {
      if (!active) return;
      setPreparedHtml(result.html);
      setTocItems(result.toc);
    });

    return () => {
      active = false;
    };
  }, [content, fontScale, lineHeight, resolvedTheme, url, useProxy]);

  useEffect(() => {
    setIframeReady(false);
  }, [preparedHtml]);

  useEffect(() => {
    setQuery("");
    setMatchCount(0);
    setActiveMatchIndex(0);
  }, [fileKey, url]);

  useEffect(() => {
    setActiveMatchIndex(0);
  }, [query]);

  useEffect(() => {
    if (!showToolbar || !iframeReady) return;
    const doc = iframeRef.current?.contentDocument;
    if (!doc) return;
    const { count } = applyHighlights(doc, query);
    setMatchCount(count);
    setActiveMatchIndex((current) => {
      if (count <= 0) return 0;
      return Math.min(current, count - 1);
    });
  }, [query, iframeReady, preparedHtml, showToolbar]);

  useEffect(() => {
    if (!showToolbar || !iframeReady) return;
    if (!query.trim()) return;
    if (matchCount <= 0) return;
    const doc = iframeRef.current?.contentDocument;
    if (!doc?.body) return;
    const matches = Array.from(
      doc.body.querySelectorAll("mark[data-highlight='true']"),
    ) as HTMLElement[];
    if (!matches.length) return;

    const normalizedIndex =
      ((activeMatchIndex % matches.length) + matches.length) % matches.length;

    doc.body
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
  }, [activeMatchIndex, matchCount, query, iframeReady, showToolbar]);

  useEffect(() => {
    if (!page || page < 1 || !iframeReady) return;
    const doc = iframeRef.current?.contentDocument;
    const scroller =
      doc?.scrollingElement ?? doc?.documentElement ?? doc?.body ?? null;
    if (!scroller) return;
    const viewportHeight =
      scroller.clientHeight || iframeRef.current?.clientHeight || 0;
    if (!viewportHeight) return;
    const maxScroll = Math.max(0, scroller.scrollHeight - viewportHeight);
    const target = Math.min(Math.max((page - 1) * viewportHeight, 0), maxScroll);
    scroller.scrollTo({ top: target });
  }, [page, iframeReady, preparedHtml]);

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
      "html",
    );
    const blob =
      localFile ?? new Blob([content], { type: "text/html;charset=utf-8" });
    triggerDownload(blob, resolvedName);
  }, [content, documentLabel, fileName, isLoading, localFile]);

  const handleSavePdf = useCallback(() => {
    if (isLoading) return;
    const frameWindow = iframeRef.current?.contentWindow;
    if (!frameWindow) return;
    frameWindow.focus();
    frameWindow.print();
  }, [isLoading]);

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

  const themeMode = resolvedTheme;
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
                        const target = iframeRef.current?.contentDocument?.getElementById(
                          item.id,
                        );
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
          <iframe
            ref={iframeRef}
            srcDoc={preparedHtml || content}
            sandbox="allow-same-origin"
            className={`h-full w-full flex-1 border-0 ${contentBgClass}`}
            title="HTML Viewer"
            onLoad={() => setIframeReady(true)}
          />
        </div>
      </div>
    </div>
  );
}
