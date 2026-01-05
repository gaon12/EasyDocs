import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // embed 경로에 대해서만 frame-ancestors * 설정
  if (request.nextUrl.pathname.startsWith("/embed")) {
    // 기존 CSP 헤더 제거 후 새로 설정
    response.headers.delete("Content-Security-Policy");
    response.headers.delete("X-Frame-Options");

    const embedCsp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com data:",
      "img-src 'self' data: blob: https:",
      "media-src 'self' blob: https:",
      "connect-src 'self' https:",
      "frame-src 'self' blob:",
      "worker-src 'self' blob:",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors *",
      "upgrade-insecure-requests",
    ].join("; ");

    response.headers.set("Content-Security-Policy", embedCsp);
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
