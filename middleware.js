import { NextResponse } from "next/server";
import { jwtVerify } from "jose";

const COOKIE_NAME = "nutritrack_session";
const PROTECTED_PREFIXES = ["/dashboard", "/meal-diary", "/weekly-trends", "/nutribot", "/profile"];

async function isValidToken(token) {
  if (!token) return false;
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || "");
    await jwtVerify(token, secret);
    return true;
  } catch {
    return false;
  }
}

export async function middleware(request) {
  const { pathname } = request.nextUrl;
  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
  const isAuthPage = pathname === "/login" || pathname === "/signup";
  const token = request.cookies.get(COOKIE_NAME)?.value;
  const valid = await isValidToken(token);

  if (isProtected && !valid) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (isAuthPage && valid) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/meal-diary/:path*", "/weekly-trends/:path*", "/nutribot/:path*", "/profile/:path*", "/login", "/signup"],
};
