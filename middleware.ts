import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/session";

const INTERNAL_ONLY_PREFIXES = [
  "/flotte",
  "/entrepot",
  "/clients",
  "/fournisseurs",
  "/comptes",
  "/audit",
];

const PUBLIC_PREFIXES = ["/login", "/signup", "/forgot-password", "/reset-password", "/api/auth"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const session = token ? await verifySessionToken(token) : null;

  if (!session) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  const isInternalOnly =
    pathname === "/" ||
    pathname === "/dossiers" ||
    INTERNAL_ONLY_PREFIXES.some((p) => pathname.startsWith(p));

  if (isInternalOnly && session.role !== "Interne") {
    const url = request.nextUrl.clone();
    url.pathname = "/mon-espace";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
