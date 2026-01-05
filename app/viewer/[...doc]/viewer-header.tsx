"use client";

import Link from "next/link";
import { useEffect, useState, useCallback, useMemo } from "react";
import type { FileType } from "@/app/lib/file-type";
import { requestViewerDownload, type ViewerDownloadRequest } from "@/app/lib/viewer-download";
import { getSystemTheme, subscribeToSystemTheme, type ResolvedTheme } from "@/app/lib/theme";
import { getThemeClasses } from "@/app/lib/ui-utils";
import { InfoModal } from "@/app/components/modals/info-modal";
import { EmbedModal } from "@/app/components/modals/embed-modal";
import { DownloadModal } from "@/app/components/modals/download-modal";

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
  const [systemTheme, setSystemTheme] = useState<ResolvedTheme>("light");

  const showSourceUrl = Boolean(sourceUrl) && !isLocalFile && !isBlob;
  const hasTagInfo = Boolean(tagInfo);
  const canDownload = fileType !== "unknown";

  // Set document title
  useEffect(() => {
    if (!documentLabel) {
      document.title = "EasyDocs Viewer";
      return;
    }
    document.title = `${documentLabel} - EasyDocs`;
  }, [documentLabel]);

  // Subscribe to system theme changes
  useEffect(() => {
    setSystemTheme(getSystemTheme());
    return subscribeToSystemTheme(setSystemTheme);
  }, []);

  // Compute embed URL
  const origin = typeof window === "undefined" ? "" : window.location.origin;
  const embedUrl = useMemo(() => {
    return embedTarget ? (origin ? `${origin}${embedTarget}` : embedTarget) : "";
  }, [embedTarget, origin]);

  // Download handler
  const handleDownload = useCallback((detail: ViewerDownloadRequest) => {
    requestViewerDownload(detail);
    setShowDownloadModal(false);
  }, []);

  const isDark = systemTheme === "dark";
  const classes = getThemeClasses(isDark);

  return (
    <>
      <header className={`border-b backdrop-blur-sm ${classes.header}`}>
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex min-w-0 items-center gap-4">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-xs font-semibold text-white">
                ED
              </div>
              <div className="hidden sm:block">
                <p className={`font-display text-base ${classes.text}`}>
                  EasyDocs
                </p>
                <p className={`text-[10px] uppercase tracking-[0.3em] ${classes.mutedText}`}>
                  Viewer
                </p>
              </div>
            </Link>
            <div className={`hidden h-8 w-px md:block ${classes.divider}`} />
            <div className="min-w-0">
              {hasTagInfo ? (
                <div className={`mb-1 flex flex-wrap items-center gap-2 text-[10px] ${classes.mutedText}`}>
                  <span className="rounded-full bg-slate-900 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-white">
                    {tagInfo?.serviceLabel}
                  </span>
                  <span className={`text-[10px] uppercase tracking-[0.2em] ${classes.mutedText}`}>
                    Tagged
                  </span>
                </div>
              ) : null}
              <p
                className={`truncate text-sm font-semibold ${classes.text}`}
                title={documentLabel}
              >
                {documentLabel}
              </p>
              {showSourceUrl ? (
                <a
                  href={sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className={`hidden truncate text-xs transition hover:text-emerald-500 hover:underline sm:block ${classes.mutedText}`}
                  title={sourceUrl}
                >
                  {sourceUrl}
                </a>
              ) : (
                <p className={`hidden text-xs sm:block ${classes.mutedText}`}>
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
                className={`rounded-lg border px-3 py-2 text-xs font-semibold transition ${classes.control}`}
              >
                <span className="hidden sm:inline">Info</span>
                <span className="sm:hidden">i</span>
              </button>
            ) : null}
            {embedTarget ? (
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
            ) : null}
            {canDownload ? (
              <button
                onClick={() => {
                  setShowDownloadModal(true);
                  setShowEmbedModal(false);
                  setShowInfoModal(false);
                }}
                className={`rounded-lg border px-3 py-2 text-xs font-semibold transition ${classes.control}`}
              >
                <span className="hidden sm:inline">Download</span>
                <span className="sm:hidden">Get</span>
              </button>
            ) : null}
            <Link
              href="/open"
              className={`rounded-lg border px-3 py-2 text-xs font-semibold transition ${classes.control}`}
            >
              <span className="hidden sm:inline">Change</span>
              <span className="sm:hidden">New</span>
            </Link>
          </div>
        </div>
      </header>

      {tagInfo && (
        <InfoModal
          isOpen={showInfoModal}
          onClose={() => setShowInfoModal(false)}
          isDark={isDark}
          tagInfo={tagInfo}
          sourceUrl={sourceUrl}
        />
      )}

      {embedTarget && (
        <EmbedModal
          isOpen={showEmbedModal}
          onClose={() => setShowEmbedModal(false)}
          isDark={isDark}
          documentLabel={documentLabel}
          embedTarget={embedTarget}
          embedUrl={embedUrl}
        />
      )}

      <DownloadModal
        isOpen={showDownloadModal}
        onClose={() => setShowDownloadModal(false)}
        isDark={isDark}
        fileType={fileType}
        onDownload={handleDownload}
      />
    </>
  );
}
