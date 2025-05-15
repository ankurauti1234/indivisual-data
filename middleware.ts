import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyJwtToken } from "./lib/jwt";

const publicPaths = [
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/logout",
  "/login",
  "/register",
  "/",
];

const protectedPaths = ["/dashboard", "/profile", "/settings"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  console.log(`Middleware: Processing request for ${pathname}`);

  if (pathname.startsWith("/api") && !publicPaths.includes(pathname)) {
    const authHeader = request.headers.get("Authorization");
    console.log(`Middleware: API route, Authorization header: ${authHeader}`);

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.log("Middleware: Missing or invalid Authorization header");
      return NextResponse.json(
        { message: "Authentication required" },
        { status: 401 }
      );
    }

    const token = authHeader.split(" ")[1];
    console.log(`Middleware: Verifying API token: ${token.slice(0, 10)}...`);

    const payload = await verifyJwtToken(token);
    if (!payload) {
      console.log("Middleware: API token verification failed");
      return NextResponse.json(
        { message: "Invalid or expired token" },
        { status: 401 }
      );
    }
    console.log("Middleware: API token verified successfully");
  }

  if (protectedPaths.some((path) => pathname.startsWith(path))) {
    const token = request.cookies.get("token")?.value;
    console.log(
      `Middleware: Protected route, token: ${
        token ? token.slice(0, 10) + "..." : "none"
      }`
    );

    if (!token) {
      console.log("Middleware: No token found, redirecting to login");
      const url = new URL("/login", request.url);
      url.searchParams.set("from", pathname);
      return NextResponse.redirect(url);
    }

    const payload = await verifyJwtToken(token);
    if (!payload) {
      console.log(
        "Middleware: Token verification failed, redirecting to login"
      );
      const url = new URL("/login", request.url);
      url.searchParams.set("from", pathname);
      return NextResponse.redirect(url);
    }
    console.log("Middleware: Token verified successfully for protected route");
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/api/:path*",
    "/dashboard/:path*",
    "/profile/:path*",
    "/settings/:path*",
  ],
};
