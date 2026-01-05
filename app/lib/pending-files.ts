"use client";

import type { FileType } from "./file-type";

export type PendingFileEntry = {
  key: string;
  name: string;
  size: number;
  type: FileType;
};

const STORAGE_KEY = "easydocs:pending-files";
const EVENT_NAME = "easydocs:pending-files";
let pending: PendingFileEntry[] = [];

const normalizeEntry = (value: unknown): PendingFileEntry | null => {
  if (!value || typeof value !== "object") return null;
  const record = value as Partial<PendingFileEntry>;
  if (
    typeof record.key !== "string" ||
    typeof record.name !== "string" ||
    typeof record.size !== "number" ||
    typeof record.type !== "string"
  ) {
    return null;
  }
  return {
    key: record.key,
    name: record.name,
    size: record.size,
    type: record.type as FileType,
  };
};

const dedupeEntries = (entries: PendingFileEntry[]) => {
  const seen = new Set<string>();
  return entries.filter((entry) => {
    if (!entry.key || seen.has(entry.key)) return false;
    seen.add(entry.key);
    return true;
  });
};

const readStorage = (): PendingFileEntry[] => {
  if (typeof sessionStorage === "undefined") return [];
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((item) => normalizeEntry(item))
      .filter((item): item is PendingFileEntry => Boolean(item));
  } catch {
    return [];
  }
};

const writeStorage = (entries: PendingFileEntry[]) => {
  if (typeof sessionStorage === "undefined") return;
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {
    // Ignore storage failures.
  }
};

const dispatchChange = () => {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(EVENT_NAME));
};

export const addPendingFiles = (entries: PendingFileEntry[]) => {
  if (!entries.length) return;
  pending = dedupeEntries([...pending, ...entries]);
  writeStorage(pending);
  dispatchChange();
};

export const consumePendingFiles = (): PendingFileEntry[] => {
  const stored = readStorage();
  const combined = dedupeEntries([...pending, ...stored]);
  pending = [];
  writeStorage([]);
  return combined;
};

export const subscribeToPendingFiles = (handler: () => void) => {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(EVENT_NAME, handler);
  return () => {
    window.removeEventListener(EVENT_NAME, handler);
  };
};
