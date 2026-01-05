"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type MouseEvent } from "react";
import {
  fetchHitomiGalleryInfo,
  getHitomiImageVariants,
  getHitomiServerMap,
  resolveHitomiImageUrl,
  type HitomiGalleryInfo,
  type HitomiServerMap,
} from "../lib/hitomi";
import { escapeForHtml, triggerDownload } from "@/app/lib/download";
import {
  subscribeToViewerDownload,
  type ImageExportFormat,
  type ImagePackaging,
  type ViewerDownloadRequest,
} from "@/app/lib/viewer-download";
import { ViewerErrorState } from "./viewer-error";
import { toast, dismissToast } from "@/app/lib/toast";

type HitomiViewerProps = {
  galleryId: string;
  className?: string;
  documentLabel?: string;
  showHomeLink?: boolean;
  page?: number | null;
  theme?: "light" | "dark" | "system";
};

type ViewerError = {
  title: string;
  description: string;
  details?: string;
};

type HitomiImageEntry = {
  sources: string[];
  alt: string;
  width?: number;
  height?: number;
};

type ImageExportConfig = {
  mime: string;
  extension: string;
  quality?: number;
  maxDimension: number;
  maxPixels: number;
};

type LoadedImageSource = {
  source: CanvasImageSource;
  width: number;
  height: number;
  release?: () => void;
};

const IMAGE_EXPORT_CONFIG: Record<ImageExportFormat, ImageExportConfig> = {
  png: {
    mime: "image/png",
    extension: "png",
    maxDimension: 16384,
    maxPixels: 268435456,
  },
  jpg: {
    mime: "image/jpeg",
    extension: "jpg",
    quality: 0.92,
    maxDimension: 16384,
    maxPixels: 268435456,
  },
  webp: {
    mime: "image/webp",
    extension: "webp",
    quality: 0.92,
    maxDimension: 16383,
    maxPixels: 268435456,
  },
  avif: {
    mime: "image/avif",
    extension: "avif",
    quality: 0.8,
    maxDimension: 16384,
    maxPixels: 268435456,
  },
};

const sanitizeFileName = (value: string) =>
  value.replace(/[\\/:*?"<>|]+/g, "-").replace(/\s+/g, " ").trim();

const getSourceExtension = (source: string) => {
  if (!source) return "";
  try {
    const url = new URL(source, "http://localhost");
    const remote = url.searchParams.get("url") ?? "";
    const candidate = remote || url.pathname;
    const ext = candidate.split(".").pop()?.toLowerCase();
    return ext ?? "";
  } catch {
    return "";
  }
};

const pickPreferredSource = (sources: string[]) => {
  if (!sources.length) return "";
  const preference = ["jpg", "jpeg", "png", "webp", "avif"];
  for (const ext of preference) {
    const match = sources.find((source) => getSourceExtension(source) === ext);
    if (match) return match;
  }
  return sources[sources.length - 1] ?? sources[0] ?? "";
};

const fetchImageBlob = async (sources: string[]) => {
  for (const source of sources) {
    try {
      const response = await fetch(source);
      if (!response.ok) continue;
      return await response.blob();
    } catch {
      continue;
    }
  }
  return null;
};

const loadImageSource = async (blob: Blob): Promise<LoadedImageSource> => {
  if (typeof createImageBitmap === "function") {
    try {
      const bitmap = await createImageBitmap(blob);
      return {
        source: bitmap,
        width: bitmap.width,
        height: bitmap.height,
        release: () => bitmap.close(),
      };
    } catch {
      // Fall back to HTMLImageElement.
    }
  }

  const url = URL.createObjectURL(blob);
  const image = new Image();
  image.decoding = "async";
  image.src = url;

  try {
    if (image.decode) {
      await image.decode();
    } else {
      await new Promise<void>((resolve, reject) => {
        image.onload = () => resolve();
        image.onerror = () => reject(new Error("Image load failed"));
      });
    }
  } finally {
    URL.revokeObjectURL(url);
  }

  return {
    source: image,
    width: image.naturalWidth,
    height: image.naturalHeight,
  };
};

const canvasToBlob = (
  canvas: HTMLCanvasElement,
  mime: string,
  quality?: number,
): Promise<Blob | null> =>
  new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), mime, quality);
  });

