import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

const isAllowedHost = (host: string) => {
  const normalized = host.toLowerCase();
  return normalized === "arxiv.org" || normalized.endsWith(".arxiv.org");
};

export async function GET(request: NextRequest) {
  const target = request.nextUrl.searchParams.get("url");
  if (!target) {
    return new Response("Missing url parameter.", { status: 400 });
  }

  let url: URL;
  try {
    url = new URL(target);
  } catch {
    return new Response("Invalid url parameter.", { status: 400 });
  }

  if (url.protocol !== "https:" && url.protocol !== "http:") {
    return new Response("Unsupported url protocol.", { status: 400 });
  }

  if (!isAllowedHost(url.hostname)) {
    return new Response("Host not allowed.", { status: 400 });
  }

  const headers = new Headers();
  const range = request.headers.get("range");
  if (range) {
    headers.set("range", range);
  }

  const upstream = await fetch(url.toString(), {
    headers,
    redirect: "follow",
    cache: "no-store",
  });

  const responseHeaders = new Headers();
  const passthroughHeaders = [
    "content-type",
    "content-length",
    "content-range",
    "accept-ranges",
    "cache-control",
    "etag",
    "last-modified",
  ];

  for (const header of passthroughHeaders) {
    const value = upstream.headers.get(header);
    if (value) {
      responseHeaders.set(header, value);
    }
  }

  return new Response(upstream.body, {
    status: upstream.status,
    headers: responseHeaders,
  });
}
