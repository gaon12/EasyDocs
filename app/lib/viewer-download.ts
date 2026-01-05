"use client";

export type ImageExportFormat = "png" | "jpg" | "webp" | "avif";
export type ImagePackaging = "single" | "zip";

export type ViewerDownloadRequest =
  | { kind: "original" }
  | { kind: "pdf" }
  | {
      kind: "images";
      format: ImageExportFormat;
      packaging: ImagePackaging;
      split: boolean;
      combine: boolean;
    };

const EVENT_NAME = "easydocs:viewer-download";

const isImageFormat = (value: unknown): value is ImageExportFormat =>
  value === "png" || value === "jpg" || value === "webp" || value === "avif";

const isPackaging = (value: unknown): value is ImagePackaging =>
  value === "single" || value === "zip";

const isRequest = (value: unknown): value is ViewerDownloadRequest => {
  if (!value || typeof value !== "object") return false;
  const record = value as Partial<ViewerDownloadRequest>;
  if (record.kind === "original" || record.kind === "pdf") return true;
  if (record.kind === "images") {
    return (
      isImageFormat((record as { format?: unknown }).format) &&
      isPackaging((record as { packaging?: unknown }).packaging) &&
      typeof (record as { split?: unknown }).split === "boolean" &&
      typeof (record as { combine?: unknown }).combine === "boolean"
    );
  }
  return false;
};

export const requestViewerDownload = (detail: ViewerDownloadRequest) => {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail }));
};

export const subscribeToViewerDownload = (
  handler: (detail: ViewerDownloadRequest) => void,
) => {
  if (typeof window === "undefined") return () => {};
  const listener = (event: Event) => {
    const custom = event as CustomEvent<ViewerDownloadRequest>;
    if (!isRequest(custom.detail)) return;
    handler(custom.detail);
  };
  window.addEventListener(EVENT_NAME, listener as EventListener);
  return () => {
    window.removeEventListener(EVENT_NAME, listener as EventListener);
  };
};
