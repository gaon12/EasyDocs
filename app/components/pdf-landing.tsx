"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { encodePdfSrcForPath, resolvePdfSrc } from "../lib/pdf";
import {
  getAcceptedFileTypes,
  getFileType,
  type FileType,
} from "../lib/file-type";
import { getLocalFile, registerLocalFile } from "../lib/local-files";
import { consumePendingFiles, subscribeToPendingFiles } from "../lib/pending-files";

type QueuedFile = {
  id: string;
  file: File;
  type: FileType;
};

const buildQueueId = (file: File) =>
  `${file.name}-${file.size}-${file.lastModified}-${Math.random()
    .toString(16)
    .slice(2)}`;

const formatBytes = (bytes: number) => {
  if (!Number.isFinite(bytes)) return "";
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  const mb = kb / 1024;
  if (mb < 1024) return `${mb.toFixed(1)} MB`;
  const gb = mb / 1024;
  return `${gb.toFixed(1)} GB`;
};

const resolveStartPage = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Number.parseInt(trimmed, 10);
  if (!Number.isFinite(parsed) || parsed < 1) return null;
  return parsed;
};

const isTaggedShortcut = (value: string) =>
  value.startsWith("arxiv:") || value.startsWith("hitomi:");

const looksLikeUrl = (value: string) => {
  const trimmed = value.trim();
  return (
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://") ||
    trimmed.startsWith("/") ||
    isTaggedShortcut(trimmed)
  );
};

