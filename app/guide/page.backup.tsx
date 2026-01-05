import Link from "next/link";
import { SiteFrame } from "../components/site-frame";

const GUIDE_SECTIONS = [
  {
    title: "Open a document",
    body:
      "Use /open to upload files or paste a URL. Supported formats include PDF, HTML, Markdown, Jupyter notebooks (.ipynb), and text.",
    code: "/open",
  },
  {
    title: "Viewer routes",
    body:
      "Direct links live under /viewer. You can pass a URL-encoded document path or a tagged shortcut.",
    code: "/viewer/https%3A%2F%2Fexample.com%2Ffile.pdf",
  },
  {
    title: "Start page",
    body:
      "Jump to a page for any format with the page parameter. Non-PDF formats use screen-length steps.",
    code: "/viewer/<document>?page=3",
  },
  {
    title: "Embed viewer",
    body:
      "Use /embed for sharing. Options include toolbar, header, and theme.",
    code: "/embed/<document>?page=2&toolbar=1&header=1&theme=dark",
  },
];

export default function GuidePage() {
  return (
    <SiteFrame>
      <div className="space-y-8">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-700">
            Usage guide
          </p>
          <h1 className="mt-3 font-display text-3xl text-slate-900">
            Routes and parameters
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Quick references for opening, embedding, and jumping to a start page.
          </p>
        </div>

        <section className="grid gap-4 lg:grid-cols-2">
          {GUIDE_SECTIONS.map((section) => (
            <div
              key={section.title}
              className="rounded-3xl border border-black/5 bg-white/90 p-6 shadow-sm"
            >
              <h2 className="font-display text-xl text-slate-900">
                {section.title}
              </h2>
              <p className="mt-2 text-sm text-slate-500">{section.body}</p>
              <code className="mt-4 inline-flex rounded-full bg-emerald-50 px-4 py-2 text-xs text-emerald-700">
                {section.code}
              </code>
            </div>
          ))}
        </section>

        <section className="rounded-3xl border border-black/5 bg-white/90 p-6 shadow-sm">
          <h2 className="font-display text-xl text-slate-900">
            Helpful shortcuts
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            For tagged sources, use shortcuts like <code>arxiv:2301.12345</code>{" "}
            or <code>hitomi:123456</code>. They resolve automatically in the viewer.
          </p>
          <div className="mt-4 flex flex-wrap gap-3 text-xs text-slate-500">
            <span className="rounded-full border border-black/10 bg-white px-4 py-2">
              /viewer/arxiv:2301.12345
            </span>
            <span className="rounded-full border border-black/10 bg-white px-4 py-2">
              /viewer/hitomi:123456
            </span>
            <span className="rounded-full border border-black/10 bg-white px-4 py-2">
              /embed/arxiv:2301.12345?theme=dark
            </span>
          </div>
        </section>

        <section className="rounded-3xl border border-black/5 bg-white/90 p-6 text-sm text-slate-500 shadow-sm">
          <p>
            Need to open something quickly? Head to{" "}
            <Link href="/open" className="font-semibold text-emerald-700">
              /open
            </Link>{" "}
            or build embeds in{" "}
            <Link
              href="/embed-builder"
              className="font-semibold text-emerald-700"
            >
              /embed-builder
            </Link>
            .
          </p>
        </section>
      </div>
    </SiteFrame>
  );
}
