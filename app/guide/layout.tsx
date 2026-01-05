import { DocSidebar, type DocSection } from "../components/doc-sidebar";

const DOC_SECTIONS: DocSection[] = [
  {
    title: "Getting Started",
    items: [
      { title: "Introduction", href: "/guide" },
      { title: "Quick Start", href: "/guide/quick-start" },
      { title: "Usage Guide", href: "/guide/usage" },
    ],
  },
  {
    title: "Features",
    items: [
      { title: "Embedding", href: "/guide/embedding" },
      { title: "Download & Export", href: "/guide/download" },
      { title: "Keyboard Shortcuts", href: "/guide/shortcuts" },
    ],
  },
  {
    title: "Development",
    items: [
      { title: "Architecture", href: "/guide/architecture" },
      { title: "Contributing", href: "/guide/contributing" },
      { title: "API Reference", href: "/guide/api", badge: "Advanced" },
    ],
  },
];

export default function GuideLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/30">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <a
              href="/"
              className="flex items-center gap-2.5 transition hover:opacity-80"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-xs font-semibold text-white">
                ED
              </div>
              <div>
                <p className="font-display text-lg text-slate-900">EasyDocs</p>
                <p className="text-[10px] uppercase tracking-[0.3em] text-slate-500">
                  Documentation
                </p>
              </div>
            </a>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-[250px_1fr]">
          <aside className="hidden lg:block">
            <DocSidebar sections={DOC_SECTIONS} />
          </aside>

          <main className="min-w-0">
            <div className="rounded-2xl border border-black/5 bg-white/90 p-8 shadow-sm backdrop-blur-sm lg:p-12">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
