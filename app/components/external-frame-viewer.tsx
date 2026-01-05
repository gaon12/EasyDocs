"use client";

import { ViewerErrorState } from "./viewer-error";

type ExternalFrameViewerProps = {
  url?: string;
  title?: string;
  className?: string;
  showFooter?: boolean;
};

export function ExternalFrameViewer({
  url,
  title = "External content",
  className,
  showFooter = true,
}: ExternalFrameViewerProps) {
  if (!url) {
    return (
      <div className={className}>
        <ViewerErrorState
          title="Missing content"
          description="No external URL was provided for this viewer."
          action={{ label: "Back to open", href: "/open" }}
        />
      </div>
    );
  }

  return (
    <div className={`flex h-full w-full flex-col bg-white ${className ?? ""}`}>
      <iframe
        src={url}
        title={title}
        className="h-full w-full flex-1 border-0"
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
        referrerPolicy="no-referrer"
      />
      {showFooter ? (
        <div className="border-t border-black/5 bg-white px-4 py-2 text-xs text-slate-500">
          Having trouble viewing the page?{" "}
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className="font-semibold text-emerald-700 hover:underline"
          >
            Open in a new tab
          </a>
          .
        </div>
      ) : null}
    </div>
  );
}
