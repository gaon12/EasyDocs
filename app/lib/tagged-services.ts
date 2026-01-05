import type { HitomiGalleryInfo, HitomiPerson } from "./hitomi";
import { fetchHitomiGalleryInfo } from "./hitomi";

export type TaggedService = "arxiv" | "hitomi";

export type TaggedMetaItem = {
  label: string;
  value: string | string[];
};

export type TaggedDocument = {
  service: TaggedService;
  id: string;
  title: string;
  contentUrl: string;
  sourceUrl: string;
  meta: TaggedMetaItem[];
  kind?: "hitomi";
};

const SERVICE_LABELS: Record<TaggedService, string> = {
  arxiv: "arXiv",
  hitomi: "Hitomi",
};

export const getTaggedServiceLabel = (service: TaggedService) =>
  SERVICE_LABELS[service] ?? service;

const isTaggedService = (value: string): value is TaggedService =>
  value === "arxiv" || value === "hitomi";

const stripQueryAndFragment = (value: string) => {
  const withoutFragment = value.split("#")[0] ?? value;
  return (withoutFragment.split("?")[0] ?? withoutFragment).trim();
};

const decodeSegment = (value: string) => {
  let current = value;
  for (let i = 0; i < 2; i += 1) {
    try {
      const decoded = decodeURIComponent(current);
      if (decoded === current) break;
      current = decoded;
    } catch {
      break;
    }
  }
  return current;
};

const normalizeArxivId = (value: string) => {
  let id = stripQueryAndFragment(value);
  if (!id) return "";

  id = id.replace(
    /^https?:\/\/(?:www\.|export\.)?arxiv\.org\//i,
    "",
  );
  id = id.replace(/^(abs|pdf)\//i, "");
  id = id.replace(/\.pdf$/i, "");
  id = id.replace(/\.html?$/i, "");
  return id.trim();
};

const normalizeHitomiId = (value: string) => {
  let id = stripQueryAndFragment(value);
  if (!id) return "";

  const urlMatch = id.match(/^https?:\/\/[^/]+\/(.+)$/i);
  if (urlMatch?.[1]) {
    id = urlMatch[1];
  }

  id = id.replace(/^galleries\//i, "");
  id = id.replace(/^reader\//i, "");
  id = id.replace(/\.html?$/i, "");

  const parts = id.split("/").filter(Boolean);
  if (parts.length) {
    id = parts[parts.length - 1] ?? id;
  }

  const digitsMatch = id.match(/(\d+)/);
  return (digitsMatch?.[1] ?? id).trim();
};

const parseTaggedPath = (segments: string[]) => {
  if (!segments.length) return null;
  const normalizedSegments = segments.map((segment) => decodeSegment(segment));
  const [first = "", ...rest] = normalizedSegments;

  const parseColon = (value: string) => {
    const colonIndex = value.indexOf(":");
    if (colonIndex <= 0) return null;
    const serviceKey = value.slice(0, colonIndex).toLowerCase();
    if (!isTaggedService(serviceKey)) return null;
    const idHead = value.slice(colonIndex + 1);
    const idParts = [idHead, ...rest].filter(Boolean);
    const id = idParts.join("/");
    if (!id) return null;
    return { service: serviceKey, id };
  };

  const direct = parseColon(first);
  if (direct) return direct;

  const serviceKey = first.toLowerCase();
  if (isTaggedService(serviceKey)) {
    const id = rest.filter(Boolean).join("/");
    if (id) return { service: serviceKey, id };
  }

  return null;
};

const uniqueValues = (values: string[]) =>
  Array.from(
    new Set(
      values
        .map((value) => value.trim())
        .filter((value) => value.length > 0),
    ),
  );

const normalizeMeta = (items: Array<TaggedMetaItem | null>) =>
  items
    .filter((item): item is TaggedMetaItem => Boolean(item))
    .map((item) => {
      const value = Array.isArray(item.value)
        ? uniqueValues(item.value)
        : item.value.trim();
      return { ...item, value };
    })
    .filter((item) =>
      Array.isArray(item.value) ? item.value.length > 0 : item.value.length > 0,
    );

const decodeXmlEntities = (value: string) =>
  value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");

const normalizeText = (value: string) =>
  decodeXmlEntities(value).replace(/\s+/g, " ").trim();

const matchTag = (input: string, tag: string) => {
  const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i");
  const match = input.match(regex);
  return match ? normalizeText(match[1]) : "";
};

const extractAuthors = (entry: string) => {
  const authors: string[] = [];
  const regex = /<author>([\s\S]*?)<\/author>/gi;
  let match: RegExpExecArray | null = null;
  while ((match = regex.exec(entry))) {
    const name = matchTag(match[1] ?? "", "name");
    if (name) authors.push(name);
  }
  return uniqueValues(authors);
};

const extractCategories = (entry: string) => {
  const categories: string[] = [];
  const regex = /<category[^>]*term="([^"]+)"[^>]*>/gi;
  let match: RegExpExecArray | null = null;
  while ((match = regex.exec(entry))) {
    const value = (match[1] ?? "").trim();
    if (value) categories.push(value);
  }
  return uniqueValues(categories);
};

const extractPdfLink = (entry: string) => {
  const directMatch = entry.match(
    /<link[^>]*title="pdf"[^>]*href="([^"]+)"[^>]*>/i,
  );
  if (directMatch?.[1]) return directMatch[1];
  const fallbackMatch = entry.match(
    /<link[^>]*type="application\/pdf"[^>]*href="([^"]+)"[^>]*>/i,
  );
  return fallbackMatch?.[1] ?? "";
};

