import { NextResponse, type NextRequest } from "next/server";

const ALLOWED_HOST = "gold-usergeneratedcontent.net";
const ALLOWED_CONTENT_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/avif",
];
const MAX_CONTENT_LENGTH = 50 * 1024 * 1024;

export const dynamic = "force-dynamic";

const isPrivateIP = (hostname: string): boolean => {
  if (hostname === "localhost" || hostname === "127.0.0.1") return true;
  if (hostname.startsWith("192.168.")) return true;
  if (hostname.startsWith("10.")) return true;
  if (hostname.startsWith("172.")) {
    const parts = hostname.split(".");
    const second = parseInt(parts[1] || "0", 10);
    if (second >= 16 && second <= 31) return true;
  }
  if (hostname.startsWith("169.254.")) return true;
  if (hostname.startsWith("::1") || hostname === "::") return true;
  if (hostname.startsWith("fc") || hostname.startsWith("fd")) return true;
  return false;
};

const isAllowedHost = (hostname: string) =>
  hostname === ALLOWED_HOST || hostname.endsWith(`.${ALLOWED_HOST}`);

const validateGalleryId = (gid: string | null): string | null => {
  if (!gid) return null;
  const cleaned = gid.trim();
  if (!/^[0-9]+$/.test(cleaned)) return null;
  if (cleaned.length > 20) return null;
  return cleaned;
};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const target = searchParams.get("url");
  if (!target) {
    return NextResponse.json({ error: "Missing url parameter." }, { status: 400 });
  }

  let resolved: URL;
  try {
    resolved = new URL(target);
  } catch {
    return NextResponse.json({ error: "Invalid url parameter." }, { status: 400 });
  }

  if (resolved.protocol !== "https:") {
    return NextResponse.json({ error: "Invalid url protocol." }, { status: 400 });
  }

  if (!isAllowedHost(resolved.hostname)) {
    return NextResponse.json({ error: "Host not allowed." }, { status: 403 });
  }

  if (isPrivateIP(resolved.hostname)) {
    return NextResponse.json({ error: "Private IP addresses not allowed." }, { status: 403 });
  }

  const galleryId = validateGalleryId(searchParams.get("gid"));
  const referer = galleryId
    ? `https://hitomi.la/reader/${galleryId}.html`
    : "https://hitomi.la/";

  const headers = new Headers();
  headers.set("Referer", referer);
  headers.set("Origin", "https://hitomi.la");
  headers.set("User-Agent", "Mozilla/5.0 (compatible)");

  const range = request.headers.get("range");
  if (range && /^bytes=\d+-\d*$/.test(range)) {
    headers.set("Range", range);
  }

  let response: Response;
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    response = await fetch(resolved.toString(), {
      headers,
      cache: "no-store",
      signal: controller.signal,
      redirect: "manual",
    });

    clearTimeout(timeoutId);

    if (response.type === "opaqueredirect" || response.status >= 300 && response.status < 400) {
      return NextResponse.json({ error: "Redirects not allowed." }, { status: 403 });
    }
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch remote image." },
      { status: 502 },
    );
  }

  if (!response.ok || !response.body) {
    return NextResponse.json(
      { error: "Failed to fetch remote image." },
      { status: response.status },
    );
  }

  const contentType = response.headers.get("content-type");
  if (!contentType || !ALLOWED_CONTENT_TYPES.some((type) => contentType.includes(type))) {
    return NextResponse.json(
      { error: "Invalid content type." },
      { status: 415 },
    );
  }

  const contentLength = response.headers.get("content-length");
  if (contentLength && parseInt(contentLength, 10) > MAX_CONTENT_LENGTH) {
    return NextResponse.json(
      { error: "Content too large." },
      { status: 413 },
    );
  }

  const passthroughHeaders = new Headers();
  passthroughHeaders.set("content-type", contentType);
  if (contentLength) passthroughHeaders.set("content-length", contentLength);

  const acceptRanges = response.headers.get("accept-ranges");
  if (acceptRanges) passthroughHeaders.set("accept-ranges", acceptRanges);

  const contentRange = response.headers.get("content-range");
  if (contentRange) passthroughHeaders.set("content-range", contentRange);

  passthroughHeaders.set("cache-control", "public, max-age=86400, immutable");
  passthroughHeaders.set("X-Content-Type-Options", "nosniff");

  return new NextResponse(response.body, {
    status: response.status,
    headers: passthroughHeaders,
  });
}
