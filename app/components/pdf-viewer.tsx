"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  PDFViewer,
  ZoomMode,
  type PDFViewerConfig,
} from "@embedpdf/react-pdf-viewer";
import type { PluginRegistry } from "@embedpdf/core";
import type { ScrollCapability } from "@embedpdf/plugin-scroll";
import type { DocumentManagerCapability } from "@embedpdf/plugin-document-manager";
import { resolvePageNumber } from "../lib/pdf";
import { getLocalFile } from "../lib/local-files";
import { ViewerErrorState } from "./viewer-error";
import { PdfToolbar } from "./pdf-toolbar";

type PdfViewerFrameProps = {
  src?: string;
  documentManager?: PDFViewerConfig["documentManager"];
  documentBuffer?: {
    buffer: ArrayBuffer;
    name: string;
  };
  docKey?: string;
  className?: string;
  page?: number | null;
  showToolbar?: boolean;
  theme?: "light" | "dark" | "system";
};

type PdfViewerClientProps = {
  fileKey?: string;
  src?: string;
  className?: string;
  page?: number | null;
  showToolbar?: boolean;
  theme?: "light" | "dark" | "system";
};

type ViewerError = {
  title: string;
  description: string;
  details?: string;
};

const parseHashPage = (hash: string) => {
  if (!hash) return null;
  const cleaned = hash.startsWith("#") ? hash.slice(1) : hash;
  if (!cleaned) return null;
  const params = new URLSearchParams(cleaned);
  const candidate = params.get("page") || params.get("p");
  return resolvePageNumber(candidate ?? undefined);
};

export function PdfViewerClient({
  fileKey,
  src,
  className,
  page,
  showToolbar = true,
  theme,
}: PdfViewerClientProps) {
  const [localBuffer, setLocalBuffer] = useState<ArrayBuffer | null>(null);
  const [localName, setLocalName] = useState("");
  const [localError, setLocalError] = useState<ViewerError | null>(null);
  const blobUrlRef = useRef<string | null>(null);

  useEffect(() => {
    let active = true;

    const loadLocalFile = async () => {
      if (!fileKey) {
        setLocalBuffer(null);
        setLocalName("");
        setLocalError(null);
        return;
      }

      setLocalBuffer(null);
      setLocalName("");
      setLocalError(null);

      const file = await getLocalFile(fileKey);
      if (!active) return;
      if (!file) {
        setLocalError({
          title: "Local upload unavailable",
          description:
            "This local upload is no longer available. Please upload it again to continue.",
        });
        return;
      }

      setLocalName(file.name);
      try {
        const buffer = await file.arrayBuffer();
        if (!active) return;
        setLocalBuffer(buffer);
      } catch (error) {
        if (!active) return;
        setLocalBuffer(null);
        setLocalError({
          title: "Couldn't read the local file",
          description: "Please upload the document again and try once more.",
        });
      }
    };

    void loadLocalFile();

    return () => {
      active = false;
    };
  }, [fileKey]);

  useEffect(() => {
    return () => {
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
        blobUrlRef.current = null;
      }
    };
  }, []);

  const localDocumentBuffer = useMemo(() => {
    if (!localBuffer) return null;
    return {
      buffer: localBuffer,
      name: localName || "Local PDF",
    };
  }, [localBuffer, localName]);

  if (fileKey && localError) {
    return (
      <div className={className}>
        <ViewerErrorState
          title={localError.title}
          description={localError.description}
          details={localError.details}
          action={{ label: "Back to open", href: "/open" }}
        />
      </div>
    );
  }

  if (fileKey && !localBuffer) {
    return (
      <div
        className={`flex h-full w-full items-center justify-center rounded-2xl border border-black/5 bg-white/80 text-sm text-slate-500 ${
          className ?? ""
        }`}
      >
        Preparing local file...
      </div>
    );
  }

  if (fileKey && localDocumentBuffer) {
    return (
      <PdfViewerFrame
        documentBuffer={localDocumentBuffer}
        docKey={`local-${fileKey}`}
        page={page}
        className={className}
        showToolbar={showToolbar}
        theme={theme}
      />
    );
  }

  return (
    <PdfViewerFrame
      src={src}
      page={page}
      className={className}
      docKey={src}
      showToolbar={showToolbar}
      theme={theme}
    />
  );
}

