"use client";

import { useState } from "react";
import { X, Copy, Check, Info } from "lucide-react";
import { getThemeClasses, MODAL_OVERLAY_CLASS } from "@/app/lib/ui-utils";
import { toast } from "@/app/lib/toast";

type EmbedModalProps = {
  isOpen: boolean;
  onClose: () => void;
  isDark: boolean;
  documentLabel: string;
  embedTarget: string;
  embedUrl: string;
};

/**
 * Modal for copying embed code and URL
 */
export function EmbedModal({
  isOpen,
  onClose,
  isDark,
  documentLabel,
  embedTarget,
  embedUrl,
}: EmbedModalProps) {
  const [isCopying, setIsCopying] = useState(false);

  if (!isOpen) return null;

  const classes = getThemeClasses(isDark);

  const embedTitle = documentLabel
    ? `${documentLabel.replace(/"/g, "&quot;")} - EasyDocs`
    : "Document Viewer - EasyDocs";

  const embedSnippet = embedTarget
    ? `<iframe src="${embedUrl || embedTarget}" style="width: 100%; height: 600px; border: 0;" loading="lazy" title="${embedTitle}" referrerpolicy="no-referrer-when-downgrade"></iframe>`
    : "";

  const handleCopy = async () => {
    setIsCopying(true);
    try {
      await navigator.clipboard.writeText(embedSnippet);
      toast.success("Embed code copied to clipboard!");
    } catch (error) {
      toast.error("Failed to copy to clipboard");
      console.error("Copy failed:", error);
    } finally {
      setIsCopying(false);
    }
  };

  return (
    <div className={MODAL_OVERLAY_CLASS} onClick={onClose}>
      <div
        className={`w-full max-w-2xl rounded-2xl border p-6 shadow-2xl ${classes.panel}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className={`text-lg font-semibold ${classes.text}`}>
              Embed Code
            </h3>
            <p className={`mt-1 text-sm ${classes.mutedText}`}>
              Copy and paste this code into your website
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
          <div
            className={`rounded-xl border p-4 ${
              isDark ? "border-amber-400/40 bg-amber-500/10" : "border-amber-200 bg-amber-50"
            }`}
          >
            <div className="flex items-start gap-2">
              <Info className="h-5 w-5 flex-shrink-0" />
              <div className={`text-xs ${isDark ? "text-amber-100" : "text-amber-900"}`}>
                <p className="font-semibold">Note:</p>
                <p className="mt-1">
                  Only public URLs can be embedded. Local files cannot be
                  embedded as they don&apos;t have a public URL.
                </p>
              </div>
            </div>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className={`text-xs font-semibold uppercase tracking-wider ${classes.mutedText}`}>
                Iframe Code
              </label>
              <button
                onClick={handleCopy}
                disabled={isCopying}
                className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
              >
                {isCopying ? (
                  <>
                    <Check className="h-3.5 w-3.5" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    Copy
                  </>
                )}
              </button>
            </div>
            <pre className="overflow-x-auto rounded-xl bg-slate-900 p-4 text-xs text-slate-100">
              {embedSnippet}
            </pre>
          </div>

          <div className={`rounded-xl border p-4 ${classes.card}`}>
            <p className={`text-xs ${classes.mutedText}`}>
              <span className="font-semibold">Embed URL:</span>
              <br />
              <code
                className={`mt-1 inline-block rounded px-2 py-1 font-mono text-[11px] ${
                  isDark ? "bg-white/10 text-emerald-400" : "bg-white text-emerald-700"
                }`}
              >
                {embedUrl || embedTarget}
              </code>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