const resolveFormatConfig = async (
  format: ImageExportFormat,
): Promise<ImageExportConfig> => {
  const base = IMAGE_EXPORT_CONFIG[format] ?? IMAGE_EXPORT_CONFIG.png;
  const canvas = document.createElement("canvas");
  canvas.width = 1;
  canvas.height = 1;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, 1, 1);
  }
  const testBlob = await canvasToBlob(canvas, base.mime, base.quality);
  return testBlob ? base : IMAGE_EXPORT_CONFIG.png;
};

const resolveTilePlan = (
  width: number,
  height: number,
  limits: ImageExportConfig,
) => {
  const maxDimension = limits.maxDimension;
  const maxPixels = limits.maxPixels;
  let cols = Math.max(1, Math.ceil(width / maxDimension));
  let rows = Math.max(1, Math.ceil(height / maxDimension));
  let tileWidth = Math.ceil(width / cols);
  let tileHeight = Math.ceil(height / rows);

  while (tileWidth * tileHeight > maxPixels) {
    if (tileWidth >= tileHeight) {
      cols += 1;
    } else {
      rows += 1;
    }
    tileWidth = Math.ceil(width / cols);
    tileHeight = Math.ceil(height / rows);
  }

  return { cols, rows, tileWidth, tileHeight };
};

const waitForDocumentImages = (doc: Document) =>
  new Promise<void>((resolve) => {
    const images = Array.from(doc.images);
    if (!images.length) {
      resolve();
      return;
    }
    let remaining = images.length;
    const done = () => {
      remaining -= 1;
      if (remaining <= 0) resolve();
    };
    images.forEach((image) => {
      if (image.complete) {
        done();
      } else {
        image.addEventListener("load", done);
        image.addEventListener("error", done);
      }
    });
  });

const isEditableElement = (element: Element | null) => {
  if (!element) return false;
  const tagName = element.tagName;
  return (
    tagName === "INPUT" ||
    tagName === "TEXTAREA" ||
    (element as HTMLElement).isContentEditable
  );
};

