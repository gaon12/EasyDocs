import { redirect } from "next/navigation";
import {
  encodePdfSrcForPath,
  extractPageFromFragment,
  resolvePageFromSearchParams,
  resolvePdfName,
  resolvePdfSrcFromSearchParams,
} from "../lib/pdf";

export const dynamic = "force-dynamic";

type ViewerCompatPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>> | Record<
    string,
    string | string[] | undefined
  >;
};

export default async function ViewerCompatPage({
  searchParams,
}: ViewerCompatPageProps) {
  const resolvedSearchParams = await Promise.resolve(searchParams);
  const src = resolvePdfSrcFromSearchParams(resolvedSearchParams, {
    allowBlob: true,
  });
  if (!src) {
    redirect("/open");
  }

  const pageFromQuery = resolvePageFromSearchParams(resolvedSearchParams);
  const { src: cleanedSrc, page: pageFromFragment } = extractPageFromFragment(src);
  const page = pageFromQuery ?? pageFromFragment;
  const name = resolvePdfName(resolvedSearchParams?.name);
  const encodedDoc = encodePdfSrcForPath(cleanedSrc);
  const params = new URLSearchParams();
  if (page) {
    params.set("page", String(page));
  }
  if (name) {
    params.set("name", name);
  }
  const pageQuery = params.toString();

  const embeddedParam =
    resolvedSearchParams?.embedded ?? resolvedSearchParams?.embed;
  const embeddedValue = Array.isArray(embeddedParam)
    ? embeddedParam[0]
    : embeddedParam;
  const embedded = embeddedValue === "true" || embeddedValue === "1";

  const targetBase = embedded ? "/embed" : "/viewer";
  redirect(`${targetBase}/${encodedDoc}${pageQuery ? `?${pageQuery}` : ""}`);
}
