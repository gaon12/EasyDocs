"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { PluginRegistry } from "@embedpdf/core";
import type { ScrollCapability } from "@embedpdf/plugin-scroll";
import type {
  SearchCapability,
  SearchDocumentState,
} from "@embedpdf/plugin-search";
import type { UICapability } from "@embedpdf/plugin-ui";
import type { ExportCapability } from "@embedpdf/plugin-export";
import { subscribeToViewerDownload } from "@/app/lib/viewer-download";
import { toast } from "@/app/lib/toast";

type SidebarState = {
  thumbnails: boolean;
  outline: boolean;
  search: boolean;
};

type PdfToolbarProps = {
  registry: PluginRegistry;
  documentId: string;
  showSidebarControls?: boolean;
  showSearch?: boolean;
  allowDownload?: boolean;
  theme?: "light" | "dark" | "system";
};

export function PdfToolbar({
  registry,
  documentId,
  showSidebarControls = true,
  showSearch = true,
  allowDownload = true,
  theme = "light",
}: PdfToolbarProps) {
  const scroll = useMemo(
    () => registry.getPlugin("scroll")?.provides?.() as ScrollCapability | undefined,
    [registry],
  );
  const search = useMemo(
    () => registry.getPlugin("search")?.provides?.() as SearchCapability | undefined,
    [registry],
  );
  const ui = useMemo(
    () => registry.getPlugin("ui")?.provides?.() as UICapability | undefined,
    [registry],
  );
  const exporter = useMemo(
    () => registry.getPlugin("export")?.provides?.() as ExportCapability | undefined,
    [registry],
  );

  const [pageState, setPageState] = useState({ current: 1, total: 0 });
  const [pageInput, setPageInput] = useState("1");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchState, setSearchState] = useState<SearchDocumentState | null>(
    null,
  );
  const [sidebarState, setSidebarState] = useState<SidebarState>({
    thumbnails: false,
    outline: false,
    search: false,
  });
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const [systemTheme, setSystemTheme] = useState<"light" | "dark">("light");

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

  useEffect(() => {
    if (!scroll) return;
    const update = () => {
      const current = scroll.getCurrentPage();
      const total = scroll.getTotalPages();
      setPageState({ current, total });
      setPageInput(String(current));
    };
    update();
    const unsubscribe = scroll.onPageChange((event) => {
      if (event.documentId !== documentId) return;
      setPageState({ current: event.pageNumber, total: event.totalPages });
      setPageInput(String(event.pageNumber));
    });
    const unsubLayout = scroll.onLayoutReady((event) => {
      if (event.documentId !== documentId) return;
      setPageState({ current: event.pageNumber, total: event.totalPages });
      setPageInput(String(event.pageNumber));
    });
    return () => {
      unsubscribe?.();
      unsubLayout?.();
    };
  }, [scroll, documentId]);

  useEffect(() => {
    if (!search) return;
    const scope = search.forDocument(documentId);
    setSearchState(scope.getState());
    const unsubscribe = scope.onStateChange((state) => setSearchState(state));
    return () => {
      unsubscribe?.();
    };
  }, [search, documentId]);

  useEffect(() => {
    if (!ui) return;
    const scope = ui.forDocument(documentId);
    const update = () => {
      const isOpen = scope.isSidebarOpen("left", "main", "sidebar-panel");
      const activeTab = scope.getSidebarTab("sidebar-panel");
      const searchOpen = scope.isSidebarOpen("right", "main", "search-panel");
      setSidebarState({
        thumbnails: isOpen && activeTab === "thumbnails",
        outline: isOpen && activeTab === "outline",
        search: searchOpen,
      });
    };
    update();
    const unsubscribe = ui.onSidebarChanged((event) => {
      if (event.documentId !== documentId) return;
      update();
    });
    return () => {
      unsubscribe?.();
    };
  }, [ui, documentId]);

  useEffect(() => {
    if (!search) return;
    const scope = search.forDocument(documentId);
    const trimmed = searchQuery.trim();
    if (!trimmed) {
      scope.stopSearch();
      return;
    }
    const timer = window.setTimeout(() => {
      scope.startSearch();
      scope.searchAllPages(trimmed);
    }, 250);
    return () => window.clearTimeout(timer);
  }, [search, searchQuery, documentId]);

  const handlePageCommit = useCallback(() => {
    if (!scroll) return;
    const next = Number.parseInt(pageInput, 10);
    if (!Number.isFinite(next)) return;
    const total = scroll.getTotalPages();
    const clamped = Math.min(Math.max(next, 1), total || next);
    scroll.scrollToPage({ pageNumber: clamped, behavior: "instant" });
  }, [scroll, pageInput]);

  const handlePrevPage = useCallback(() => {
    scroll?.scrollToPreviousPage("smooth");
  }, [scroll]);

  const handleNextPage = useCallback(() => {
    scroll?.scrollToNextPage("smooth");
  }, [scroll]);

  const toggleSidebarTab = useCallback(
    (tabId: "thumbnails" | "outline") => {
      if (!ui) return;
      const scope = ui.forDocument(documentId);
      const isOpen = scope.isSidebarOpen("left", "main", "sidebar-panel");
      const activeTab = scope.getSidebarTab("sidebar-panel");
      if (isOpen && activeTab === tabId) {
        scope.closeSidebarSlot("left", "main");
        return;
      }
      scope.setSidebarTab("sidebar-panel", tabId);
      scope.setActiveSidebar("left", "main", "sidebar-panel", tabId);
    },
    [ui, documentId],
  );

  const toggleSearchPanel = useCallback(() => {
    if (!ui) return;
    const scope = ui.forDocument(documentId);
    scope.toggleSidebar("right", "main", "search-panel");
  }, [ui, documentId]);

  const handleNextResult = useCallback(() => {
    if (!search) return;
    const scope = search.forDocument(documentId);
    scope.nextResult();
  }, [search, documentId]);

  const handlePrevResult = useCallback(() => {
    if (!search) return;
    const scope = search.forDocument(documentId);
    scope.previousResult();
  }, [search, documentId]);

  const handleDownload = useCallback(() => {
    if (!exporter) return;
    try {
      const scope = exporter.forDocument(documentId);
      scope.download();
      toast.success("PDF download started");
    } catch (error) {
      toast.error("Failed to download PDF");
      console.error("Download failed:", error);
    }
  }, [exporter, documentId]);

  useEffect(() => {
    return subscribeToViewerDownload((detail) => {
      if (detail.kind !== "pdf") return;
      handleDownload();
    });
  }, [handleDownload]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable)
      ) {
        return;
      }

      if (event.key === "PageDown") {
        event.preventDefault();
        handleNextPage();
        return;
      }
      if (event.key === "PageUp") {
        event.preventDefault();
        handlePrevPage();
        return;
      }

      if ((event.ctrlKey || event.metaKey) && event.shiftKey) {
        const key = event.key.toLowerCase();
        if (key === "f" && showSearch) {
          event.preventDefault();
          searchInputRef.current?.focus();
          searchInputRef.current?.select();
        }
        if (key === "t" && showSidebarControls) {
          event.preventDefault();
          toggleSidebarTab("thumbnails");
        }
        if (key === "o" && showSidebarControls) {
          event.preventDefault();
          toggleSidebarTab("outline");
        }
        if (key === "d" && allowDownload) {
          event.preventDefault();
          handleDownload();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [
    allowDownload,
    handleDownload,
    handleNextPage,
    handlePrevPage,
    showSearch,
    showSidebarControls,
    toggleSidebarTab,
  ]);

  const hasQuery = searchQuery.trim().length > 0;
  const matchLabel = hasQuery
    ? searchState?.loading
      ? "Searching..."
      : searchState?.total
        ? `${searchState.activeResultIndex + 1}/${searchState.total}`
        : "No matches"
    : "Find in PDF";
  const themeMode = theme === "system" ? systemTheme : theme;
  const toolbarClass =
    themeMode === "dark"
      ? "border-white/10 bg-slate-950/90 text-slate-200"
      : "border-black/5 bg-white/90 text-slate-600";
  const controlClass =
    themeMode === "dark"
      ? "border-white/10 bg-slate-900 text-slate-200 hover:border-emerald-400 hover:text-emerald-300"
      : "border-black/10 bg-white text-slate-600 hover:border-emerald-200 hover:text-emerald-700";
  const activeClass =
    themeMode === "dark"
      ? "border-emerald-400 bg-emerald-500/20 text-emerald-200"
      : "border-emerald-200 bg-emerald-50 text-emerald-700";
  const inputClass =
    themeMode === "dark"
      ? "border-white/10 bg-slate-900 text-slate-100 placeholder:text-slate-500"
      : "border-black/10 bg-white text-slate-700 placeholder:text-slate-400";
  const subtleTextClass = themeMode === "dark" ? "text-slate-400" : "text-slate-400";

  return (
    <div className={`flex flex-wrap items-center gap-2 border-b px-3 py-2 text-xs ${toolbarClass}`}>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={handlePrevPage}
          disabled={!scroll}
          className={`rounded-md border px-2 py-1 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${controlClass}`}
        >
          Prev
        </button>
        <input
          value={pageInput}
          onChange={(event) => setPageInput(event.target.value)}
          onBlur={handlePageCommit}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              handlePageCommit();
            }
          }}
          className={`w-14 rounded-md border px-2 py-1 text-center text-xs shadow-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 ${inputClass}`}
          inputMode="numeric"
          disabled={!scroll}
          aria-label="Page number"
        />
        <span className={`text-xs ${subtleTextClass}`}>
          / {pageState.total || "--"}
        </span>
        <button
          type="button"
          onClick={handleNextPage}
          disabled={!scroll}
          className={`rounded-md border px-2 py-1 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${controlClass}`}
        >
          Next
        </button>
      </div>

      {showSidebarControls ? (
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => toggleSidebarTab("thumbnails")}
            disabled={!ui}
            className={`rounded-md border px-2 py-1 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${
              sidebarState.thumbnails ? activeClass : controlClass
            }`}
          >
            Thumbnails
          </button>
          <button
            type="button"
            onClick={() => toggleSidebarTab("outline")}
            disabled={!ui}
            className={`rounded-md border px-2 py-1 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${
              sidebarState.outline ? activeClass : controlClass
            }`}
          >
            Outline
          </button>
          <button
            type="button"
            onClick={toggleSearchPanel}
            disabled={!ui}
            className={`rounded-md border px-2 py-1 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${
              sidebarState.search ? activeClass : controlClass
            }`}
          >
            Search panel
          </button>
        </div>
      ) : null}

      {showSearch ? (
        <div className="flex flex-1 flex-wrap items-center gap-2">
          <div className="relative min-w-[180px] max-w-xs flex-1">
            <input
              ref={searchInputRef}
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Find in PDF"
              className={`w-full rounded-md border px-2.5 py-1.5 text-xs shadow-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 ${inputClass}`}
              type="search"
              disabled={!search}
            />
          </div>
          <span className={`text-xs ${subtleTextClass}`}>{matchLabel}</span>
          <button
            type="button"
            onClick={handlePrevResult}
            disabled={!search || !searchState?.total}
            className={`rounded-md border px-2 py-1 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${controlClass}`}
          >
            Prev match
          </button>
          <button
            type="button"
            onClick={handleNextResult}
            disabled={!search || !searchState?.total}
            className={`rounded-md border px-2 py-1 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${controlClass}`}
          >
            Next match
          </button>
        </div>
      ) : null}

      {allowDownload ? (
        <button
          type="button"
          onClick={handleDownload}
          disabled={!exporter}
          className={`rounded-md border px-2 py-1 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${controlClass}`}
        >
          Download
        </button>
      ) : null}
    </div>
  );
}
