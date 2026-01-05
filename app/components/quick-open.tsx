"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { encodePdfSrcForPath, resolvePdfSrc } from "../lib/pdf";
import { getAcceptedFileTypes, getFileType } from "../lib/file-type";
import { registerLocalFile } from "../lib/local-files";
import { addPendingFiles, type PendingFileEntry } from "../lib/pending-files";

const isTaggedShortcut = (value: string) =>
  value.startsWith("arxiv:") || value.startsWith("hitomi:");

const splitFiles = (files: FileList | File[]) => {
  const supported: File[] = [];
  const rejected: string[] = [];

  Array.from(files).forEach((file) => {
    const type = getFileType(file.name);
    if (type === "unknown") {
      rejected.push(file.name);
      return;
    }
    supported.push(file);
  });

  return { supported, rejected };
};

const buildPendingEntries = (files: File[]): PendingFileEntry[] =>
  files
    .map((file) => {
      const type = getFileType(file.name);
      if (type === "unknown") return null;
      return {
        key: registerLocalFile(file),
        name: file.name,
        size: file.size,
        type,
      } as PendingFileEntry;
    })
    .filter((entry): entry is PendingFileEntry => Boolean(entry));

export function QuickOpen() {
  const router = useRouter();
  const [urlInput, setUrlInput] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const openLocalFile = useCallback(
    (file: File) => {
      const fileKey = registerLocalFile(file);
      const params = new URLSearchParams();
      params.set("name", file.name);
      const query = params.toString();
      router.push(
        `/viewer/local/${encodeURIComponent(fileKey)}${query ? `?${query}` : ""}`,
      );
    },
    [router],
  );

  const handleOpenUrl = useCallback(() => {
    const trimmed = urlInput.trim();
    if (!trimmed) {
      setError("Enter a document URL.");
      return;
    }

    if (isTaggedShortcut(trimmed)) {
      setError("");
      setNotice("");
      router.push(`/viewer/${encodeURIComponent(trimmed)}`);
      return;
    }

    const resolved = resolvePdfSrc(trimmed);
    if (!resolved) {
      setError("Use a valid public URL (http or https).");
      return;
    }

    setError("");
    setNotice("");
    const encoded = encodePdfSrcForPath(resolved);
    router.push(`/viewer/${encoded}`);
  }, [router, urlInput]);

  const handleFiles = useCallback(
    (files: FileList | File[]) => {
      const { supported, rejected } = splitFiles(files);
      if (rejected.length) {
        setNotice(`Unsupported files skipped: ${rejected.join(", ")}`);
      } else {
        setNotice("");
      }

      if (!supported.length) {
        setError("No supported files selected.");
        return;
      }

      setError("");
      if (supported.length === 1) {
        openLocalFile(supported[0]);
        return;
      }

      const entries = buildPendingEntries(supported);
      if (entries.length) {
        addPendingFiles(entries);
        router.push("/open");
      }
    },
    [openLocalFile, router],
  );

  return (
    <div className="rounded-3xl border border-black/5 bg-white/90 p-6 shadow-sm">
      <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-emerald-600">
        Quick open
      </p>
      <h2 className="mt-3 font-display text-xl text-slate-900">
        Open a document now
      </h2>
      <p className="mt-2 text-sm text-slate-500">
        Paste a URL, pick a file, or drop and paste anywhere on the page.
      </p>

      <div className="mt-5 space-y-3">
        <input
          value={urlInput}
          onChange={(event) => setUrlInput(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              handleOpenUrl();
            }
          }}
          placeholder="https://example.com/file.pdf or arxiv:2301.12345"
          className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
        />
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleOpenUrl}
            className="rounded-full bg-emerald-600 px-5 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white transition hover:bg-emerald-700"
          >
            Open link
          </button>
          <label className="inline-flex cursor-pointer items-center rounded-full border border-black/10 bg-white px-4 py-2 text-xs font-semibold text-slate-600 transition hover:border-emerald-200 hover:text-emerald-700">
            Choose files
            <input
              type="file"
              className="hidden"
              accept={getAcceptedFileTypes()}
              multiple
              onChange={(event) => {
                if (event.target.files?.length) {
                  handleFiles(event.target.files);
                  event.target.value = "";
                }
              }}
            />
          </label>
          <span className="text-xs text-slate-400">
            Drop or paste anywhere to open.
          </span>
        </div>
        {error ? <p className="text-xs text-rose-500">{error}</p> : null}
        {notice ? <p className="text-xs text-amber-600">{notice}</p> : null}
      </div>
    </div>
  );
}
