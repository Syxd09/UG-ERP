import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 1. Allow public static assets and public routes
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/logos") ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/share") ||
    pathname.startsWith("/share") ||
    pathname === "/login" ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  // 2. Check for active NextAuth session token
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  // 3. Root redirect: If authenticated -> /dashboard, else -> /login
  if (pathname === "/") {
    if (token) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    } else {
      return NextResponse.redirect(new URL("/login", req.url));
    }
  }

  // 4. Protect internal API routes
  if (!token && pathname.startsWith("/api/")) {
    return NextResponse.json(
      { success: false, error: "Unauthorized: Active session required" },
      { status: 401 }
    );
  }

  // 5. Protect all application dashboard pages
  if (!token) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
