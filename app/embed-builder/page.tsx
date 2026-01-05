import { SiteFrame } from "../components/site-frame";
import { EmbedBuilderPanel } from "../components/embed-builder-panel";

export default function EmbedBuilderPage() {
  return (
    <SiteFrame>
      <div className="space-y-8">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-700">
            Embed builder
          </p>
          <h1 className="mt-3 font-display text-3xl text-slate-900">
            Customize embeds
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Toggle toolbar and header, pick a theme, and set the start page.
          </p>
        </div>
        <EmbedBuilderPanel />
      </div>
    </SiteFrame>
  );
}
