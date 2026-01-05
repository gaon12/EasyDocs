"use client";

import { X } from "lucide-react";
import { getThemeClasses, formatMetaValue, MODAL_OVERLAY_CLASS } from "@/app/lib/ui-utils";

type InfoModalProps = {
  isOpen: boolean;
  onClose: () => void;
  isDark: boolean;
  tagInfo: {
    serviceLabel: string;
    id: string;
    meta: Array<{
      label: string;
      value: string | string[];
    }>;
  };
  sourceUrl?: string;
};

/**
 * Modal displaying tagged document metadata
 */
export function InfoModal({ isOpen, onClose, isDark, tagInfo, sourceUrl }: InfoModalProps) {
  if (!isOpen) return null;

  const classes = getThemeClasses(isDark);
  const tagMeta = tagInfo.meta ?? [];

  return (
    <div className={MODAL_OVERLAY_CLASS} onClick={onClose}>
      <div
        className={`w-full max-w-2xl rounded-2xl border p-6 shadow-2xl ${classes.panel}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className={`text-lg font-semibold ${classes.text}`}>
              Document info
            </h3>
            <p className={`mt-1 text-sm ${classes.mutedText}`}>
              Details for this tagged source
            </p>
          </div>
          <button
            onClick={onClose}
            className={`flex h-8 w-8 items-center justify-center rounded-lg transition ${classes.closeButton}`}
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div className={`rounded-xl border p-4 ${classes.card}`}>
            <div className={`text-[10px] font-semibold uppercase tracking-[0.3em] ${classes.mutedText}`}>
              Source
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-slate-900 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-white">
                {tagInfo.serviceLabel}
              </span>
              <span className={`font-mono text-xs ${classes.mutedText}`}>
                {tagInfo.id}
              </span>
            </div>
            {sourceUrl ? (
              <a
                href={sourceUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-2 block truncate text-xs text-emerald-500 hover:underline"
                title={sourceUrl}
              >
                {sourceUrl}
              </a>
            ) : null}
          </div>

          {tagMeta.length ? (
            <div className="grid gap-3">
              {tagMeta.map((item) => (
                <div
                  key={item.label}
                  className={`rounded-xl border px-4 py-3 ${isDark ? "border-white/10 bg-slate-900" : "border-black/5 bg-white"}`}
                >
                  <div className={`text-[10px] font-semibold uppercase tracking-[0.3em] ${classes.mutedText}`}>
                    {item.label}
                  </div>
                  <div className={`mt-1 text-sm ${isDark ? "text-slate-200" : "text-slate-700"}`}>
                    {formatMetaValue(item.value)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div
              className={`rounded-xl border border-dashed px-4 py-6 text-center text-xs ${
                isDark
                  ? "border-slate-700 bg-slate-900 text-slate-400"
                  : "border-slate-200 bg-slate-50 text-slate-400"
              }`}
            >
              No additional metadata available.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
