import { NextResponse, type NextRequest } from "next/server";

const MAX_CONTENT_LENGTH = 150 * 1024 * 1024;

export const dynamic = "force-dynamic";

/**
 * Check if a hostname refers to a private IP address
 * Blocks access to localhost, private networks, and link-local addresses
 */
const isPrivateIP = (hostname: string): boolean => {
  // Localhost
  if (hostname === "localhost" || hostname === "127.0.0.1") return true;

  // IPv4 private ranges
  if (hostname.startsWith("192.168.")) return true; // 192.168.0.0/16
  if (hostname.startsWith("10.")) return true; // 10.0.0.0/8
  if (hostname.startsWith("172.")) {
    const parts = hostname.split(".");
    const second = parseInt(parts[1] || "0", 10);
    if (second >= 16 && second <= 31) return true; // 172.16.0.0/12
  }
  if (hostname.startsWith("169.254.")) return true; // Link-local 169.254.0.0/16

  // IPv6 loopback and private ranges
  if (hostname.startsWith("::1") || hostname === "::") return true; // ::1 loopback
  if (hostname.startsWith("fc") || hostname.startsWith("fd")) return true; // fc00::/7 unique local
  if (hostname.startsWith("fe80:")) return true; // fe80::/10 link-local

  // Additional protection: 0.0.0.0 and broadcast
  if (hostname === "0.0.0.0" || hostname === "255.255.255.255") return true;

  return false;
};

const resolveTargetUrl = (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const target = searchParams.get("url");
  if (!target) return { error: "Missing url parameter.", status: 400 };

  let resolved: URL;
  try {
    resolved = new URL(target);
  } catch {
    return { error: "Invalid url parameter.", status: 400 };
  }

  if (resolved.protocol !== "http:" && resolved.protocol !== "https:") {
    return { error: "Invalid url protocol.", status: 400 };
  }

  if (isPrivateIP(resolved.hostname)) {
    return { error: "Private IP addresses not allowed.", status: 403 };
  }

  return { resolved };
};

const buildPassthroughHeaders = (response: Response) => {
  const headers = new Headers();
  const contentType = response.headers.get("content-type");
  if (contentType) headers.set("content-type", contentType);

  const contentLength = response.headers.get("content-length");
  if (contentLength) headers.set("content-length", contentLength);

  const acceptRanges = response.headers.get("accept-ranges");
  if (acceptRanges) headers.set("accept-ranges", acceptRanges);

  const contentRange = response.headers.get("content-range");
  if (contentRange) headers.set("content-range", contentRange);

  const etag = response.headers.get("etag");
  if (etag) headers.set("etag", etag);

  const lastModified = response.headers.get("last-modified");
  if (lastModified) headers.set("last-modified", lastModified);

  headers.set("cache-control", "public, max-age=300");
  headers.set("access-control-allow-origin", "*");
  headers.set("access-control-allow-private-network", "true");
  headers.set("X-Content-Type-Options", "nosniff");

  return headers;
};

const proxyRequest = async (request: NextRequest, method: "GET" | "HEAD") => {
  const resolvedTarget = resolveTargetUrl(request);
  if ("error" in resolvedTarget) {
    return NextResponse.json(
      { error: resolvedTarget.error },
      { status: resolvedTarget.status },
    );
  }

  const headers = new Headers();
  headers.set("User-Agent", "Mozilla/5.0 (compatible)");

  const range = request.headers.get("range");
  if (range && /^bytes=\d+-\d*$/.test(range)) {
    headers.set("Range", range);
  }

  let response: Response;
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    response = await fetch(resolvedTarget.resolved.toString(), {
      method,
      headers,
      cache: "no-store",
      signal: controller.signal,
      redirect: "manual",
    });

    clearTimeout(timeoutId);

    if (response.type === "opaqueredirect" || (response.status >= 300 && response.status < 400)) {
      return NextResponse.json({ error: "Redirects not allowed." }, { status: 403 });
    }
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch remote content." },
      { status: 502 },
    );
  }

  if (!response.ok) {
    return NextResponse.json(
      { error: "Failed to fetch remote content." },
      { status: response.status },
    );
  }

  const contentLength = response.headers.get("content-length");
  if (contentLength && parseInt(contentLength, 10) > MAX_CONTENT_LENGTH) {
    return NextResponse.json(
      { error: "Content too large." },
      { status: 413 },
    );
  }

  const passthroughHeaders = buildPassthroughHeaders(response);

  if (method === "HEAD") {
    return new NextResponse(null, {
      status: response.status,
      headers: passthroughHeaders,
    });
  }

  return new NextResponse(response.body, {
    status: response.status,
    headers: passthroughHeaders,
  });
};

export async function GET(request: NextRequest) {
  return proxyRequest(request, "GET");
}

export async function HEAD(request: NextRequest) {
  return proxyRequest(request, "HEAD");
}

export async function OPTIONS(request: NextRequest) {
  const headers = new Headers();
  headers.set("access-control-allow-origin", "*");
  headers.set("access-control-allow-methods", "GET, HEAD, OPTIONS");
  headers.set("access-control-allow-headers", "Range, Content-Type");
  headers.set("access-control-allow-private-network", "true");
  headers.set("access-control-max-age", "86400");

  return new NextResponse(null, {
    status: 204,
    headers,
  });
}
