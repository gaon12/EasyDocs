type SourceValue = string | string[] | undefined;

const coerceString = (value: SourceValue) =>
  Array.isArray(value) ? value[0] ?? "" : value ?? "";

const BLOCKED_PROTOCOLS = [
  "javascript:",
  "data:",
  "vbscript:",
  "file:",
  "about:",
];

const isBlockedProtocol = (value: string): boolean => {
  const lower = value.toLowerCase().trim();
  return BLOCKED_PROTOCOLS.some((protocol) => lower.startsWith(protocol));
};

export const resolvePdfSrc = (
  value: SourceValue,
  { allowBlob = false }: { allowBlob?: boolean } = {},
) => {
  const trimmed = coerceString(value).trim();
  if (!trimmed) return "";

  if (isBlockedProtocol(trimmed)) {
    return "";
  }

  if (allowBlob && trimmed.startsWith("blob:")) {
    try {
      new URL(trimmed);
      return trimmed;
    } catch {
      return "";
    }
  }

  if (trimmed.startsWith("/")) {
    if (trimmed.includes("..") || trimmed.includes("//")) {
      return "";
    }
    return trimmed;
  }

  try {
    const url = new URL(trimmed);
    if (url.protocol === "http:" || url.protocol === "https:") {
      if (url.hostname === "localhost" || url.hostname === "127.0.0.1" || url.hostname.startsWith("192.168.") || url.hostname.startsWith("10.") || url.hostname.startsWith("172.")) {
        return "";
      }
      return trimmed;
    }
  } catch {
    return "";
  }

  return "";
};

const normalizeScheme = (value: string) =>
  value.replace(/^(https?):\/(?!\/)/i, "$1://");

const normalizeSourceScheme = (value: string) => {
  const normalized = normalizeScheme(value);
  return normalized.replace(/^blob:(https?):\/(?!\/)/i, "blob:$1://");
};

const coercePathValue = (value: string | string[] | undefined) => {
  if (!value) return "";
  return Array.isArray(value) ? value.join("/") : value;
};

export const resolvePdfSrcFromPath = (
  value: string | string[] | undefined,
  options: { allowBlob?: boolean } = {},
) => {
  const trimmed = coercePathValue(value).trim();
  if (!trimmed) return "";

  const normalized = normalizeSourceScheme(trimmed);
  const direct = resolvePdfSrc(normalized, options);
  if (direct) return direct;

  try {
    const decoded = normalizeSourceScheme(decodeURIComponent(trimmed));
    return resolvePdfSrc(decoded, options);
  } catch {
    return "";
  }
};

export const resolvePdfSrcFromSearchParams = (
  params?: Record<string, SourceValue>,
  options: { allowBlob?: boolean } = {},
) => {
  if (!params) return "";
  const candidate =
    params.url ?? params.src ?? params.file ?? params.pdf ?? params.document;
  return resolvePdfSrc(candidate, options);
};

export const encodePdfSrcForPath = (value: string) => encodeURIComponent(value);

export const resolvePdfName = (value: SourceValue) => {
  const trimmed = coerceString(value).trim();
  return trimmed || "";
};

export const resolvePageNumber = (value: SourceValue) => {
  const raw = coerceString(value).trim();
  if (!raw) return null;
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed < 1) return null;
  return parsed;
};

export const resolvePageFromSearchParams = (
  params?: Record<string, SourceValue>,
) => {
  if (!params) return null;
  return (
    resolvePageNumber(params.page) ??
    resolvePageNumber(params.p) ??
    resolvePageNumber(params.pageNumber) ??
    resolvePageNumber(params.pg)
  );
};

export const extractPageFromFragment = (value: string) => {
  const hashIndex = value.indexOf("#");
  if (hashIndex === -1) {
    return { src: value, page: null };
  }

  const base = value.slice(0, hashIndex);
  const fragment = value.slice(hashIndex + 1);
  if (!fragment) {
    return { src: base, page: null };
  }

  const params = new URLSearchParams(fragment);
  const page =
    resolvePageNumber(params.get("page") ?? undefined) ??
    resolvePageNumber(params.get("p") ?? undefined);

  if (!page) {
    return { src: value, page: null };
  }

  return { src: base, page };
};
