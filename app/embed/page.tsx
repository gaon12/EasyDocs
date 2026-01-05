import { redirect } from "next/navigation";
import {
  encodePdfSrcForPath,
  extractPageFromFragment,
  resolvePageFromSearchParams,
  resolvePdfSrcFromSearchParams,
} from "../lib/pdf";

export const dynamic = "force-dynamic";

type EmbedPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>> | Record<
    string,
    string | string[] | undefined
  >;
};

export default async function EmbedPage({ searchParams }: EmbedPageProps) {
  const resolvedSearchParams = await Promise.resolve(searchParams);
  const src = resolvePdfSrcFromSearchParams(resolvedSearchParams);
  if (!src) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-950 text-xs text-slate-300">
        Missing or invalid document source. Use ?src=https://... or ?url=https://...
      </div>
    );
  }

  const pageFromQuery = resolvePageFromSearchParams(resolvedSearchParams);
  const { src: cleanedSrc, page: pageFromFragment } = extractPageFromFragment(src);
  const page = pageFromQuery ?? pageFromFragment;
  const encodedDoc = encodePdfSrcForPath(cleanedSrc);
  const params = new URLSearchParams();
  if (page) {
    params.set("page", String(page));
  }
  const passthroughKeys = ["toolbar", "header", "theme"];
  passthroughKeys.forEach((key) => {
    const value = resolvedSearchParams?.[key];
    const resolvedValue = Array.isArray(value) ? value[0] : value;
    if (resolvedValue) {
      params.set(key, resolvedValue);
    }
  });
  const query = params.toString();
  redirect(`/embed/${encodedDoc}${query ? `?${query}` : ""}`);
}
