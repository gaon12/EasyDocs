'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { applyHighlights } from '@/app/lib/text-search';
import {
  ensureExtension,
  escapeForHtml,
  getFileNameFromUrl,
  printHtml,
  triggerDownload,
} from '@/app/lib/download';
import { resolveProxyUrl } from '@/app/lib/proxy';
import { subscribeToViewerDownload } from '@/app/lib/viewer-download';
import { ViewerErrorState } from './viewer-error';

interface TextViewerProps {
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

export function TextViewer({
  fileKey,
  url,
  page,
  showHomeLink = false,
  showToolbar = false,
  documentLabel,
  theme = "light",
  useProxy = false,
}: TextViewerProps) {
  const [content, setContent] = useState<string>('');
  const [error, setError] = useState<ViewerError | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [matchCount, setMatchCount] = useState(0);
  const [activeMatchIndex, setActiveMatchIndex] = useState(0);
  const [fileName, setFileName] = useState('');
  const [localFile, setLocalFile] = useState<File | null>(null);
  const [systemTheme, setSystemTheme] = useState<"light" | "dark">("light");
  const contentRef = useRef<HTMLPreElement | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let active = true;

    async function loadText() {
      try {
        setError(null);
        setIsLoading(true);
        setContent('');
        setLocalFile(null);
        setFileName('');
        if (fileKey) {
          // Load from local file store
          const { getLocalFile } = await import('@/app/lib/local-files');
          const file = await getLocalFile(fileKey);

          if (!active) return;
          if (!file) {
            setError({
              title: 'Local upload unavailable',
              description:
                'This local upload is no longer available. Please upload it again to continue.',
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
              description: 'The link might be unavailable or blocked. Check the URL and try again.',
              details: `${response.status} ${response.statusText}`,
            });
            setIsLoading(false);
            return;
          }
          const text = await response.text();
          if (!active) return;
          setContent(text);
          setFileName(getFileNameFromUrl(url) || documentLabel || '');
          setIsLoading(false);
        } else {
          setIsLoading(false);
        }
      } catch (err) {
        if (!active) return;
        setError({
          title: 'Something went wrong',
          description: 'We could not load this text document.',
          details: err instanceof Error ? err.message : undefined,
        });
        setIsLoading(false);
      }
    }

    loadText();

    return () => {
      active = false;
    };
  }, [fileKey, url, documentLabel, useProxy]);

  useEffect(() => {
    setQuery('');
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
    const container = root;
    const matches = Array.from(
      container.querySelectorAll("mark[data-highlight='true']"),
    ) as HTMLElement[];
    if (!matches.length) return;

    const normalizedIndex =
      ((activeMatchIndex % matches.length) + matches.length) % matches.length;

    container
      .querySelectorAll("mark[data-highlight='true'][data-active='true']")
      .forEach((mark) => {
        mark.removeAttribute('data-active');
        (mark as HTMLElement).style.backgroundColor = '';
        (mark as HTMLElement).style.outline = '';
        (mark as HTMLElement).style.borderRadius = '';
      });

    const active = matches[normalizedIndex];
    active.dataset.active = 'true';
    active.style.backgroundColor = 'rgba(16, 185, 129, 0.35)';
    active.style.outline = '2px solid rgba(16, 185, 129, 0.65)';
    active.style.borderRadius = '2px';
    active.scrollIntoView({ behavior: 'smooth', block: 'center' });
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
  }, [page, content]);

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
      localFile?.name || fileName || documentLabel || 'document',
      'txt',
    );
    const blob =
      localFile ?? new Blob([content], { type: 'text/plain;charset=utf-8' });
    triggerDownload(blob, resolvedName);
  }, [content, documentLabel, fileName, isLoading, localFile]);

  const handleSavePdf = useCallback(() => {
    if (isLoading) return;
    const title = documentLabel || fileName || 'Text document';
    const safeContent = escapeForHtml(content);
    printHtml({
      title,
      bodyHtml: `<pre>${safeContent}</pre>`,
      styles:
        'body{margin:32px;font-family:ui-monospace,monospace;color:#0f172a;}pre{white-space:pre-wrap;font-size:12px;line-height:1.6;}',
    });
  }, [content, documentLabel, fileName, isLoading]);

  useEffect(() => {
    return subscribeToViewerDownload((detail) => {
      if (detail.kind === 'original') {
        handleDownloadOriginal();
      }
      if (detail.kind === 'pdf') {
        handleSavePdf();
      }
    });
  }, [handleDownloadOriginal, handleSavePdf]);

  const hasQuery = query.trim().length > 0;
  const matchLabel = hasQuery
    ? matchCount > 0
      ? `${activeMatchIndex + 1}/${matchCount}`
      : 'No matches'
    : 'Find text';
  const themeMode = theme === "system" ? systemTheme : theme;
  const containerClass =
    themeMode === "dark" ? "bg-slate-950 text-slate-100" : "bg-white text-slate-900";
  const toolbarClass =
    themeMode === "dark"
      ? "border-white/10 bg-slate-950/95"
      : "border-black/5 bg-white/80";

  if (error) {
    return (
      <ViewerErrorState
        title={error.title}
        description={error.description}
        details={error.details}
        action={showHomeLink ? { label: 'Back to open', href: '/open' } : undefined}
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
        <div className={`flex flex-col gap-3 border-b px-4 py-3 sm:flex-row sm:items-center sm:justify-between ${toolbarClass}`}>
          <div className="flex flex-1 items-center gap-3">
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
                  onClick={() => setQuery('')}
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
      <div
        ref={scrollContainerRef}
        className={`flex-1 overflow-auto ${themeMode === "dark" ? "bg-slate-900" : "bg-white"}`}
      >
        <pre
          ref={contentRef}
          className="p-8 font-mono text-sm whitespace-pre-wrap break-words"
        >
          {content}
        </pre>
      </div>
    </div>
  );
}
