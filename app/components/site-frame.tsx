import Link from "next/link";
import { FileText } from "lucide-react";
import type { ReactNode } from "react";

type SiteFrameProps = {
  children: ReactNode;
};

const NAV_ITEMS = [
  { href: "/", label: "Home" },
  { href: "/open", label: "Open" },
  { href: "/library", label: "Library" },
  { href: "/embed-builder", label: "Embed builder" },
  { href: "/guide", label: "Guide" },
];

export function SiteFrame({ children }: SiteFrameProps) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[var(--background)] text-[var(--foreground)]">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-emerald-200/40 blur-3xl" />
        <div className="absolute top-24 right-[-10%] h-80 w-80 rounded-full bg-amber-200/50 blur-3xl" />
        <div className="absolute bottom-[-220px] left-[-5%] h-[420px] w-[420px] rounded-full bg-emerald-100/60 blur-3xl" />
      </div>
      <header className="relative z-10 border-b border-black/5">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-6">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-600 text-white">
              <FileText className="h-6 w-6" />
            </div>
            <div>
              <p className="font-display text-lg text-slate-900">EasyDocs</p>
              <p className="text-xs uppercase tracking-[0.32em] text-slate-400">
                Viewer
              </p>
            </div>
          </Link>
          <nav
            className="flex flex-wrap items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.25em] text-slate-500"
            aria-label="Primary navigation"
          >
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-full border border-black/10 bg-white/80 px-3 py-1.5 transition hover:border-emerald-200 hover:text-emerald-700"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <main className="relative z-10 mx-auto max-w-6xl px-6 pb-20 pt-10">
        {children}
      </main>
      <footer className="relative z-10 border-t border-black/5">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-6 py-6 text-xs text-slate-500 md:flex-row md:items-center md:justify-between">
          <span>Local uploads stay in your browser.</span>
          <span>Drop or paste anywhere to open.</span>
          <span>Use /embed for shareable viewer links.</span>
        </div>
      </footer>
    </div>
  );
}
