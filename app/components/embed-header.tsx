"use client";

import { useEffect, useRef, useState } from "react";

type EmbedHeaderProps = {
  documentLabel: string;
  viewerUrl: string;
  theme: "light" | "dark" | "system";
};

const SCROLL_DELTA = 8;

const getScrollTop = (target: EventTarget | null) => {
  if (!target) return 0;
  if (target instanceof Document) {
    return target.scrollingElement?.scrollTop ?? 0;
  }
  if (target instanceof HTMLElement) {
    return target.scrollTop;
  }
  return 0;
};

export function EmbedHeader({ documentLabel, viewerUrl, theme }: EmbedHeaderProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [systemTheme, setSystemTheme] = useState<"light" | "dark">("light");
  const lastScrollTop = useRef(0);
  const lastTarget = useRef<EventTarget | null>(null);

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
    const options: AddEventListenerOptions = { capture: true, passive: true };
    const handleScroll = (event: Event) => {
      const target = event.target;
      const scrollTop = getScrollTop(target);

      if (lastTarget.current !== target) {
        lastTarget.current = target;
        lastScrollTop.current = scrollTop;
        setIsVisible(true);
        return;
      }

      const delta = scrollTop - lastScrollTop.current;
      if (Math.abs(delta) < SCROLL_DELTA) return;

      if (scrollTop <= 0) {
        setIsVisible(true);
      } else {
        setIsVisible(delta < 0);
      }

      lastScrollTop.current = scrollTop;
    };

    window.addEventListener("scroll", handleScroll, options);
    return () => {
      window.removeEventListener("scroll", handleScroll, options);
    };
  }, []);

  const resolvedTheme = theme === "system" ? systemTheme : theme;
  const headerClass =
    resolvedTheme === "dark"
      ? "border-white/10 bg-slate-950/95 text-slate-200"
      : "border-black/5 bg-white/90 text-slate-600";
  const headerTitleClass =
    resolvedTheme === "dark" ? "text-slate-100" : "text-slate-900";
  const headerMetaClass =
    resolvedTheme === "dark" ? "text-slate-400" : "text-slate-400";

  return (
    <div
      className={`sticky top-0 z-40 transition-transform duration-200 ease-out ${
        isVisible ? "translate-y-0" : "-translate-y-full"
      }`}
      style={{ willChange: "transform" }}
    >
      <header className={`border-b px-4 py-3 text-xs ${headerClass}`}>
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className={`truncate text-sm font-semibold ${headerTitleClass}`}>
              {documentLabel}
            </p>
            <p className={`truncate text-[11px] ${headerMetaClass}`}>
              Embedded viewer
            </p>
          </div>
          <a
            href={viewerUrl}
            target="_blank"
            rel="noreferrer"
            className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-semibold text-emerald-700 transition hover:bg-emerald-100"
          >
            Open full view
          </a>
        </div>
      </header>
    </div>
  );
}
