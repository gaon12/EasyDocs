"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { hasLocalFile } from "../lib/local-files";
import {
  clearRecentHistory,
  getRecentDocs,
  removeRecentDoc,
  subscribeToRecentDocs,
  togglePinned,
  type RecentDoc,
} from "../lib/recent-docs";

const describeDoc = (doc: RecentDoc) => {
  if (doc.kind === "local") return "Local file";
  if (doc.tag) return `${doc.tag.label} source`;
  if (doc.sourceUrl) return doc.sourceUrl;
  return "Remote document";
};

export function RecentDocsPanel() {
  const [docs, setDocs] = useState<RecentDoc[]>([]);
  const [availability, setAvailability] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const refresh = () => setDocs(getRecentDocs());
    refresh();
    return subscribeToRecentDocs(refresh);
  }, []);

  useEffect(() => {
    let active = true;
    const locals = docs.filter((doc) => doc.kind === "local" && doc.fileKey);
    if (!locals.length) {
      setAvailability({});
      return () => {
        active = false;
      };
    }

    Promise.all(
      locals.map(async (doc) => ({
        id: doc.id,
        available: doc.fileKey ? await hasLocalFile(doc.fileKey) : false,
      })),
    ).then((results) => {
      if (!active) return;
      const next: Record<string, boolean> = {};
      results.forEach((entry) => {
        next[entry.id] = entry.available;
      });
      setAvailability(next);
    });

    return () => {
      active = false;
    };
  }, [docs]);

  const pinned = useMemo(() => docs.filter((doc) => doc.pinned), [docs]);
  const recent = useMemo(() => docs.filter((doc) => !doc.pinned), [docs]);

  if (!docs.length) {
    return (
      <section className="rounded-3xl border border-black/5 bg-white/90 p-6 text-center shadow-sm">
        <h3 className="text-sm font-semibold text-slate-900">
          Recent documents
        </h3>
        <p className="mt-2 text-xs text-slate-500">
          Open a document to see it here.
        </p>
      </section>
    );
  }

  const renderList = (items: RecentDoc[]) => (
    <ul className="space-y-3">
      {items.map((doc) => {
        const isAvailable =
          doc.kind !== "local" ? true : availability[doc.id] !== false;
        const meta = describeDoc(doc);
        return (
          <li
            key={doc.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-black/5 bg-white px-4 py-3"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-900">
                {doc.label}
              </p>
              <p
                className="truncate text-xs text-slate-500"
                title={meta}
              >
                {meta}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => togglePinned(doc.id)}
                className="rounded-lg border border-black/10 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-600 transition hover:border-emerald-200 hover:text-emerald-700"
              >
                {doc.pinned ? "Unpin" : "Pin"}
              </button>
              {isAvailable ? (
                <Link
                  href={doc.href}
                  className="rounded-lg bg-emerald-600 px-2.5 py-1 text-[11px] font-semibold text-white transition hover:bg-emerald-700"
                >
                  Open
                </Link>
              ) : (
                <span className="rounded-lg border border-dashed border-slate-200 px-2.5 py-1 text-[11px] text-slate-400">
                  Missing
                </span>
              )}
              <button
                type="button"
                onClick={() => removeRecentDoc(doc.id)}
                className="rounded-lg border border-black/10 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-500 transition hover:border-rose-200 hover:text-rose-600"
              >
                Remove
              </button>
            </div>
          </li>
        );
      })}
    </ul>
  );

  return (
    <section className="rounded-3xl border border-black/5 bg-white/90 p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-900">
          Recent documents
        </h3>
        <button
          type="button"
          onClick={clearRecentHistory}
          className="text-[11px] font-semibold text-slate-400 transition hover:text-rose-500"
        >
          Clear history
        </button>
      </div>

      <div className="mt-4 space-y-6">
        <div className="space-y-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-slate-400">
            Pinned
          </p>
          {pinned.length ? (
            renderList(pinned)
          ) : (
            <p className="rounded-2xl border border-dashed border-slate-200 px-4 py-3 text-xs text-slate-400">
              Pin documents to keep them handy.
            </p>
          )}
        </div>

        <div className="space-y-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-slate-400">
            Recent
          </p>
          {recent.length ? (
            renderList(recent)
          ) : (
            <p className="rounded-2xl border border-dashed border-slate-200 px-4 py-3 text-xs text-slate-400">
              No recent documents yet.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
