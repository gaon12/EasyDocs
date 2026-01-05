import Link from "next/link";
import { FolderOpen, Library, Code2, BookOpen } from "lucide-react";
import { SiteFrame } from "./components/site-frame";
import { QuickOpen } from "./components/quick-open";

const ROUTES = [
  {
    href: "/open",
    label: "Open documents",
    description: "Upload local files or paste a URL to start viewing.",
    Icon: FolderOpen,
  },
  {
    href: "/library",
    label: "Recent library",
    description: "Pinned and recent documents stored locally in this browser.",
    Icon: Library,
  },
  {
    href: "/embed-builder",
    label: "Embed builder",
    description: "Tune toolbar, theme, size, and start page for embeds.",
    Icon: Code2,
  },
  {
    href: "/guide",
    label: "Usage guide",
    description: "Routes, URL parameters, and sharing tips.",
    Icon: BookOpen,
  },
];

export default function Home() {
  return (
    <SiteFrame>
      <section className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-emerald-700">
            Document command center
          </p>
          <h1 className="mt-4 font-display text-4xl text-slate-900 sm:text-5xl">
            View, search, and share documents without friction.
          </h1>
          <p className="mt-4 max-w-xl text-sm text-slate-600">
            EasyDocs handles PDFs, HTML, Markdown, Jupyter notebooks (.ipynb),
            and text. Jump to a start page, build embed links, and keep a local
            library of your recent work.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/open"
              className="rounded-full bg-emerald-600 px-6 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white transition hover:bg-emerald-700"
            >
              Open a document
            </Link>
            <Link
              href="/embed-builder"
              className="rounded-full border border-black/10 bg-white px-6 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-slate-600 transition hover:border-emerald-200 hover:text-emerald-700"
            >
              Build an embed
            </Link>
          </div>
          <div className="mt-8">
            <QuickOpen />
          </div>
          <div className="mt-8 rounded-3xl border border-black/5 bg-white/80 p-6 text-xs text-slate-500">
            Start page parameters now work across every format. Use
            <code className="mx-2 rounded bg-emerald-50 px-2 py-1 font-mono text-emerald-700">
              ?page=3
            </code>
            to jump in immediately.
          </div>
        </div>

        <div className="grid gap-4">
          {ROUTES.map((route) => {
            const Icon = route.Icon;
            return (
              <Link
                key={route.href}
                href={route.href}
                className="group rounded-3xl border border-black/5 bg-white/90 p-5 shadow-sm transition hover:-translate-y-1 hover:border-emerald-200 hover:shadow-md"
              >
                <div className="flex items-center justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-600 text-white">
                    <Icon className="h-6 w-6" />
                  </div>
                  <span className="text-[10px] font-semibold uppercase tracking-[0.35em] text-slate-400">
                    {route.href}
                  </span>
                </div>
                <h3 className="mt-4 font-display text-lg text-slate-900">
                  {route.label}
                </h3>
                <p className="mt-2 text-xs text-slate-500">
                  {route.description}
                </p>
              </Link>
            );
          })}
        </div>
      </section>
    </SiteFrame>
  );
}
