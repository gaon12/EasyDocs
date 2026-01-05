import { SiteFrame } from "../components/site-frame";
import { PdfLanding } from "../components/pdf-landing";

export default function OpenPage() {
  return (
    <SiteFrame>
      <div className="space-y-8">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-700">
            Open documents
          </p>
          <h1 className="mt-3 font-display text-3xl text-slate-900">
            Bring in files or URLs
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Drag and drop local files, paste a link, or build a queue to open
            multiple documents.
          </p>
        </div>
        <PdfLanding />
      </div>
    </SiteFrame>
  );
}