const formatArxivDate = (value: string) => {
  if (!value) return "";
  const trimmed = value.trim();
  const datePart = trimmed.split("T")[0] ?? trimmed;
  return datePart;
};

const resolveArxivDocument = async (id: string): Promise<TaggedDocument> => {
  const normalizedId = normalizeArxivId(id);
  const resolvedId = normalizedId || id;
  const sourceUrl = `https://arxiv.org/abs/${resolvedId}`;
  let title = `arXiv ${resolvedId}`;
  let authors: string[] = [];
  let categories: string[] = [];
  let published = "";
  let updated = "";
  let pdfUrl = `https://arxiv.org/pdf/${resolvedId}.pdf`;

  try {
    const response = await fetch(
      `https://export.arxiv.org/api/query?id_list=${encodeURIComponent(
        resolvedId,
      )}`,
      { cache: "no-store" },
    );
    if (response.ok) {
      const xml = await response.text();
      const entryMatch = xml.match(/<entry>([\s\S]*?)<\/entry>/i);
      const entry = entryMatch?.[1] ?? "";
      if (entry) {
        const entryTitle = matchTag(entry, "title");
        if (entryTitle) title = entryTitle;
        authors = extractAuthors(entry);
        categories = extractCategories(entry);
        published = formatArxivDate(matchTag(entry, "published"));
        updated = formatArxivDate(matchTag(entry, "updated"));
        const resolvedPdf = extractPdfLink(entry);
        if (resolvedPdf) {
          pdfUrl = resolvedPdf;
        }
      }
    }
  } catch {
    // Ignore API failures and fall back to the basic URL.
  }

  const meta = normalizeMeta([
    authors.length ? { label: "Authors", value: authors.join(", ") } : null,
    categories.length ? { label: "Tags", value: categories } : null,
    published ? { label: "Published", value: published } : null,
    updated ? { label: "Updated", value: updated } : null,
  ]);

  const normalizedPdfUrl = pdfUrl.replace(/^http:\/\//i, "https://");
  const proxyUrl = `/api/arxiv-pdf?url=${encodeURIComponent(normalizedPdfUrl)}`;

  return {
    service: "arxiv",
    id: resolvedId,
    title,
    contentUrl: proxyUrl,
    sourceUrl,
    meta,
  };
};

const extractHitomiList = (items: HitomiPerson[] | undefined, key: string) => {
  if (!items) return [];
  const values = items
    .map((entry) => entry[key])
    .filter((value): value is string => Boolean(value && value.trim().length));
  return uniqueValues(values);
};

const resolveHitomiDocument = async (id: string): Promise<TaggedDocument> => {
  const normalizedId = normalizeHitomiId(id);
  const resolvedId = normalizedId || id;
  const sourceUrl = `https://hitomi.la/galleries/${resolvedId}.html`;
  const contentUrl = `https://hitomi.la/reader/${resolvedId}.html`;
  let title = `Hitomi ${resolvedId}`;
  let info: HitomiGalleryInfo | null = null;

  info = await fetchHitomiGalleryInfo(resolvedId);

  const candidateTitle = [info?.title, info?.japanese_title]
    .map((value) => (value ? normalizeText(value) : ""))
    .find((value) => value.length);
  if (candidateTitle) {
    title = candidateTitle;
  }

  const artists = extractHitomiList(info?.artists, "artist");
  const groups = extractHitomiList(info?.groups, "group");
  const characters = extractHitomiList(info?.characters, "character");
  const parodies = extractHitomiList(
    info?.parodys ?? info?.parodies,
    "parody",
  );
  const tags = uniqueValues(
    (info?.tags ?? [])
      .map((entry) => entry.tag ?? "")
      .filter((value) => value.length > 0),
  );

  const meta = normalizeMeta([
    artists.length ? { label: "Artists", value: artists.join(", ") } : null,
    groups.length ? { label: "Groups", value: groups.join(", ") } : null,
    characters.length ? { label: "Characters", value: characters.join(", ") } : null,
    parodies.length ? { label: "Parody", value: parodies.join(", ") } : null,
    tags.length ? { label: "Tags", value: tags } : null,
    info?.language ? { label: "Language", value: info.language } : null,
    info?.type ? { label: "Type", value: info.type } : null,
    typeof info?.files?.length === "number"
      ? { label: "Pages", value: String(info.files.length) }
      : null,
    info?.date ? { label: "Date", value: info.date } : null,
  ]);

  return {
    service: "hitomi",
    id: resolvedId,
    title,
    contentUrl,
    sourceUrl,
    meta,
    kind: "hitomi",
  };
};

export async function resolveTaggedDocument(
  docSegments: string[],
): Promise<TaggedDocument | null> {
  const parsed = parseTaggedPath(docSegments);
  if (!parsed) return null;
  if (parsed.service === "arxiv") {
    return resolveArxivDocument(parsed.id);
  }
  if (parsed.service === "hitomi") {
    return resolveHitomiDocument(parsed.id);
  }
  return null;
}
