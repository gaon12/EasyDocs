import Link from "next/link";
import { PdfViewerClient } from "../../components/pdf-viewer";
import { HtmlViewer } from "../../components/html-viewer";
import { MarkdownViewer } from "../../components/markdown-viewer";
import { NotebookViewer } from "../../components/notebook-viewer";
import { TextViewer } from "../../components/text-viewer";
import { HitomiViewer } from "../../components/hitomi-viewer";
import {
  encodePdfSrcForPath,
  extractPageFromFragment,
  resolvePageFromSearchParams,
  resolvePdfName,
  resolvePdfSrcFromPath,
} from "../../lib/pdf";
import { getFileType, resolveRemoteFileType, type FileType } from "../../lib/file-type";
import {
  getTaggedServiceLabel,
  resolveTaggedDocument,
} from "../../lib/tagged-services";
import { ViewerHeader } from "./viewer-header";
import { ViewerHistoryTracker } from "../../components/viewer-history-tracker";

export const dynamic = "force-dynamic";

type ViewerPageProps = {
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

type ViewerContentType = FileType | "hitomi";

const getDocumentLabel = (src: string, name: string, isLocal: boolean) => {
  if (name) return name;
  if (isLocal) return "Local Document";
  if (src.startsWith("blob:")) return "Local Document";
  const lastSegment = src.split("/").pop() ?? "";
  const clean = lastSegment.split("?")[0];
  if (!clean) return "Document";
  try {
    return decodeURIComponent(clean);
  } catch {
    return clean;
  }
};

export default async function ViewerPage({
  params,
  searchParams,
}: ViewerPageProps) {
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
  const isLocalFile = docSegments[0] === "local" && Boolean(docSegments[1]);
  const localFileKey = isLocalFile ? docSegments[1] : "";
  const src = isLocalFile
    ? ""
    : isTaggedHitomi
      ? ""
      : taggedDocument
        ? taggedDocument.contentUrl
        : resolvePdfSrcFromPath(resolvedParams?.doc, { allowBlob: true });
  const name = resolvePdfName(resolvedSearchParams?.name);
  const pageFromQuery = resolvePageFromSearchParams(resolvedSearchParams);
  const { src: cleanedSrc, page: pageFromFragment } = extractPageFromFragment(src);
  const page = pageFromQuery ?? pageFromFragment;

  if (!src && !isLocalFile && !taggedDocument) {
    return (
      <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
        <header className="border-b border-black/5">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
            <Link href="/" className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-600 text-sm font-semibold text-white">
                ED
              </div>
              <div>
                <p className="font-display text-lg text-slate-900">EasyDocs</p>
                <p className="text-xs uppercase tracking-[0.32em] text-slate-400">
                  Viewer
                </p>
              </div>
            </Link>
          </div>
        </header>
        <main className="mx-auto flex max-w-6xl flex-col items-center justify-center px-6 py-16">
          <div className="rounded-3xl border border-black/5 bg-white/80 p-10 text-center shadow-sm">
            <h1 className="font-display text-2xl text-slate-900">
              No document selected.
            </h1>
            <p className="mt-3 text-sm text-slate-500">
              Choose a document URL or upload a file on the open page.
            </p>
            <Link
              href="/open"
              className="mt-6 inline-flex rounded-full bg-emerald-600 px-5 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white transition hover:bg-emerald-700"
            >
              Back to open
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const encodedDoc = encodePdfSrcForPath(cleanedSrc);
  const pageQuery = page ? `?page=${page}` : "";
  const taggedPath = docSegments.length
    ? docSegments.map((segment) => encodeURIComponent(segment)).join("/")
    : "";
  const embedTarget = isLocalFile || cleanedSrc.startsWith("blob:")
    ? ""
    : taggedDocument
      ? `/embed/${taggedPath}${pageQuery}`
      : `/embed/${encodedDoc}${pageQuery}`;
  const fallbackLabel = getDocumentLabel(cleanedSrc, "", isLocalFile);
  const documentLabel = taggedDocument?.title || name || fallbackLabel;
  const historyKind = isLocalFile || cleanedSrc.startsWith("blob:")
    ? "local"
    : taggedDocument
      ? "tagged"
      : "remote";
  const historySourceUrl =
    taggedDocument?.sourceUrl ?? (historyKind === "remote" ? cleanedSrc : undefined);
  const historyTag = taggedDocument
    ? {
        service: taggedDocument.service,
        label: getTaggedServiceLabel(taggedDocument.service),
        id: taggedDocument.id,
      }
    : undefined;

  // Determine file type
  let fileType: ViewerContentType = isTaggedHitomi
    ? "hitomi"
    : isTaggedArxiv
      ? "pdf"
    : getFileType(name || cleanedSrc || "unknown.pdf");
  if (
    fileType === "unknown" &&
    (cleanedSrc.startsWith("http://") || cleanedSrc.startsWith("https://"))
  ) {
    fileType = await resolveRemoteFileType(cleanedSrc);
  }

  return (
    <div className="flex h-screen flex-col bg-[var(--background)] text-[var(--foreground)]">
      <ViewerHistoryTracker
        label={documentLabel}
        kind={historyKind}
        sourceUrl={historySourceUrl}
        fileKey={isLocalFile ? localFileKey : undefined}
        tag={historyTag}
      />
      <ViewerHeader
        documentLabel={documentLabel}
        sourceUrl={
          taggedDocument?.sourceUrl ??
            (cleanedSrc.startsWith("http://") || cleanedSrc.startsWith("https://")
              ? cleanedSrc
              : undefined)
        }
        isLocalFile={isLocalFile}
        isBlob={cleanedSrc.startsWith("blob:")}
        embedTarget={embedTarget}
        fileType={fileType}
        tagInfo={
          taggedDocument
            ? {
                serviceLabel: getTaggedServiceLabel(taggedDocument.service),
                id: taggedDocument.id,
                meta: taggedDocument.meta,
              }
            : undefined
        }
      />

      <main className="flex-1 overflow-hidden bg-slate-50/50 p-3 md:p-6">
        <div className="h-full rounded-2xl border border-black/5 bg-white shadow-lg">
          {fileType === 'pdf' && (
            <PdfViewerClient
              src={cleanedSrc}
              fileKey={localFileKey}
              page={page}
              className="h-full w-full overflow-hidden rounded-2xl"
              theme="system"
            />
          )}
          {fileType === 'html' && (
            <HtmlViewer
              url={cleanedSrc || undefined}
              fileKey={localFileKey || undefined}
              page={page}
              showHomeLink
              showToolbar
              documentLabel={documentLabel}
              theme="system"
            />
          )}
          {fileType === 'markdown' && (
            <MarkdownViewer
              url={cleanedSrc || undefined}
              fileKey={localFileKey || undefined}
              page={page}
              showHomeLink
              showToolbar
              documentLabel={documentLabel}
              theme="system"
            />
          )}
          {fileType === "ipynb" && (
            <NotebookViewer
              url={cleanedSrc || undefined}
              fileKey={localFileKey || undefined}
              page={page}
              showHomeLink
              showToolbar
              documentLabel={documentLabel}
              theme="system"
            />
          )}
          {fileType === 'text' && (
            <TextViewer
              url={cleanedSrc || undefined}
              fileKey={localFileKey || undefined}
              page={page}
              showHomeLink
              showToolbar
              documentLabel={documentLabel}
              theme="system"
            />
          )}
          {fileType === "hitomi" && taggedDocument ? (
            <HitomiViewer
              galleryId={taggedDocument.id}
              documentLabel={documentLabel}
              showHomeLink
              page={page}
              className="h-full w-full overflow-hidden rounded-2xl"
              theme="system"
            />
          ) : null}
          {fileType === 'unknown' && (
            <div className="flex h-full items-center justify-center">
              <div className="text-center">
                <h2 className="text-xl font-semibold text-slate-900">Unsupported file type</h2>
                <p className="mt-2 text-sm text-slate-500">
                  Please upload a PDF, HTML, Markdown, Jupyter Notebook, or Text file.
                </p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