function HitomiImage({
  sources,
  alt,
  width,
  height,
  themeMode,
}: HitomiImageEntry & { themeMode: "light" | "dark" }) {
  const [failed, setFailed] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const src = sources[activeIndex] ?? "";
  const hasDimensions =
    typeof width === "number" &&
    typeof height === "number" &&
    width > 0 &&
    height > 0;
  const aspectRatio = hasDimensions ? `${width}/${height}` : undefined;

  useEffect(() => {
    setActiveIndex(0);
    setFailed(false);
    setLoaded(false);
  }, [sources]);

  useEffect(() => {
    setLoaded(false);
  }, [src]);

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border shadow-sm ${
        themeMode === "dark"
          ? "border-white/10 bg-slate-900"
          : "border-black/5 bg-white"
      } ${hasDimensions ? "" : "min-h-[220px]"}`}
      style={aspectRatio ? { aspectRatio } : undefined}
    >
      {!loaded && !failed && (
        <div
          className={`absolute inset-0 animate-pulse ${
            themeMode === "dark"
              ? "bg-gradient-to-br from-slate-900 via-slate-800/70 to-slate-900"
              : "bg-gradient-to-br from-slate-100 via-slate-200/80 to-slate-100"
          }`}
        />
      )}
      {failed || !src ? (
        <div
          className={`absolute inset-0 flex items-center justify-center rounded-2xl border border-dashed px-6 py-10 text-center text-xs ${
            themeMode === "dark"
              ? "border-slate-700 bg-slate-900 text-slate-400"
              : "border-slate-200 bg-slate-50 text-slate-400"
          }`}
        >
          Unable to load this page.
        </div>
      ) : (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          decoding="async"
          width={hasDimensions ? width : undefined}
          height={hasDimensions ? height : undefined}
          className={`absolute inset-0 h-full w-full object-contain transition-opacity ${
            loaded ? "opacity-100" : "opacity-0"
          }`}
          onLoad={() => setLoaded(true)}
          onError={() => {
            if (activeIndex < sources.length - 1) {
              setActiveIndex((index) => index + 1);
              return;
            }
            setFailed(true);
          }}
        />
      )}
    </div>
  );
}

export function HitomiViewer({
  galleryId,
  className,
  documentLabel,
  showHomeLink = false,
  page,
  theme = "light",
}: HitomiViewerProps) {
  const [galleryInfo, setGalleryInfo] = useState<HitomiGalleryInfo | null>(null);
  const [serverMap, setServerMap] = useState<HitomiServerMap | null>(null);
  const [error, setError] = useState<ViewerError | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const [pagesPerView, setPagesPerView] = useState<1 | 2>(1);
  const [scrollAxis, setScrollAxis] = useState<"vertical" | "horizontal">(
    "vertical",
  );
  const [activeGroupIndex, setActiveGroupIndex] = useState(0);
  const [controlsVisible, setControlsVisible] = useState(true);
  const groupRefs = useRef<Array<HTMLDivElement | null>>([]);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const scrollFrameRef = useRef<number | null>(null);
  const lastScrollPosRef = useRef(0);
  const downloadLockRef = useRef(false);
  const [systemTheme, setSystemTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    let active = true;

    const load = async () => {
      setIsLoading(true);
      setError(null);
      setServerMap(null);
      setGalleryInfo(null);

      const [info, serverMap] = await Promise.all([
        fetchHitomiGalleryInfo(galleryId),
        getHitomiServerMap(),
      ]);

      if (!active) return;

      if (!info) {
        setError({
          title: "Couldn't load the gallery",
          description:
            "The Hitomi metadata could not be fetched. Check the ID and try again.",
        });
        setIsLoading(false);
        return;
      }

      if (!serverMap) {
        setError({
          title: "Image servers unavailable",
          description:
            "We couldn't resolve the image servers for this gallery.",
        });
        setIsLoading(false);
        return;
      }

      setGalleryInfo(info);
      setServerMap(serverMap);
      setIsLoading(false);
    };

    void load();

    return () => {
      active = false;
    };
  }, [galleryId]);

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

  const images = useMemo(() => {
    if (!galleryInfo || !serverMap) return [];
    const files = galleryInfo.files ?? [];
    return files
      .map((file, index) => {
        const variants = getHitomiImageVariants(file);
        const sources = Array.from(
          new Set(
            variants
              .map((variant) => resolveHitomiImageUrl(file, serverMap, variant))
              .filter((value): value is string => Boolean(value))
              .map(
                (remoteUrl) =>
                  `/api/hitomi-image?url=${encodeURIComponent(remoteUrl)}&gid=${encodeURIComponent(galleryId)}`,
              ),
          ),
        );
        const width =
          typeof file.width === "number" && file.width > 0
            ? file.width
            : undefined;
        const height =
          typeof file.height === "number" && file.height > 0
            ? file.height
            : undefined;

        if (!sources.length) return null;
        return {
          sources,
          alt: `${documentLabel || "Hitomi"} page ${index + 1}`,
          ...(width !== undefined && { width }),
          ...(height !== undefined && { height }),
        };
      })
      .filter((entry): entry is NonNullable<typeof entry> => entry !== null);
  }, [galleryInfo, serverMap, documentLabel, galleryId]);

  const imageGroups = useMemo(() => {
    if (pagesPerView === 1) {
      return images.map((image) => [image]);
    }
    const groups: HitomiImageEntry[][] = [];
    for (let i = 0; i < images.length; i += pagesPerView) {
      groups.push(images.slice(i, i + pagesPerView));
    }
    return groups;
  }, [images, pagesPerView]);

  const handleDownloadImages = useCallback(
    async (
      format: ImageExportFormat,
      packaging: ImagePackaging,
      split: boolean,
      combine: boolean,
    ) => {
      if (!images.length) {
        toast.error("No images to download");
        return;
      }
      if (downloadLockRef.current) {
        toast.info("Download already in progress");
        return;
      }
      downloadLockRef.current = true;
      setIsDownloading(true);

      const toastId = toast.loading(`Preparing to download ${images.length} images...`);

      try {
        const formatConfig = await resolveFormatConfig(format);
        const baseLabelRaw = documentLabel || `hitomi-${galleryId}`;
        const baseLabel =
          sanitizeFileName(baseLabelRaw) || `hitomi-${galleryId}`;
        const indexWidth = String(images.length).length;
        const padIndex = (value: number) =>
          String(value).padStart(indexWidth, "0");
        const entries: Record<string, Uint8Array> = {};
        const writeOutput = async (blob: Blob, fileName: string) => {
          if (packaging === "zip") {
            entries[fileName] = new Uint8Array(await blob.arrayBuffer());
          } else {
            triggerDownload(blob, fileName);
          }
        };
        const finalizeZip = async (suffix = "") => {
          if (packaging !== "zip" || !Object.keys(entries).length) return;
          const { zipSync } = await import("fflate");
          const zipped = zipSync(entries, { level: 6 });
          const labelSuffix = suffix ? `-${suffix}` : "";
          const zipName = `${baseLabel}${labelSuffix}-${formatConfig.extension}.zip`;
          const zipBlob = new Blob([zipped as BlobPart], { type: "application/zip" });
          triggerDownload(zipBlob, zipName);
        };

        if (combine) {
          const preload = new Map<number, LoadedImageSource>();
          const dimensions: Array<{ width: number; height: number }> = [];
          let combinedWidth = 0;
          try {
            for (let index = 0; index < images.length; index += 1) {
              const entry = images[index];
              let width = entry.width ?? 0;
              let height = entry.height ?? 0;
              if (!width || !height) {
                const blob = await fetchImageBlob(entry.sources);
                if (!blob) {
                  dimensions.push({ width: 0, height: 0 });
                  continue;
                }
                const loaded = await loadImageSource(blob);
                preload.set(index, loaded);
                width = loaded.width;
                height = loaded.height;
              }
              dimensions.push({ width, height });
              combinedWidth = Math.max(combinedWidth, width);
            }

            const safeWidth = Math.max(1, combinedWidth || 1);
            const widthScale =
              safeWidth > formatConfig.maxDimension
                ? formatConfig.maxDimension / safeWidth
                : 1;
            const scaledWidth = Math.max(1, Math.round(safeWidth * widthScale));
            const maxChunkHeight = Math.min(
              formatConfig.maxDimension,
              Math.floor(formatConfig.maxPixels / scaledWidth),
            );
            const chunkHeight = Math.max(1, maxChunkHeight);
            const totalHeight = dimensions.reduce(
              (sum, entry) => sum + entry.height * widthScale,
              0,
            );
            if (totalHeight <= 0) {
              return;
            }
            const totalChunks = Math.max(
              1,
              Math.ceil(totalHeight / chunkHeight),
            );

            let chunkIndex = 0;
            let chunkYStart = 0;
            let canvas: HTMLCanvasElement | null = null;
            let ctx: CanvasRenderingContext2D | null = null;

            const openChunk = (index: number) => {
              const remaining = Math.max(0, totalHeight - index * chunkHeight);
              const height = Math.max(
                1,
                Math.ceil(Math.min(chunkHeight, remaining)),
              );
              const nextCanvas = document.createElement("canvas");
              nextCanvas.width = scaledWidth;
              nextCanvas.height = height;
              const context = nextCanvas.getContext("2d");
              if (!context) return { canvas: null, ctx: null };
              if (formatConfig.extension === "jpg") {
                context.fillStyle = "#ffffff";
                context.fillRect(0, 0, scaledWidth, height);
              }
              return { canvas: nextCanvas, ctx: context };
            };

            const flushChunk = async () => {
              if (!canvas) return;
              const outputBlob = await canvasToBlob(
                canvas,
                formatConfig.mime,
                formatConfig.quality,
              );
              if (!outputBlob) return;
              const suffix =
                totalChunks > 1 ? `combined-part-${chunkIndex + 1}` : "combined";
              const fileName = `${baseLabel}-${suffix}.${formatConfig.extension}`;
              await writeOutput(outputBlob, fileName);
            };

            const opened = openChunk(chunkIndex);
            canvas = opened.canvas;
            ctx = opened.ctx;
            if (!canvas || !ctx) return;

            let yCursor = 0;

            for (let index = 0; index < images.length; index += 1) {
              const dims = dimensions[index];
              if (!dims || !dims.width || !dims.height) continue;
              const drawWidth = dims.width * widthScale;
              const drawHeight = dims.height * widthScale;
              if (drawWidth <= 0 || drawHeight <= 0) continue;
              const xOffset = Math.floor((scaledWidth - drawWidth) / 2);

              let loaded = preload.get(index);
              if (!loaded) {
                const blob = await fetchImageBlob(images[index].sources);
                if (!blob) continue;
                loaded = await loadImageSource(blob);
              }

              try {
                let remainingHeight = drawHeight;
                let sourceOffsetY = 0;

                while (remainingHeight > 0) {
                  const chunkBottom = chunkYStart + (canvas?.height ?? 0);
                  if (yCursor + 0.5 >= chunkBottom) {
                    await flushChunk();
                    chunkIndex += 1;
                    chunkYStart = chunkIndex * chunkHeight;
                    const next = openChunk(chunkIndex);
                    canvas = next.canvas;
                    ctx = next.ctx;
                    if (!canvas || !ctx) return;
                  }

                  const available = chunkBottom - yCursor;
                  const sliceHeight = Math.min(remainingHeight, available);
                  const sourceSliceHeight = sliceHeight / widthScale;

                  ctx.drawImage(
                    loaded.source,
                    0,
                    sourceOffsetY,
                    dims.width,
                    sourceSliceHeight,
                    xOffset,
                    yCursor - chunkYStart,
                    drawWidth,
                    sliceHeight,
                  );

                  remainingHeight -= sliceHeight;
                  sourceOffsetY += sourceSliceHeight;
                  yCursor += sliceHeight;
                }
              } finally {
                if (preload.has(index)) {
                  loaded.release?.();
                  preload.delete(index);
                }
              }
            }

            await flushChunk();
            await finalizeZip("combined");
            return;
          } finally {
            preload.forEach((loaded) => loaded.release?.());
            preload.clear();
          }
        }

        for (let index = 0; index < images.length; index += 1) {
          const entry = images[index];
          const blob = await fetchImageBlob(entry.sources);
          if (!blob) continue;

          const loaded = await loadImageSource(blob);
          try {
            const width = loaded.width;
            const height = loaded.height;
            const needsSplit =
              split &&
              (width > formatConfig.maxDimension ||
                height > formatConfig.maxDimension ||
                width * height > formatConfig.maxPixels);
            const plan = needsSplit
              ? resolveTilePlan(width, height, formatConfig)
              : { cols: 1, rows: 1, tileWidth: width, tileHeight: height };

            for (let row = 0; row < plan.rows; row += 1) {
              for (let col = 0; col < plan.cols; col += 1) {
                const sw = Math.min(
                  plan.tileWidth,
                  width - col * plan.tileWidth,
                );
                const sh = Math.min(
                  plan.tileHeight,
                  height - row * plan.tileHeight,
                );
                const canvas = document.createElement("canvas");
                canvas.width = sw;
                canvas.height = sh;
                const ctx = canvas.getContext("2d");
                if (!ctx) continue;
                if (formatConfig.extension === "jpg") {
                  ctx.fillStyle = "#ffffff";
                  ctx.fillRect(0, 0, sw, sh);
                }
                ctx.drawImage(
                  loaded.source,
                  col * plan.tileWidth,
                  row * plan.tileHeight,
                  sw,
                  sh,
                  0,
                  0,
                  sw,
                  sh,
                );

                const outputBlob = await canvasToBlob(
                  canvas,
                  formatConfig.mime,
                  formatConfig.quality,
                );
                if (!outputBlob) continue;

                const suffix =
                  plan.cols > 1 || plan.rows > 1
                    ? `-part-${row + 1}-${col + 1}`
                    : "";
                const fileName = `${baseLabel}-${padIndex(index + 1)}${suffix}.${formatConfig.extension}`;
                await writeOutput(outputBlob, fileName);
              }
            }
          } finally {
            loaded.release?.();
          }
        }

        await finalizeZip();

        dismissToast(toastId);
        toast.success(`Successfully downloaded ${images.length} images!`);
      } catch (error) {
        dismissToast(toastId);
        toast.error("Download failed. Please try again.");
        console.error("Image download error:", error);
      } finally {
        downloadLockRef.current = false;
        setIsDownloading(false);
      }
    },
    [documentLabel, galleryId, images],
  );

  const handleSavePdf = useCallback(async () => {
    if (!images.length) {
      toast.error("No images to print");
      return;
    }
    if (downloadLockRef.current) {
      toast.info("Download already in progress");
      return;
    }
    downloadLockRef.current = true;
    setIsDownloading(true);

    try {
      toast.info("Opening print dialog...");
      const title = documentLabel || `Hitomi ${galleryId}`;
      const safeTitle = escapeForHtml(title);
      const bodyHtml = images
        .map((image, index) => {
          const src = pickPreferredSource(image.sources);
          const alt = escapeForHtml(image.alt || `Page ${index + 1}`);
          return `<figure class="hitomi-page"><img src="${src}" alt="${alt}" /><figcaption>Page ${index + 1}</figcaption></figure>`;
        })
        .join("");

      const documentContent = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>${safeTitle}</title>
    <style>
      body{margin:24px;font-family:var(--font-manrope,Segoe UI,sans-serif);color:#0f172a;}
      .hitomi-page{margin:0 0 24px;page-break-after:always;}
      .hitomi-page:last-child{page-break-after:auto;}
      img{width:100%;height:auto;border-radius:12px;border:1px solid #e2e8f0;}
      figcaption{margin-top:6px;font-size:11px;text-transform:uppercase;letter-spacing:0.2em;color:#94a3b8;}
      @media print{body{margin:16px;}}
    </style>
  </head>
  <body>
    ${bodyHtml}
  </body>
</html>`;

      const printWindow = window.open("", "_blank", "width=1024,height=768");
      if (!printWindow) return;
      printWindow.document.open();
      printWindow.document.write(documentContent);
      printWindow.document.close();
      await waitForDocumentImages(printWindow.document);
      printWindow.focus();
      printWindow.print();
    } finally {
      downloadLockRef.current = false;
      setIsDownloading(false);
    }
  }, [documentLabel, galleryId, images]);

  useEffect(() => {
    return subscribeToViewerDownload((detail: ViewerDownloadRequest) => {
      if (detail.kind === "images") {
        void handleDownloadImages(
          detail.format,
          detail.packaging,
          detail.split,
          detail.combine,
        );
      }
      if (detail.kind === "pdf") {
        void handleSavePdf();
      }
    });
  }, [handleDownloadImages, handleSavePdf]);

  const startPage = page && page > 0 ? page : null;
  const isHorizontal = scrollAxis === "horizontal";

  const scrollToGroup = useCallback(
    (index: number, behavior: ScrollBehavior = "smooth") => {
      if (!imageGroups.length) return;
      const clamped = Math.max(0, Math.min(index, imageGroups.length - 1));
      const target = groupRefs.current[clamped];
      if (!target) return;
      target.scrollIntoView({ behavior, block: "start", inline: "start" });
      setActiveGroupIndex(clamped);
    },
    [imageGroups.length],
  );

  useEffect(() => {
    if (!startPage || !imageGroups.length) return;
    const maxPage = images.length;
    const safePage = Math.min(startPage, maxPage || startPage);
    const groupIndex = Math.max(0, Math.floor((safePage - 1) / pagesPerView));
    scrollToGroup(groupIndex, "auto");
  }, [startPage, imageGroups.length, images.length, pagesPerView, scrollAxis, scrollToGroup]);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container || !imageGroups.length) return;

    const updateActiveGroup = () => {
      const containerRect = container.getBoundingClientRect();
      let closestIndex = 0;
      let closestDistance = Number.POSITIVE_INFINITY;

      groupRefs.current.forEach((element, index) => {
        if (!element) return;
        const rect = element.getBoundingClientRect();
        const distance = Math.abs(
          (isHorizontal ? rect.left : rect.top) -
            (isHorizontal ? containerRect.left : containerRect.top),
        );
        if (distance < closestDistance) {
          closestDistance = distance;
          closestIndex = index;
        }
      });

      setActiveGroupIndex(closestIndex);
    };

    const handleScroll = () => {
      const scrollPos = isHorizontal ? container.scrollLeft : container.scrollTop;
      const delta = scrollPos - lastScrollPosRef.current;
      if (Math.abs(delta) > 6) {
        if (scrollPos <= 0) {
          setControlsVisible(true);
        } else {
          setControlsVisible(delta < 0);
        }
        lastScrollPosRef.current = scrollPos;
      }

      if (scrollFrameRef.current !== null) return;
      scrollFrameRef.current = window.requestAnimationFrame(() => {
        scrollFrameRef.current = null;
        updateActiveGroup();
      });
    };

    container.addEventListener("scroll", handleScroll, { passive: true });
    lastScrollPosRef.current = isHorizontal ? container.scrollLeft : container.scrollTop;
    updateActiveGroup();

    return () => {
      if (scrollFrameRef.current !== null) {
        window.cancelAnimationFrame(scrollFrameRef.current);
      }
      container.removeEventListener("scroll", handleScroll);
    };
  }, [imageGroups.length, isHorizontal, pagesPerView]);

  const goToNext = useCallback(() => {
    if (!imageGroups.length) return;
    scrollToGroup(activeGroupIndex + 1);
  }, [activeGroupIndex, imageGroups.length, scrollToGroup]);

  const goToPrevious = useCallback(() => {
    if (!imageGroups.length) return;
    scrollToGroup(activeGroupIndex - 1);
  }, [activeGroupIndex, imageGroups.length, scrollToGroup]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented) return;
      if (isEditableElement(document.activeElement)) return;
      if (event.key === "ArrowRight" || event.key === "ArrowDown") {
        event.preventDefault();
        goToNext();
        return;
      }
      if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
        event.preventDefault();
        goToPrevious();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [goToNext, goToPrevious]);

  const handleViewerClick = useCallback(
    (event: MouseEvent<HTMLDivElement>) => {
      if (event.defaultPrevented) return;
      if (event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const target = event.target as HTMLElement | null;
      if (target?.closest("button") || target?.closest("a")) return;
      const container = scrollContainerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const relativeX = event.clientX - rect.left;
      if (relativeX < rect.width * 0.45) {
        goToPrevious();
      } else {
        goToNext();
      }
    },
    [goToNext, goToPrevious],
  );

  const themeMode = theme === "system" ? systemTheme : theme;
  const maxWidthClass = pagesPerView === 2 ? "max-w-6xl" : "max-w-4xl";
  const gridColsClass = pagesPerView === 2 ? "grid-cols-2" : "grid-cols-1";
  const groupWidthClass =
    pagesPerView === 2 ? "w-[92vw] max-w-[1400px]" : "w-[92vw] max-w-[900px]";
  const toggleClass = (active: boolean) =>
    `rounded-full border px-3 py-1 text-[11px] font-semibold transition ${
      active
        ? "border-emerald-500 bg-emerald-600 text-white"
        : themeMode === "dark"
          ? "border-white/10 bg-slate-900 text-slate-200 hover:border-emerald-400 hover:text-emerald-300"
          : "border-black/10 bg-white text-slate-600 hover:border-emerald-200 hover:text-emerald-700"
    }`;

  const containerClass =
    themeMode === "dark" ? "bg-slate-950 text-slate-100" : "bg-white text-slate-900";
  const headerClass =
    themeMode === "dark"
      ? "border-white/10 bg-slate-950/90 text-slate-200"
      : "border-black/5 bg-white/80 text-slate-500";
  const mutedTextClass = themeMode === "dark" ? "text-slate-400" : "text-slate-500";

  if (error) {
    return (
      <div className={`${className ?? ""}`}>
        <ViewerErrorState
          title={error.title}
          description={error.description}
          details={error.details}
          action={showHomeLink ? { label: "Back to open", href: "/open" } : undefined}
        />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div
        className={`flex h-full w-full items-center justify-center ${className ?? ""} ${
          themeMode === "dark" ? "bg-slate-950 text-slate-100" : "bg-white text-slate-900"
        }`}
      >
        <div>Loading...</div>
      </div>
    );
  }

  if (!galleryInfo) {
    return (
      <div
        className={`flex h-full w-full items-center justify-center ${className ?? ""} ${
          themeMode === "dark" ? "bg-slate-950 text-slate-100" : "bg-white text-slate-900"
        }`}
      >
        <div className={themeMode === "dark" ? "text-sm text-slate-400" : "text-sm text-slate-500"}>
          Gallery unavailable.
        </div>
      </div>
    );
  }

  return (
    <div className={`flex h-full w-full flex-col ${containerClass} ${className ?? ""}`}>
      <div
        className={`sticky top-0 z-30 border-b px-6 py-3 transition-transform duration-200 ease-out ${headerClass} ${
          controlsVisible ? "translate-y-0" : "-translate-y-full"
        }`}
        style={{ willChange: "transform" }}
      >
        <div className={`flex flex-wrap items-center gap-3 text-[11px] ${mutedTextClass}`}>
          <div className="flex items-center gap-2">
            <span className={`uppercase tracking-[0.2em] ${mutedTextClass}`}>Pages</span>
            <button
              type="button"
              className={toggleClass(pagesPerView === 1)}
              onClick={() => setPagesPerView(1)}
            >
              1-up
            </button>
            <button
              type="button"
              className={toggleClass(pagesPerView === 2)}
              onClick={() => setPagesPerView(2)}
            >
              2-up
            </button>
          </div>
          <div className="flex items-center gap-2">
            <span className={`uppercase tracking-[0.2em] ${mutedTextClass}`}>Scroll</span>
            <button
              type="button"
              className={toggleClass(scrollAxis === "vertical")}
              onClick={() => setScrollAxis("vertical")}
            >
              Vertical
            </button>
            <button
              type="button"
              className={toggleClass(scrollAxis === "horizontal")}
              onClick={() => setScrollAxis("horizontal")}
            >
              Horizontal
            </button>
          </div>
          {isDownloading ? (
            <div className="ml-auto rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-semibold text-emerald-700">
              Preparing download...
            </div>
          ) : null}
        </div>
      </div>
      <div
        ref={scrollContainerRef}
        onClick={handleViewerClick}
        className={`flex-1 ${
          isHorizontal ? "overflow-x-auto overflow-y-hidden" : "overflow-y-auto"
        }`}
      >
        {images.length ? (
          <div
            className={
              isHorizontal
                ? "flex w-max cursor-pointer items-start gap-6 p-6"
                : `mx-auto flex w-full ${maxWidthClass} cursor-pointer flex-col gap-6 p-6`
            }
          >
            {imageGroups.map((group, groupIndex) => (
              <div
                key={`group-${groupIndex}`}
                ref={(element) => {
                  groupRefs.current[groupIndex] = element;
                }}
                className={`grid w-full gap-6 ${gridColsClass} ${
                  isHorizontal ? `shrink-0 ${groupWidthClass}` : ""
                }`}
              >
                {group.map((image, index) => (
                  <HitomiImage
                    key={`${image.sources[0] ?? "image"}-${groupIndex}-${index}`}
                    {...image}
                    themeMode={themeMode}
                  />
                ))}
                {pagesPerView === 2 && group.length === 1 ? (
                  <div
                    className={`hidden h-full rounded-2xl border border-dashed md:block ${
                      themeMode === "dark"
                        ? "border-slate-700 bg-slate-900"
                        : "border-slate-200 bg-slate-50"
                    }`}
                  />
                ) : null}
              </div>
            ))}
          </div>
        ) : (
          <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 p-6">
            <div
              className={`rounded-2xl border border-dashed px-6 py-10 text-center text-xs ${
                themeMode === "dark"
                  ? "border-slate-700 bg-slate-900 text-slate-400"
                  : "border-slate-200 bg-slate-50 text-slate-400"
              }`}
            >
              No pages available for this gallery.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
