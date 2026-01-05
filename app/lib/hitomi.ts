export type HitomiPerson = Record<string, string | undefined>;

export type HitomiFile = {
  name?: string;
  hash?: string;
  haswebp?: number | boolean;
  hasavif?: number | boolean;
  width?: number;
  height?: number;
};

export type HitomiGalleryInfo = {
  id?: number | string;
  title?: string;
  japanese_title?: string;
  language?: string;
  type?: string;
  date?: string;
  artists?: HitomiPerson[];
  groups?: HitomiPerson[];
  characters?: HitomiPerson[];
  parodys?: HitomiPerson[];
  parodies?: HitomiPerson[];
  tags?: Array<{ tag?: string }>;
  files?: HitomiFile[];
};

export type HitomiServerMap = {
  map: Record<number, number>;
  basePath: string;
  defaultServer: number;
};

const HITOMI_GALLERY_BASE =
  "https://ltn.gold-usergeneratedcontent.net/galleries";
const HITOMI_GG_URL = "https://ltn.gold-usergeneratedcontent.net/gg.js";
const HITOMI_IMAGE_DOMAIN = "gold-usergeneratedcontent.net";

const parseJsonPayload = (payload: string) => {
  const start = payload.indexOf("{");
  const end = payload.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  try {
    return JSON.parse(payload.slice(start, end + 1)) as HitomiGalleryInfo;
  } catch {
    return null;
  }
};

export async function fetchHitomiGalleryInfo(
  galleryId: string,
): Promise<HitomiGalleryInfo | null> {
  try {
    const response = await fetch(
      `${HITOMI_GALLERY_BASE}/${encodeURIComponent(galleryId)}.js`,
      { cache: "no-store" },
    );
    if (!response.ok) return null;
    const payload = await response.text();
    return parseJsonPayload(payload);
  } catch {
    return null;
  }
}

const parseServerMap = (payload: string): HitomiServerMap | null => {
  const map: Record<number, number> = {};
  const keys: number[] = [];
  const caseRegex = /case\s+(\d+):(?:\s*o\s*=\s*(\d+))?/g;
  for (const match of payload.matchAll(caseRegex)) {
    const key = Number(match[1]);
    const value = match[2] ? Number(match[2]) : null;
    if (!Number.isFinite(key)) continue;
    keys.push(key);
    if (value !== null && Number.isFinite(value)) {
      for (const storedKey of keys) {
        map[storedKey] = value;
      }
      keys.length = 0;
    }
  }

  const ifRegex = /if\s+\(g\s*===?\s*(\d+)\)[\s{]*o\s*=\s*(\d+)/g;
  for (const match of payload.matchAll(ifRegex)) {
    const key = Number(match[1]);
    const value = Number(match[2]);
    if (Number.isFinite(key) && Number.isFinite(value)) {
      map[key] = value;
    }
  }

  const defaultMatch = /(?:var\s|default:)\s*o\s*=\s*(\d+)/.exec(payload);
  const baseMatch = /b:\s*["']([^"']+)["']/.exec(payload);
  if (!baseMatch) return null;
  const basePath = baseMatch[1].replace(/^\/+|\/+$/g, "");
  const defaultServer = defaultMatch ? Number(defaultMatch[1]) : 0;

  return {
    map,
    basePath,
    defaultServer: Number.isFinite(defaultServer) ? defaultServer : 0,
  };
};

let serverMapPromise: Promise<HitomiServerMap | null> | null = null;

export async function getHitomiServerMap(): Promise<HitomiServerMap | null> {
  if (!serverMapPromise) {
    serverMapPromise = fetch(HITOMI_GG_URL, { cache: "no-store" })
      .then((response) => (response.ok ? response.text() : ""))
      .then((payload) => (payload ? parseServerMap(payload) : null))
      .catch(() => null);
  }

  const resolved = await serverMapPromise;
  if (!resolved) {
    serverMapPromise = null;
  }
  return resolved;
}

const resolveHitomiExtension = (file: HitomiFile) => {
  if (file.haswebp) return "webp";
  if (file.hasavif) return "avif";
  const name = file.name ?? "";
  const ext = name.split(".").pop();
  return ext ? ext.toLowerCase() : "jpg";
};

export const getHitomiImageVariants = (file: HitomiFile) => {
  const variants: string[] = [];
  if (file.haswebp) variants.push("webp");
  if (file.hasavif) variants.push("avif");
  const name = file.name ?? "";
  const originalExt = name.split(".").pop()?.toLowerCase();
  if (originalExt && !variants.includes(originalExt)) {
    variants.push(originalExt);
  }
  if (!variants.length) {
    variants.push("jpg");
  }
  return variants;
};

const resolveHashNumber = (hash: string) => {
  if (hash.length < 3) return null;
  const code = hash.slice(-1) + hash.slice(-3, -1);
  const value = Number.parseInt(code, 16);
  return Number.isFinite(value) ? value : null;
};

export function resolveHitomiImageUrl(
  file: HitomiFile,
  serverMap: HitomiServerMap,
  overrideExt?: string,
): string | null {
  const hash = file.hash;
  if (!hash) return null;
  const hashNumber = resolveHashNumber(hash);
  if (hashNumber === null) return null;
  const ext = (overrideExt ?? resolveHitomiExtension(file)).toLowerCase();
  const serverValue = serverMap.map[hashNumber] ?? serverMap.defaultServer;
  const serverId = Number.isFinite(serverValue) ? serverValue + 1 : 1;
  const hostPrefix = ext.charAt(0) || "i";
  return `https://${hostPrefix}${serverId}.${HITOMI_IMAGE_DOMAIN}/${serverMap.basePath}/${hashNumber}/${hash}.${ext}`;
}