export function PdfViewerFrame({
  src,
  documentManager,
  documentBuffer,
  docKey,
  className,
  page,
  showToolbar = true,
  theme = "light",
}: PdfViewerFrameProps) {
  const [registryState, setRegistryState] = useState<{
    sourceKey: string;
    registry: PluginRegistry;
  } | null>(null);
  const [activeDocumentId, setActiveDocumentId] = useState<string | null>(null);
  const hasScrolledRef = useRef(false);
  const openedBufferRef = useRef<string | null>(null);
  const frameBlobUrlRef = useRef<string | null>(null);

  const hasBufferDocument = Boolean(
    documentBuffer ||
      documentManager?.initialDocuments?.some((doc) => "buffer" in doc),
  );
  const hasDocument =
    Boolean(src) ||
    Boolean(documentManager?.initialDocuments?.length) ||
    Boolean(documentBuffer);
  const sourceKey = docKey ?? src ?? "";
  const documentName = useMemo(() => {
    if (documentBuffer?.name) return documentBuffer.name;
    if (!src) return "document.pdf";
    const cleaned = src.split("#")[0]?.split("?")[0] ?? "";
    const lastSegment = cleaned.split("/").filter(Boolean).pop() ?? "";
    if (!lastSegment) return "document.pdf";
    return lastSegment.toLowerCase().endsWith(".pdf")
      ? lastSegment
      : `${lastSegment}.pdf`;
  }, [documentBuffer?.name, src]);

  const config = useMemo<PDFViewerConfig>(() => {
    const baseConfig: PDFViewerConfig = {
      theme: { preference: theme },
      zoom: { defaultZoomLevel: ZoomMode.FitWidth },
      export: { defaultFileName: documentName },
      search: { showAllResults: true },
    };

    if (src) {
      baseConfig.src = src;
      baseConfig.worker = src.startsWith("blob:") ? false : true;
    } else if (hasBufferDocument) {
      baseConfig.worker = false;
    }

    if (documentManager) {
      baseConfig.documentManager = documentManager;
    }

    return baseConfig;
  }, [src, documentManager, hasBufferDocument, documentName, theme]);

  const hashPage =
    page == null && typeof window !== "undefined"
      ? parseHashPage(window.location.hash)
      : null;
  const targetPage = page ?? hashPage;

  const registry =
    registryState?.sourceKey === sourceKey ? registryState.registry : null;

  const handleReady = useCallback(
    (nextRegistry: PluginRegistry) => {
      setRegistryState({ sourceKey, registry: nextRegistry });
    },
    [sourceKey],
  );

  useEffect(() => {
    if (!registry) {
      setActiveDocumentId(null);
      return;
    }
    const docPlugin = registry.getPlugin("document-manager");
    const provides = docPlugin?.provides?.() as DocumentManagerCapability | undefined;
    if (!provides) return;
    setActiveDocumentId(provides.getActiveDocumentId());
    const unsubscribe = provides.onActiveDocumentChanged((event) => {
      setActiveDocumentId(event.currentDocumentId);
    });
    return () => {
      unsubscribe?.();
    };
  }, [registry, sourceKey]);

  useEffect(() => {
    hasScrolledRef.current = false;
    openedBufferRef.current = null;
  }, [sourceKey]);

  useEffect(() => {
    hasScrolledRef.current = false;
  }, [targetPage]);

  useEffect(() => {
    if (!registry || !documentBuffer) return;
    if (openedBufferRef.current === sourceKey) return;
    const docPlugin = registry.getPlugin("document-manager");
    const provides = docPlugin?.provides?.() as
      | DocumentManagerCapability
      | undefined;
    if (!provides) return;
    openedBufferRef.current = sourceKey;
    provides.openDocumentBuffer({
      buffer: documentBuffer.buffer,
      name: documentBuffer.name,
      autoActivate: true,
    });
  }, [registry, documentBuffer, sourceKey]);

  useEffect(() => {
    if (!registry || !targetPage || hasScrolledRef.current) return;
    const scrollPlugin = registry.getPlugin("scroll");
    const scroll = scrollPlugin?.provides?.() as ScrollCapability | undefined;
    if (!scroll) return;

    let active = true;

    const scrollToTarget = () => {
      if (!active || hasScrolledRef.current) return;
      scroll.scrollToPage({ pageNumber: targetPage, behavior: "instant" });
      hasScrolledRef.current = true;
    };

    if (scroll.getTotalPages() > 0) {
      scrollToTarget();
      return () => {
        active = false;
      };
    }

    let didUnsubscribe = false;
    const unsubscribe = scroll.onLayoutReady((event) => {
      if (!event.isInitial) return;
      scrollToTarget();
      if (!didUnsubscribe) {
        didUnsubscribe = true;
        unsubscribe();
      }
    });

    return () => {
      active = false;
      if (!didUnsubscribe) {
        didUnsubscribe = true;
        unsubscribe();
      }
    };
  }, [registry, targetPage]);

  useEffect(() => {
    if (!src || !src.startsWith("blob:")) return;

    frameBlobUrlRef.current = src;

    return () => {
      if (src.startsWith("blob:")) {
        try {
          URL.revokeObjectURL(src);
        } catch (error) {
          console.error("Failed to revoke blob URL:", error);
        }
      }
      frameBlobUrlRef.current = null;
    };
  }, [src]);

  if (!hasDocument) {
    return (
      <div
        className={`flex h-full w-full items-center justify-center rounded-2xl border border-black/5 bg-white/80 text-sm text-slate-500 ${
          className ?? ""
        }`}
      >
        Provide a PDF URL to preview.
      </div>
    );
  }

  const canShowToolbar = Boolean(showToolbar && registry && activeDocumentId);

  return (
    <div className={`flex h-full w-full flex-col ${className ?? ""}`}>
      {canShowToolbar ? (
        <PdfToolbar
          registry={registry as PluginRegistry}
          documentId={activeDocumentId as string}
          allowDownload={false}
          theme={theme}
        />
      ) : null}
      <div className="flex-1 overflow-hidden">
        <PDFViewer
          key={sourceKey || "document"}
          config={config}
          className="h-full w-full"
          onReady={handleReady}
        />
      </div>
    </div>
  );
}
