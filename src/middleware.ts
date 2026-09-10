import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth";

const MUTATING = new Set(["POST", "PUT", "PATCH", "DELETE"]);

/**
 * Schutz vor Anfragen von fremden Seiten (CSRF) für alle schreibenden
 * API-Aufrufe. Das SameSite=Lax-Cookie verhindert das heute schon — dies ist
 * die zweite Verteidigungslinie für den Fall, dass ein Browser das anders
 * handhabt oder ein weiteres Cookie dazukommt.
 *
 * Geprüft wird, was der Browser mitschickt: Sec-Fetch-Site (moderne Browser)
 * oder Origin. Fehlen beide — etwa bei Aufrufen von Skripten oder sehr alten
 * Browsern —, wird die Anfrage nicht blockiert; die Session-Prüfung in den
 * Routen bleibt davon unberührt. Stripe-Webhooks laufen unter /api/webhooks
 * und sind hier bewusst nicht erfasst: sie kommen naturgemäß von fremd.
 */
function isCrossSite(req: NextRequest) {
  const fetchSite = req.headers.get("sec-fetch-site");
  if (fetchSite) return fetchSite === "cross-site";

  const origin = req.headers.get("origin");
  if (!origin) return false;
  try {
    return new URL(origin).host !== req.nextUrl.host;
  } catch {
    return true;
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/api/")) {
    if (MUTATING.has(req.method) && isCrossSite(req)) {
      return NextResponse.json(
        { error: "Anfrage von fremder Seite abgelehnt" },
        { status: 403 }
      );
    }
    return NextResponse.next();
  }

  // Schützt den gesamten /admin-Bereich (Dashboard, Event-Verwaltung, Scanner).
  // Die /api/admin/* und /api/tickets/* Routen prüfen die Session zusätzlich
  // selbst nochmal server-seitig (defense in depth).
  if (pathname === "/admin/login") {
    return NextResponse.next();
  }

  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const session = await verifySessionToken(token);

  if (!session) {
    const loginUrl = new URL("/admin/login", req.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    // Alle API-Routen außer den Stripe-Webhooks (siehe isCrossSite).
    "/api/((?!webhooks/).*)"
  ]
};