export function PdfLanding() {
  const router = useRouter();
  const [urlInput, setUrlInput] = useState("");
  const [urlError, setUrlError] = useState("");
  const [queue, setQueue] = useState<QueuedFile[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [queueNotice, setQueueNotice] = useState("");
  const [startPageInput, setStartPageInput] = useState("");

  const startPage = useMemo(
    () => resolveStartPage(startPageInput),
    [startPageInput],
  );

  const prepareQueuedFiles = useCallback((files: FileList | File[]) => {
    const next: QueuedFile[] = [];
    const rejected: string[] = [];
    Array.from(files).forEach((file) => {
      const type = getFileType(file.name);
      if (type === "unknown") {
        rejected.push(file.name);
        return;
      }
      next.push({ id: buildQueueId(file), file, type });
    });

    return { next, rejected };
  }, []);

  const appendFiles = useCallback(
    (files: FileList | File[]) => {
      const { next, rejected } = prepareQueuedFiles(files);
      if (rejected.length) {
        setQueueNotice(`Unsupported files skipped: ${rejected.join(", ")}`);
      } else {
        setQueueNotice("");
      }

      if (next.length) {
        setQueue((current) => [...current, ...next]);
      }
    },
    [prepareQueuedFiles],
  );
  useEffect(() => {
    let active = true;
    const loadPending = async () => {
      const pending = consumePendingFiles();
      if (!pending.length) return;
      const files = await Promise.all(
        pending.map(async (entry) => (entry.key ? await getLocalFile(entry.key) : null)),
      );
      if (!active) return;
      const resolved = files.filter((file): file is File => Boolean(file));
      if (resolved.length) {
        appendFiles(resolved);
      }
      if (resolved.length !== pending.length) {
        setQueueNotice((current) =>
          current || "Some dropped files were unavailable.",
        );
      }
    };

    void loadPending();
    const unsubscribe = subscribeToPendingFiles(() => {
      void loadPending();
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, [appendFiles]);

  const openLocalFile = useCallback(
    (entry: QueuedFile) => {
      const fileKey = registerLocalFile(entry.file);
      const params = new URLSearchParams();
      params.set("name", entry.file.name);
      if (startPage) {
        params.set("page", String(startPage));
      }
      const query = params.toString();
      router.push(
        `/viewer/local/${encodeURIComponent(fileKey)}${query ? `?${query}` : ""}`,
      );
    },
    [router, startPage],
  );

  const handleIncomingFiles = useCallback(
    (files: FileList | File[]) => {
      const { next, rejected } = prepareQueuedFiles(files);
      if (rejected.length) {
        setQueueNotice(`Unsupported files skipped: ${rejected.join(", ")}`);
      } else {
        setQueueNotice("");
      }

      if (!next.length) return;
      if (next.length === 1 && queue.length === 0) {
        openLocalFile(next[0]);
        return;
      }

      setQueue((current) => [...current, ...next]);
    },
    [openLocalFile, prepareQueuedFiles, queue.length],
  );

  const removeQueuedFile = useCallback((id: string) => {
    setQueue((current) => current.filter((entry) => entry.id !== id));
  }, []);

  const clearQueue = useCallback(() => {
    setQueue([]);
  }, []);

  const handleOpenUrl = useCallback(() => {
    const trimmed = urlInput.trim();
    if (!trimmed) {
      setUrlError("Enter a document URL.");
      return;
    }

    const params = new URLSearchParams();
    if (startPage) {
      params.set("page", String(startPage));
    }
    const query = params.toString();

    if (isTaggedShortcut(trimmed)) {
      setUrlError("");
      router.push(
        `/viewer/${encodeURIComponent(trimmed)}${query ? `?${query}` : ""}`,
      );
      return;
    }

    const resolved = resolvePdfSrc(trimmed, { allowBlob: true });
    if (!resolved) {
      setUrlError("Use a valid public URL (http or https).");
      return;
    }
    setUrlError("");
    const encoded = encodePdfSrcForPath(resolved);
    router.push(`/viewer/${encoded}${query ? `?${query}` : ""}`);
  }, [router, startPage, urlInput]);

  useEffect(() => {
    const handlePaste = (event: ClipboardEvent) => {
      if (event.defaultPrevented) return;
      const target = event.target as HTMLElement | null;
      const isField =
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable);
      const files = event.clipboardData?.files;
      if (files && files.length > 0) {
        event.preventDefault();
        handleIncomingFiles(files);
        return;
      }
      if (isField) return;
      const text = event.clipboardData?.getData("text") ?? "";
      if (text && looksLikeUrl(text)) {
        setUrlInput(text.trim());
        setUrlError("");
      }
    };

    window.addEventListener("paste", handlePaste as EventListener);
    return () => {
      window.removeEventListener("paste", handlePaste as EventListener);
    };
  }, [handleIncomingFiles]);

  return (
    <div className="space-y-8">
      <section className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="rounded-3xl border border-black/5 bg-white/90 p-6 shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-emerald-600">
            Open by URL
          </p>
          <h2 className="mt-3 font-display text-2xl text-slate-900">
            Paste a document link
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Supports PDF, HTML, Markdown, Jupyter notebooks (.ipynb), and text.
            Start page works for every format.
          </p>

          <div className="mt-6 space-y-4">
            <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              Document URL
            </label>
            <input
              value={urlInput}
              onChange={(event) => setUrlInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  handleOpenUrl();
                }
              }}
              placeholder="https://example.com/file.pdf"
              className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
            />
            <div className="flex flex-wrap items-center gap-3">
              <input
                value={startPageInput}
                onChange={(event) => setStartPageInput(event.target.value)}
                placeholder="Start page"
                inputMode="numeric"
                className="w-32 rounded-full border border-black/10 bg-white px-4 py-2 text-xs text-slate-600 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
              />
              <button
                type="button"
                onClick={handleOpenUrl}
                className="rounded-full bg-emerald-600 px-5 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white transition hover:bg-emerald-700"
              >
                Open link
              </button>
              <span className="text-xs text-slate-400">
                Tip: use arxiv:ID or hitomi:ID for tagged sources.
              </span>
            </div>
            {urlError ? (
              <p className="text-xs text-rose-500">{urlError}</p>
            ) : null}
          </div>
        </div>

        <div className="rounded-3xl border border-black/5 bg-white/90 p-6 shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-emerald-600">
            Upload files
          </p>
          <h2 className="mt-3 font-display text-2xl text-slate-900">
            Drag, drop, or paste files
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Files stay in your browser. Multi-file queues are supported.
          </p>
          <div
            className={`mt-6 flex min-h-[180px] flex-col items-center justify-center rounded-3xl border border-dashed p-6 text-center text-sm transition ${
              dragActive
                ? "border-emerald-400 bg-emerald-50 text-emerald-700"
                : "border-black/10 bg-slate-50 text-slate-500"
            }`}
            onDragOver={(event) => {
              event.preventDefault();
              event.stopPropagation();
              setDragActive(true);
            }}
            onDragLeave={() => setDragActive(false)}
            onDrop={(event) => {
              event.preventDefault();
              event.stopPropagation();
              setDragActive(false);
              if (event.dataTransfer?.files?.length) {
                handleIncomingFiles(event.dataTransfer.files);
              }
            }}
          >
            <p className="font-semibold">Drop files here</p>
            <p className="mt-2 text-xs text-slate-400">
              Supported: PDF, HTML, Markdown, Jupyter (.ipynb), Text
            </p>
            <label className="mt-4 inline-flex cursor-pointer rounded-full border border-black/10 bg-white px-4 py-2 text-xs font-semibold text-slate-600 transition hover:border-emerald-200 hover:text-emerald-700">
              Choose files
              <input
                type="file"
                className="hidden"
                accept={getAcceptedFileTypes()}
                multiple
                onChange={(event) => {
                  if (event.target.files?.length) {
                    handleIncomingFiles(event.target.files);
                    event.target.value = "";
                  }
                }}
              />
            </label>
          </div>
          <p className="mt-3 text-xs text-slate-400">
            Paste files or URLs anywhere to add them.
          </p>
        </div>
      </section>

      <section className="rounded-3xl border border-black/5 bg-white/90 p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-400">
              File queue
            </p>
            <h3 className="mt-2 font-display text-xl text-slate-900">
              Ready to open
            </h3>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={clearQueue}
              className="rounded-full border border-black/10 bg-white px-4 py-2 text-xs font-semibold text-slate-500 transition hover:border-rose-200 hover:text-rose-600"
            >
              Clear queue
            </button>
          </div>
        </div>

        {queueNotice ? (
          <p className="mt-4 text-xs text-amber-600">{queueNotice}</p>
        ) : null}

        {queue.length ? (
          <ul className="mt-4 space-y-3">
            {queue.map((entry) => (
              <li
                key={entry.id}
                className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-black/5 bg-white px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-900">
                    {entry.file.name}
                  </p>
                  <p className="text-xs text-slate-400">
                    {entry.type.toUpperCase()} - {formatBytes(entry.file.size)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => openLocalFile(entry)}
                    className="rounded-full bg-emerald-600 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.28em] text-white transition hover:bg-emerald-700"
                  >
                    Open
                  </button>
                  <button
                    type="button"
                    onClick={() => removeQueuedFile(entry.id)}
                    className="rounded-full border border-black/10 bg-white px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-500 transition hover:border-rose-200 hover:text-rose-600"
                  >
                    Remove
                  </button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-xs text-slate-400">
            No files queued yet.
          </p>
        )}
      </section>
    </div>
  );
}
