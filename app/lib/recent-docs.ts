"use client";

export type RecentDocKind = "remote" | "local" | "tagged";

export type RecentDocTag = {
  service: string;
  label: string;
  id: string;
};

export type RecentDoc = {
  id: string;
  kind: RecentDocKind;
  label: string;
  href: string;
  sourceUrl?: string;
  fileKey?: string;
  tag?: RecentDocTag;
  openedAt: number;
  pinned: boolean;
};

const STORAGE_KEY = "easydocs:recent-docs";
const EVENT_NAME = "easydocs:recent-docs";
const MAX_ITEMS = 30;

const dispatchChange = () => {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(EVENT_NAME));
};

const safeParse = (value: string | null): unknown => {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

const normalizeDocs = (value: unknown): RecentDoc[] => {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item) => item && typeof item === "object")
    .map((item) => {
      const record = item as Partial<RecentDoc>;
      if (!record.id || !record.label || !record.href || !record.kind) {
        return null;
      }
      return {
        id: String(record.id),
        kind: record.kind,
        label: String(record.label),
        href: String(record.href),
        sourceUrl: record.sourceUrl ? String(record.sourceUrl) : undefined,
        fileKey: record.fileKey ? String(record.fileKey) : undefined,
        tag: record.tag
          ? {
              service: String(record.tag.service),
              label: String(record.tag.label),
              id: String(record.tag.id),
            }
          : undefined,
        openedAt: Number.isFinite(record.openedAt)
          ? Number(record.openedAt)
          : 0,
        pinned: Boolean(record.pinned),
      } as RecentDoc;
    })
    .filter((item): item is RecentDoc => Boolean(item));
};

const sortDocs = (docs: RecentDoc[]) =>
  [...docs].sort((a, b) => {
    if (a.pinned !== b.pinned) {
      return a.pinned ? -1 : 1;
    }
    return b.openedAt - a.openedAt;
  });

const trimDocs = (docs: RecentDoc[]) => {
  const pinned = docs.filter((doc) => doc.pinned);
  const unpinned = docs.filter((doc) => !doc.pinned);
  const remaining = Math.max(MAX_ITEMS - pinned.length, 0);
  return [...pinned, ...unpinned.slice(0, remaining)];
};

const saveDocs = (docs: RecentDoc[]) => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(docs));
    dispatchChange();
  } catch {
    // Ignore storage failures.
  }
};

const loadDocs = (): RecentDoc[] => {
  if (typeof window === "undefined") return [];
  const parsed = safeParse(localStorage.getItem(STORAGE_KEY));
  return sortDocs(normalizeDocs(parsed));
};

export const buildRecentDocId = (doc: {
  kind: RecentDocKind;
  sourceUrl?: string;
  fileKey?: string;
  tag?: RecentDocTag;
  href?: string;
}) => {
  if (doc.kind === "local" && doc.fileKey) {
    return `local:${doc.fileKey}`;
  }
  if (doc.kind === "tagged" && doc.tag) {
    return `tagged:${doc.tag.service}:${doc.tag.id}`;
  }
  if (doc.sourceUrl) {
    return `remote:${doc.sourceUrl}`;
  }
  return `url:${doc.href ?? "unknown"}`;
};

export const getRecentDocs = () => loadDocs();

export const addRecentDoc = (
  doc: Omit<RecentDoc, "openedAt" | "pinned" | "id"> & {
    id?: string;
    openedAt?: number;
    pinned?: boolean;
  },
) => {
  if (typeof window === "undefined") return;
  const now = Date.now();
  const id = doc.id ?? buildRecentDocId(doc);
  const existing = loadDocs();
  const next = existing.filter((item) => item.id !== id);
  const previous = existing.find((item) => item.id === id);
  const entry: RecentDoc = {
    id,
    kind: doc.kind,
    label: doc.label,
    href: doc.href,
    sourceUrl: doc.sourceUrl,
    fileKey: doc.fileKey,
    tag: doc.tag,
    openedAt: doc.openedAt ?? now,
    pinned: previous?.pinned ?? doc.pinned ?? false,
  };
  const merged = trimDocs(sortDocs([entry, ...next]));
  saveDocs(merged);
};

export const togglePinned = (id: string) => {
  const docs = loadDocs();
  const next = docs.map((doc) =>
    doc.id === id ? { ...doc, pinned: !doc.pinned } : doc,
  );
  saveDocs(sortDocs(next));
};

export const removeRecentDoc = (id: string) => {
  const docs = loadDocs();
  saveDocs(docs.filter((doc) => doc.id !== id));
};

export const clearRecentHistory = () => {
  const docs = loadDocs();
  saveDocs(docs.filter((doc) => doc.pinned));
};

export const subscribeToRecentDocs = (handler: () => void) => {
  if (typeof window === "undefined") return () => {};
  const handleStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY) handler();
  };
  window.addEventListener(EVENT_NAME, handler);
  window.addEventListener("storage", handleStorage);
  return () => {
    window.removeEventListener(EVENT_NAME, handler);
    window.removeEventListener("storage", handleStorage);
  };
};
