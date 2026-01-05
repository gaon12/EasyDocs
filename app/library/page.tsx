import { SiteFrame } from "../components/site-frame";
import { RecentDocsPanel } from "../components/recent-docs";

export default function LibraryPage() {
  return (
    <SiteFrame>
      <div className="space-y-8">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-700">
            Local library
          </p>
          <h1 className="mt-3 font-display text-3xl text-slate-900">
            Recent and pinned docs
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            History is stored locally in this browser. Pin the ones you revisit
            often.
          </p>
        </div>
        <RecentDocsPanel />
      </div>
    </SiteFrame>
  );
}
