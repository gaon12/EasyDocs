"use client";

import { useEffect } from "react";
import {
  addRecentDoc,
  buildRecentDocId,
  type RecentDocKind,
  type RecentDocTag,
} from "../lib/recent-docs";

type ViewerHistoryTrackerProps = {
  label: string;
  kind: RecentDocKind;
  sourceUrl?: string;
  fileKey?: string;
  tag?: RecentDocTag;
};

export function ViewerHistoryTracker({
  label,
  kind,
  sourceUrl,
  fileKey,
  tag,
}: ViewerHistoryTrackerProps) {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!label) return;
    if (kind === "local" && !fileKey) return;
    const href = `${window.location.pathname}${window.location.search}`;
    const id = buildRecentDocId({ kind, sourceUrl, fileKey, tag, href });
    addRecentDoc({
      id,
      kind,
      label,
      href,
      sourceUrl,
      fileKey,
      tag,
    });
  }, [label, kind, sourceUrl, fileKey, tag]);

  return null;
}
