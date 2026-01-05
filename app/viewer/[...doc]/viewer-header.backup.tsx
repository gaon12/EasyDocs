"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { FileType } from "@/app/lib/file-type";
import {
  requestViewerDownload,
  type ImageExportFormat,
  type ImagePackaging,
  type ViewerDownloadRequest,
} from "@/app/lib/viewer-download";

type ViewerHeaderProps = {
  documentLabel: string;
  sourceUrl?: string;
  isLocalFile: boolean;
  isBlob: boolean;
  embedTarget: string;
  fileType: FileType | "hitomi";
  tagInfo?: {
    serviceLabel: string;
    id: string;
    meta: Array<{
      label: string;
      value: string | string[];
    }>;
  };
};

export function ViewerHeader({
  documentLabel,
  sourceUrl,
  isLocalFile,
  isBlob,
  embedTarget,
  fileType,
  tagInfo,
}: ViewerHeaderProps) {
  const [showEmbedModal, setShowEmbedModal] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [hitomiMode, setHitomiMode] = useState<"images" | "pdf">("images");
  const [imageFormat, setImageFormat] = useState<ImageExportFormat>("jpg");
  const [imagePackaging, setImagePackaging] = useState<ImagePackaging>("zip");
  const [combineImages, setCombineImages] = useState(false);
  const [systemTheme, setSystemTheme] = useState<"light" | "dark">("light");
  const showSourceUrl = Boolean(sourceUrl) && !isLocalFile && !isBlob;
  const hasTagInfo = Boolean(tagInfo);
  const tagMeta = tagInfo?.meta ?? [];
  const isTextDoc =
    fileType === "html" ||
    fileType === "markdown" ||
    fileType === "text" ||
    fileType === "ipynb";
  const isPdf = fileType === "pdf";
  const isHitomi = fileType === "hitomi";
  const canDownload = fileType !== "unknown";
  const formatMetaValue = (value: string | string[]) =>
    Array.isArray(value) ? value.join(", ") : value;

  useEffect(() => {
    if (!documentLabel) {
      document.title = "EasyDocs Viewer";
      return;
    }
    document.title = `${documentLabel} - EasyDocs`;
  }, [documentLabel]);

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const update = () => setSystemTheme(media.matches ? "dark" : "light");
    update();
    media.addEventListener("change", update);
    return () => {
      media.removeEventListener("change", update);
    };
  }, []);

  const origin = typeof window === "undefined" ? "" : window.location.origin;
  const embedUrl = embedTarget
    ? origin
      ? `${origin}${embedTarget}`
      : embedTarget
    : "";
  const embedTitle = documentLabel
    ? `Embedded ${documentLabel.replace(/"/g, "&quot;")}`
    : "Embedded document";
  const embedSnippet = embedTarget
    ? `<iframe src="${embedUrl || embedTarget}" style="width: 100%; height: 600px; border: 0;" loading="lazy" title="${embedTitle}"></iframe>`
    : "";
  const formatOptions: Array<{
    value: ImageExportFormat;
    label: string;
    description: string;
  }> = [
    { value: "png", label: "PNG", description: "Lossless, larger files." },
    { value: "jpg", label: "JPG", description: "Smaller, lossy." },
    { value: "webp", label: "WebP", description: "Modern, compact." },
    { value: "avif", label: "AVIF", description: "High compression." },
  ];
  const packagingOptions: Array<{
    value: ImagePackaging;
    label: string;
    description: string;
  }> = [
    { value: "zip", label: "Zip bundle", description: "Single download." },
    { value: "single", label: "Individual files", description: "Multiple downloads." },
  ];
  const dispatchDownload = (detail: ViewerDownloadRequest) => {
    requestViewerDownload(detail);
    setShowDownloadModal(false);
  };

  const resolvedTheme = systemTheme;
  const isDark = resolvedTheme === "dark";
  const headerClass = isDark
    ? "border-white/10 bg-slate-950/80 text-slate-200"
    : "border-black/5 bg-white/80 text-slate-600";
  const panelClass = isDark
    ? "border-white/10 bg-slate-900 text-slate-100"
    : "border-black/5 bg-white text-slate-900";
  const mutedTextClass = isDark ? "text-slate-400" : "text-slate-500";
  const cardClass = isDark
    ? "border-white/10 bg-slate-800/80"
    : "border-black/5 bg-slate-50";
  const controlClass = isDark
    ? "border-white/10 bg-slate-800 text-slate-200 hover:border-emerald-400 hover:text-emerald-300"
    : "border-black/10 bg-white text-slate-600 hover:border-emerald-200 hover:text-emerald-700";
  const activeOptionClass = isDark
    ? "border-emerald-400 bg-emerald-500/20 text-emerald-200"
    : "border-emerald-300 bg-emerald-50 text-emerald-700";

  return (
    <>
      <header className={`border-b backdrop-blur-sm ${headerClass}`}>
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex min-w-0 items-center gap-4">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-xs font-semibold text-white">
                ED
              </div>
              <div className="hidden sm:block">
                <p
                  className={`font-display text-base ${
                    isDark ? "text-slate-100" : "text-slate-900"
                  }`}
                >
                  EasyDocs
                </p>
                <p className={`text-[10px] uppercase tracking-[0.3em] ${mutedTextClass}`}>
                  Viewer
                </p>
              </div>
            </Link>
            <div
              className={`hidden h-8 w-px md:block ${isDark ? "bg-white/10" : "bg-black/10"}`}
            />
            <div className="min-w-0">
              {hasTagInfo ? (
                <div className={`mb-1 flex flex-wrap items-center gap-2 text-[10px] ${mutedTextClass}`}>
                  <span className="rounded-full bg-slate-900 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-white">
                    {tagInfo?.serviceLabel}
                  </span>
                  <span className={`text-[10px] uppercase tracking-[0.2em] ${mutedTextClass}`}>
                    Tagged
                  </span>
                </div>
              ) : null}
              <p
                className={`truncate text-sm font-semibold ${
                  isDark ? "text-slate-100" : "text-slate-900"
                }`}
                title={documentLabel}
              >
                {documentLabel}
              </p>
              {showSourceUrl ? (
                <a
                  href={sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className={`hidden truncate text-xs transition hover:text-emerald-500 hover:underline sm:block ${
                    mutedTextClass
                  }`}
                  title={sourceUrl}
                >
                  {sourceUrl}
                </a>
              ) : (
                <p className={`hidden text-xs sm:block ${mutedTextClass}`}>
                  {isLocalFile || isBlob ? "Local file" : "Remote URL"}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {hasTagInfo ? (
              <button
                onClick={() => {
                  setShowInfoModal(true);
                  setShowEmbedModal(false);
                  setShowDownloadModal(false);
                }}
                className={`rounded-lg border px-3 py-2 text-xs font-semibold transition ${controlClass}`}
              >
                <span className="hidden sm:inline">Info</span>
                <span className="sm:hidden">i</span>
              </button>
            ) : null}
            {embedTarget ? (
              <>
                <button
                  onClick={() => {
                    setShowEmbedModal(true);
                    setShowInfoModal(false);
                    setShowDownloadModal(false);
                  }}
                  className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100"
                >
                  <span className="hidden sm:inline">Embed Code</span>
                  <span className="sm:hidden">Embed</span>
                </button>
              </>
            ) : null}
            {canDownload ? (
              <button
                onClick={() => {
                  setShowDownloadModal(true);
                  setShowEmbedModal(false);
                  setShowInfoModal(false);
                }}
                className={`rounded-lg border px-3 py-2 text-xs font-semibold transition ${controlClass}`}
              >
                <span className="hidden sm:inline">Download</span>
                <span className="sm:hidden">Get</span>
              </button>
            ) : null}
            <Link
              href="/open"
              className={`rounded-lg border px-3 py-2 text-xs font-semibold transition ${controlClass}`}
            >
              <span className="hidden sm:inline">Change</span>
              <span className="sm:hidden">New</span>
            </Link>
          </div>
        </div>
      </header>

      {showInfoModal && tagInfo && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
          onClick={() => setShowInfoModal(false)}
        >
          <div
            className={`w-full max-w-2xl rounded-2xl border p-6 shadow-2xl ${panelClass}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className={`text-lg font-semibold ${isDark ? "text-slate-100" : "text-slate-900"}`}>
                  Document info
                </h3>
                <p className={`mt-1 text-sm ${mutedTextClass}`}>
                  Details for this tagged source
                </p>
              </div>
              <button
                onClick={() => setShowInfoModal(false)}
                className={`flex h-8 w-8 items-center justify-center rounded-lg transition ${
                  isDark ? "text-slate-400 hover:bg-slate-800 hover:text-slate-200" : "text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                }`}
              >
                ?
              </button>
            </div>

            <div className="space-y-4">
              <div className={`rounded-xl border p-4 ${cardClass}`}>
                <div className={`text-[10px] font-semibold uppercase tracking-[0.3em] ${mutedTextClass}`}>
                  Source
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-slate-900 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-white">
                    {tagInfo.serviceLabel}
                  </span>
                  <span className={`font-mono text-xs ${mutedTextClass}`}>
                    {tagInfo.id}
                  </span>
                </div>
                {sourceUrl ? (
                  <a
                    href={sourceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 block truncate text-xs text-emerald-500 hover:underline"
                    title={sourceUrl}
                  >
                    {sourceUrl}
                  </a>
                ) : null}
              </div>

              {tagMeta.length ? (
                <div className="grid gap-3">
                  {tagMeta.map((item) => (
                    <div
                      key={item.label}
                      className={`rounded-xl border px-4 py-3 ${isDark ? "border-white/10 bg-slate-900" : "border-black/5 bg-white"}`}
                    >
                      <div className={`text-[10px] font-semibold uppercase tracking-[0.3em] ${mutedTextClass}`}>
                        {item.label}
                      </div>
                      <div className={`mt-1 text-sm ${isDark ? "text-slate-200" : "text-slate-700"}`}>
                        {formatMetaValue(item.value)}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div
                  className={`rounded-xl border border-dashed px-4 py-6 text-center text-xs ${
                    isDark
                      ? "border-slate-700 bg-slate-900 text-slate-400"
                      : "border-slate-200 bg-slate-50 text-slate-400"
                  }`}
                >
                  No additional metadata available.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showEmbedModal && embedTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
          onClick={() => setShowEmbedModal(false)}
        >
          <div
            className={`w-full max-w-2xl rounded-2xl border p-6 shadow-2xl ${panelClass}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className={`text-lg font-semibold ${isDark ? "text-slate-100" : "text-slate-900"}`}>
                  Embed Code
                </h3>
                <p className={`mt-1 text-sm ${mutedTextClass}`}>
                  Copy and paste this code into your website
                </p>
              </div>
              <button
                onClick={() => setShowEmbedModal(false)}
                className={`flex h-8 w-8 items-center justify-center rounded-lg transition ${
                  isDark ? "text-slate-400 hover:bg-slate-800 hover:text-slate-200" : "text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                }`}
              >
                X
              </button>
            </div>

            <div className="space-y-4">
              <div
                className={`rounded-xl border p-4 ${
                  isDark ? "border-amber-400/40 bg-amber-500/10" : "border-amber-200 bg-amber-50"
                }`}
              >
                <div className="flex items-start gap-2">
                  <span className="text-lg">NOTE</span>
                  <div className={`text-xs ${isDark ? "text-amber-100" : "text-amber-900"}`}>
                    <p className="font-semibold">Note:</p>
                    <p className="mt-1">
                      Only public URLs can be embedded. Local files cannot be
                      embedded as they don&apos;t have a public URL.
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className={`text-xs font-semibold uppercase tracking-wider ${mutedTextClass}`}>
                    Iframe Code
                  </label>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(embedSnippet);
                    }}
                    className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-700"
                  >
                    Copy
                  </button>
                </div>
                <pre className="overflow-x-auto rounded-xl bg-slate-900 p-4 text-xs text-slate-100">
                  {embedSnippet}
                </pre>
              </div>

              <div className={`rounded-xl border p-4 ${cardClass}`}>
                <p className={`text-xs ${mutedTextClass}`}>
                  <span className="font-semibold">Embed URL:</span>
                  <br />
                  <code
                    className={`mt-1 inline-block rounded px-2 py-1 font-mono text-[11px] ${
                      isDark ? "bg-white/10 text-emerald-400" : "bg-white text-emerald-700"
                    }`}
                  >
                    {embedUrl || embedTarget}
                  </code>
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {showDownloadModal && canDownload && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
          onClick={() => setShowDownloadModal(false)}
        >
          <div
            className={`w-full max-w-2xl rounded-2xl border p-6 shadow-2xl ${panelClass}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className={`text-lg font-semibold ${isDark ? "text-slate-100" : "text-slate-900"}`}>
                  Download options
                </h3>
                <p className={`mt-1 text-sm ${mutedTextClass}`}>
                  Choose a format to export.
                </p>
              </div>
              <button
                onClick={() => setShowDownloadModal(false)}
                className={`flex h-8 w-8 items-center justify-center rounded-lg transition ${
                  isDark ? "text-slate-400 hover:bg-slate-800 hover:text-slate-200" : "text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                }`}
              >
                X
              </button>
            </div>

            <div className="space-y-5">
              {isPdf ? (
                <div className={`rounded-xl border p-4 ${cardClass}`}>
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className={`text-sm font-semibold ${isDark ? "text-slate-100" : "text-slate-800"}`}>
                        PDF
                      </p>
                      <p className={`text-xs ${mutedTextClass}`}>
                        Download the original PDF file.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => dispatchDownload({ kind: "pdf" })}
                      className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-emerald-700"
                    >
                      Download PDF
                    </button>
                  </div>
                </div>
              ) : null}

              {isTextDoc ? (
                <div className={`rounded-xl border p-4 ${cardClass}`}>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <button
                      type="button"
                      onClick={() => dispatchDownload({ kind: "original" })}
                      className={`rounded-lg border px-4 py-3 text-xs font-semibold transition ${
                        isDark
                          ? "border-white/10 bg-slate-900 text-slate-100 hover:border-emerald-400 hover:text-emerald-300"
                          : "border-black/10 bg-white text-slate-700 hover:border-emerald-200 hover:text-emerald-700"
                      }`}
                    >
                      Download original
                    </button>
                    <button
                      type="button"
                      onClick={() => dispatchDownload({ kind: "pdf" })}
                      className="rounded-lg bg-emerald-600 px-4 py-3 text-xs font-semibold text-white transition hover:bg-emerald-700"
                    >
                      Save as PDF
                    </button>
                  </div>
                  <p className={`mt-2 text-[11px] ${mutedTextClass}`}>
                    PDF export opens the print dialog in a new tab.
                  </p>
                </div>
              ) : null}

              {isHitomi ? (
                <div className="space-y-4">
                  <div className={`rounded-xl border p-4 ${cardClass}`}>
                    <p className={`text-xs font-semibold uppercase tracking-[0.2em] ${mutedTextClass}`}>
                      Download as
                    </p>
                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                      {(["images", "pdf"] as const).map((mode) => {
                        const active = hitomiMode === mode;
                        const label = mode === "images" ? "Images" : "PDF";
                        const description =
                          mode === "images"
                            ? "Export pages as images."
                            : "Print-ready PDF.";
                        return (
                          <button
                            key={mode}
                            type="button"
                            onClick={() => setHitomiMode(mode)}
                            className={`flex flex-col items-start rounded-lg border px-3 py-2 text-left text-xs transition ${
                              active ? activeOptionClass : controlClass
                            }`}
                          >
                            <span className="text-[11px] font-semibold uppercase tracking-[0.2em]">
                              {label}
                            </span>
                            <span className={`text-[11px] ${mutedTextClass}`}>
                              {description}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {hitomiMode === "images" ? (
                    <>
                      <div className={`rounded-xl border p-4 ${cardClass}`}>
                        <p className={`text-xs font-semibold uppercase tracking-[0.2em] ${mutedTextClass}`}>
                          Image format
                        </p>
                        <div className="mt-3 grid gap-2 sm:grid-cols-2">
                          {formatOptions.map((option) => {
                            const active = imageFormat === option.value;
                            return (
                              <button
                                key={option.value}
                                type="button"
                                onClick={() => setImageFormat(option.value)}
                                className={`flex flex-col items-start rounded-lg border px-3 py-2 text-left text-xs transition ${
                                  active ? activeOptionClass : controlClass
                                }`}
                              >
                                <span className="text-[11px] font-semibold uppercase tracking-[0.2em]">
                                  {option.label}
                                </span>
                                <span className={`text-[11px] ${mutedTextClass}`}>
                                  {option.description}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div className={`rounded-xl border p-4 ${cardClass}`}>
                        <p className={`text-xs font-semibold uppercase tracking-[0.2em] ${mutedTextClass}`}>
                          Packaging
                        </p>
                        <div className="mt-3 grid gap-2 sm:grid-cols-2">
                          {packagingOptions.map((option) => {
                            const active = imagePackaging === option.value;
                            return (
                              <button
                                key={option.value}
                                type="button"
                                onClick={() => setImagePackaging(option.value)}
                                className={`flex flex-col items-start rounded-lg border px-3 py-2 text-left text-xs transition ${
                                  active ? activeOptionClass : controlClass
                                }`}
                              >
                                <span className="text-[11px] font-semibold uppercase tracking-[0.2em]">
                                  {option.label}
                                </span>
                                <span className={`text-[11px] ${mutedTextClass}`}>
                                  {option.description}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                        <label className={`mt-3 flex items-start gap-2 text-xs ${mutedTextClass}`}>
                          <input
                            type="checkbox"
                            checked={combineImages}
                            onChange={(event) => setCombineImages(event.target.checked)}
                            className="mt-0.5 h-4 w-4 rounded border border-black/20 text-emerald-600"
                          />
                          <span>Combine all pages into one image.</span>
                        </label>
                        <p className={`mt-2 text-[11px] ${mutedTextClass}`}>
                          Oversized images are split automatically to fit format limits.
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            dispatchDownload({
                              kind: "images",
                              format: imageFormat,
                              packaging: imagePackaging,
                              split: true,
                              combine: combineImages,
                            })
                          }
                          className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-emerald-700"
                        >
                          Download images
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className={`rounded-xl border p-4 ${cardClass}`}>
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className={`text-sm font-semibold ${isDark ? "text-slate-100" : "text-slate-800"}`}>
                            PDF
                          </p>
                          <p className={`text-xs ${mutedTextClass}`}>
                            Print the gallery to PDF.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => dispatchDownload({ kind: "pdf" })}
                          className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-emerald-700"
                        >
                          Save as PDF
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
