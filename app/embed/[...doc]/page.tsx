import { Metadata } from "next";
import { PdfViewerFrame } from "../../components/pdf-viewer";
import { HtmlViewer } from "../../components/html-viewer";
import { MarkdownViewer } from "../../components/markdown-viewer";
import { NotebookViewer } from "../../components/notebook-viewer";
import { TextViewer } from "../../components/text-viewer";
import { HitomiViewer } from "../../components/hitomi-viewer";
import { EmbedHeader } from "../../components/embed-header";
import {
  extractPageFromFragment,
  resolvePageFromSearchParams,
  resolvePdfSrcFromPath,
} from "../../lib/pdf";
import { getFileType, resolveRemoteFileType, type FileType } from "../../lib/file-type";
import { resolveTaggedDocument } from "../../lib/tagged-services";
import { resolveProxyUrl } from "../../lib/proxy";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params, searchParams }: EmbedPageProps): Promise<Metadata> {
  const resolvedParams = await Promise.resolve(params);
  const docSegments = Array.isArray(resolvedParams?.doc)
    ? resolvedParams?.doc
    : resolvedParams?.doc
      ? [resolvedParams.doc]
      : [];

  const taggedDocument = await resolveTaggedDocument(docSegments);
  const src = taggedDocument
    ? taggedDocument.contentUrl
    : resolvePdfSrcFromPath(resolvedParams?.doc);

  const documentLabel = taggedDocument?.title ?? getDocumentLabel(src || "", "Document");

  return {
    title: `${documentLabel} - EasyDocs Embed`,
    description: `View ${documentLabel} on EasyDocs - Modern document viewer`,
  };
}

type EmbedPageProps = {
  params?: Promise<{
    doc?: string | string[];
  }> | {
    doc?: string | string[];
  };
  searchParams?: Promise<Record<string, string | string[] | undefined>> | Record<
    string,
    string | string[] | undefined
  >;
};

type EmbedContentType = FileType | "hitomi";

const resolveBooleanParam = (
  params: Record<string, string | string[] | undefined> | undefined,
  key: string,
  fallback: boolean,
) => {
  if (!params) return fallback;
  const raw = params[key];
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (!value) return fallback;
  return value === "1" || value === "true";
};

const resolveThemeParam = (
  params: Record<string, string | string[] | undefined> | undefined,
) => {
  const raw = params?.theme;
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (value === "light" || value === "dark" || value === "system") {
    return value;
  }
  return "light";
};

const getDocumentLabel = (src: string, fallback = "Document") => {
  const cleaned = src.split("#")[0]?.split("?")[0] ?? "";
  const lastSegment = cleaned.split("/").filter(Boolean).pop() ?? "";
  if (!lastSegment) return fallback;
  try {
    return decodeURIComponent(lastSegment);
  } catch {
    return lastSegment;
  }
};

export default async function EmbedPage({ params, searchParams }: EmbedPageProps) {
  const resolvedParams = await Promise.resolve(params);
  const resolvedSearchParams = await Promise.resolve(searchParams);
  const docSegments = Array.isArray(resolvedParams?.doc)
    ? resolvedParams?.doc
    : resolvedParams?.doc
      ? [resolvedParams.doc]
      : [];
  const taggedDocument = await resolveTaggedDocument(docSegments);
  const isTaggedHitomi = taggedDocument?.kind === "hitomi";
  const isTaggedArxiv = taggedDocument?.service === "arxiv";
  const src = isTaggedHitomi
    ? ""
    : taggedDocument
      ? taggedDocument.contentUrl
      : resolvePdfSrcFromPath(resolvedParams?.doc);
  const pageFromQuery = resolvePageFromSearchParams(resolvedSearchParams);
  const { src: cleanedSrc, page: pageFromFragment } = extractPageFromFragment(src);
  const page = pageFromQuery ?? pageFromFragment;
  const showToolbar = resolveBooleanParam(resolvedSearchParams, "toolbar", false);
  const showHeader = resolveBooleanParam(resolvedSearchParams, "header", false);
  const theme = resolveThemeParam(resolvedSearchParams);

  if (!src && !taggedDocument) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-950 text-xs text-slate-300">
        Missing or invalid document source. Use /embed/&lt;document&gt;.
      </div>
    );
  }

  let fileType: EmbedContentType = isTaggedHitomi
    ? "hitomi"
    : isTaggedArxiv
      ? "pdf"
    : getFileType(cleanedSrc);
  if (
    fileType === "unknown" &&
    (cleanedSrc.startsWith("http://") || cleanedSrc.startsWith("https://"))
  ) {
    fileType = await resolveRemoteFileType(cleanedSrc);
  }

  const pageQuery = page ? `?page=${page}` : "";
  const taggedPath = docSegments.length
    ? docSegments.map((segment) => encodeURIComponent(segment)).join("/")
    : "";
  const viewerUrl = taggedDocument
    ? `/viewer/${taggedPath}${pageQuery}`
    : `/viewer/${encodeURIComponent(cleanedSrc)}${pageQuery}`;
  const documentLabel =
    taggedDocument?.title ?? getDocumentLabel(cleanedSrc || "", "Document");
  const proxiedSrc = resolveProxyUrl(cleanedSrc || "", true);
  const themeClasses =
    theme === "dark" ? "bg-slate-950 text-slate-100" : "bg-white text-slate-900";
  return (
    <div className={`flex h-screen w-screen flex-col ${themeClasses}`}>
      {showHeader ? (
        <EmbedHeader
          documentLabel={documentLabel}
          viewerUrl={viewerUrl}
          theme={theme}
        />
      ) : null}
      <div className="flex-1">
        {fileType === "pdf" && (
          <PdfViewerFrame
            src={proxiedSrc}
            page={page}
            showToolbar={showToolbar}
            theme={theme}
            className="h-full w-full overflow-hidden"
          />
        )}
        {fileType === "html" && (
          <HtmlViewer
            url={cleanedSrc}
            page={page}
            showToolbar={showToolbar}
            documentLabel={documentLabel}
            theme={theme}
            useProxy
          />
        )}
        {fileType === "markdown" && (
          <MarkdownViewer
            url={cleanedSrc}
            page={page}
            showToolbar={showToolbar}
            documentLabel={documentLabel}
            theme={theme}
            useProxy
          />
        )}
        {fileType === "ipynb" && (
          <NotebookViewer
            url={cleanedSrc}
            page={page}
            showToolbar={showToolbar}
            documentLabel={documentLabel}
            theme={theme}
            useProxy
          />
        )}
        {fileType === "text" && (
          <TextViewer
            url={cleanedSrc}
            page={page}
            showToolbar={showToolbar}
            documentLabel={documentLabel}
            theme={theme}
            useProxy
          />
        )}
        {fileType === "hitomi" && taggedDocument ? (
          <HitomiViewer
            galleryId={taggedDocument.id}
            documentLabel={taggedDocument.title}
            page={page}
            className="h-full w-full"
            theme={theme}
          />
        ) : null}
        {fileType === "unknown" && (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-slate-900">
                Unsupported file type
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                Please use a PDF, HTML, Markdown, Jupyter Notebook, or Text file.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
