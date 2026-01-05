"use client";

import { useState } from "react";
import { X, Download } from "lucide-react";
import { getThemeClasses, MODAL_OVERLAY_CLASS } from "@/app/lib/ui-utils";
import {
  type ImageExportFormat,
  type ImagePackaging,
  type ViewerDownloadRequest,
} from "@/app/lib/viewer-download";
import type { FileType } from "@/app/lib/file-type";

type DownloadModalProps = {
  isOpen: boolean;
  onClose: () => void;
  isDark: boolean;
  fileType: FileType | "hitomi";
  onDownload: (request: ViewerDownloadRequest) => void;
};

/**
 * Modal for download options
 */
export function DownloadModal({
  isOpen,
  onClose,
  isDark,
  fileType,
  onDownload,
}: DownloadModalProps) {
  const [hitomiMode, setHitomiMode] = useState<"images" | "pdf">("images");
  const [imageFormat, setImageFormat] = useState<ImageExportFormat>("jpg");
  const [imagePackaging, setImagePackaging] = useState<ImagePackaging>("zip");
  const [combineImages, setCombineImages] = useState(false);

  if (!isOpen) return null;

  const classes = getThemeClasses(isDark);

  const isTextDoc =
    fileType === "html" ||
    fileType === "markdown" ||
    fileType === "text" ||
    fileType === "ipynb";
  const isPdf = fileType === "pdf";
  const isHitomi = fileType === "hitomi";

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

  const handleDownload = (detail: ViewerDownloadRequest) => {
    onDownload(detail);
    onClose();
  };

  return (
    <div className={MODAL_OVERLAY_CLASS} onClick={onClose}>
      <div
        className={`w-full max-w-2xl rounded-2xl border p-6 shadow-2xl ${classes.panel}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className={`text-lg font-semibold ${classes.text}`}>
              Download options
            </h3>
            <p className={`mt-1 text-sm ${classes.mutedText}`}>
              Choose a format to export.
            </p>
          </div>
          <button
            onClick={onClose}
            className={`flex h-8 w-8 items-center justify-center rounded-lg transition ${classes.closeButton}`}
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-5">
          {isPdf ? (
            <div className={`rounded-xl border p-4 ${classes.card}`}>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className={`text-sm font-semibold ${classes.text}`}>
                    PDF
                  </p>
                  <p className={`text-xs ${classes.mutedText}`}>
                    Download the original PDF file.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleDownload({ kind: "pdf" })}
                  className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-emerald-700"
                >
                  <Download className="h-4 w-4" />
                  Download PDF
                </button>
              </div>
            </div>
          ) : null}

          {isTextDoc ? (
            <div className={`rounded-xl border p-4 ${classes.card}`}>
              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => handleDownload({ kind: "original" })}
                  className={`rounded-lg border px-4 py-3 text-xs font-semibold transition ${classes.control}`}
                >
                  Download original
                </button>
                <button
                  type="button"
                  onClick={() => handleDownload({ kind: "pdf" })}
                  className="flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-3 text-xs font-semibold text-white transition hover:bg-emerald-700"
                >
                  <Download className="h-4 w-4" />
                  Save as PDF
                </button>
              </div>
              <p className={`mt-2 text-[11px] ${classes.mutedText}`}>
                PDF export opens the print dialog in a new tab.
              </p>
            </div>
          ) : null}

          {isHitomi ? (
            <div className="space-y-4">
              <div className={`rounded-xl border p-4 ${classes.card}`}>
                <p className={`text-xs font-semibold uppercase tracking-[0.2em] ${classes.mutedText}`}>
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
                          active ? classes.activeOption : classes.control
                        }`}
                      >
                        <span className="text-[11px] font-semibold uppercase tracking-[0.2em]">
                          {label}
                        </span>
                        <span className={`text-[11px] ${classes.mutedText}`}>
                          {description}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {hitomiMode === "images" ? (
                <>
                  <div className={`rounded-xl border p-4 ${classes.card}`}>
                    <p className={`text-xs font-semibold uppercase tracking-[0.2em] ${classes.mutedText}`}>
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
                              active ? classes.activeOption : classes.control
                            }`}
                          >
                            <span className="text-[11px] font-semibold uppercase tracking-[0.2em]">
                              {option.label}
                            </span>
                            <span className={`text-[11px] ${classes.mutedText}`}>
                              {option.description}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className={`rounded-xl border p-4 ${classes.card}`}>
                    <p className={`text-xs font-semibold uppercase tracking-[0.2em] ${classes.mutedText}`}>
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
                              active ? classes.activeOption : classes.control
                            }`}
                          >
                            <span className="text-[11px] font-semibold uppercase tracking-[0.2em]">
                              {option.label}
                            </span>
                            <span className={`text-[11px] ${classes.mutedText}`}>
                              {option.description}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                    <label className={`mt-3 flex items-start gap-2 text-xs ${classes.mutedText}`}>
                      <input
                        type="checkbox"
                        checked={combineImages}
                        onChange={(event) => setCombineImages(event.target.checked)}
                        className="mt-0.5 h-4 w-4 rounded border border-black/20 text-emerald-600"
                      />
                      <span>Combine all pages into one image.</span>
                    </label>
                    <p className={`mt-2 text-[11px] ${classes.mutedText}`}>
                      Oversized images are split automatically to fit format limits.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        handleDownload({
                          kind: "images",
                          format: imageFormat,
                          packaging: imagePackaging,
                          split: true,
                          combine: combineImages,
                        })
                      }
                      className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-emerald-700"
                    >
                      <Download className="h-4 w-4" />
                      Download images
                    </button>
                  </div>
                </>
              ) : (
                <div className={`rounded-xl border p-4 ${classes.card}`}>
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className={`text-sm font-semibold ${classes.text}`}>
                        PDF
                      </p>
                      <p className={`text-xs ${classes.mutedText}`}>
                        Print the gallery to PDF.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDownload({ kind: "pdf" })}
                      className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-emerald-700"
                    >
                      <Download className="h-4 w-4" />
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
  );
}
