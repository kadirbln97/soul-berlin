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

/**
 * Content-Security-Policy mit Nonce.
 *
 * Zweite Verteidigungslinie gegen eingeschleustes Skript (XSS): der Browser
 * führt nur Skripte aus, die unsere Nonce tragen — Next hängt sie an seine
 * eigenen Inline-Skripte, sobald sie im Request-Header steht. Alles andere
 * (Bilder, Videos, Verbindungen) ist auf die eigene Seite und den
 * Blob-Speicher begrenzt.
 *
 * Vorerst im Report-Only-Modus: Verstöße werden nicht blockiert, sondern an
 * /api/csp-report gemeldet und dort geloggt. Nach einer Beobachtungsphase
 * ohne Meldungen wird der Header auf Content-Security-Policy umgestellt.
 */
function buildCsp(nonce: string) {
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`,
    // Tailwind und next/font schreiben Inline-Styles; 'unsafe-inline' für
    // Styles ist verbreitet und ungefährlich, solange Skripte gesperrt sind.
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https://*.public.blob.vercel-storage.com",
    "media-src 'self' blob: https://*.public.blob.vercel-storage.com",
    "font-src 'self'",
    "connect-src 'self'",
    // Admin-Baukasten zeigt die eigene Startseite in einem iframe.
    "frame-src 'self'",
    "frame-ancestors 'self'",
    "form-action 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "upgrade-insecure-requests",
    "report-uri /api/csp-report"
  ].join("; ");
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/api/")) {
    // Webhooks kommen von Stripe-Servern — ohne Browser-Header, aber mit
    // eigener Signaturprüfung in der Route. Hier bewusst ausgenommen.
    if (pathname.startsWith("/api/webhooks/")) return NextResponse.next();

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
  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    const token = req.cookies.get(SESSION_COOKIE)?.value;
    const session = await verifySessionToken(token);

    if (!session) {
      const loginUrl = new URL("/admin/login", req.url);
      loginUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Nonce pro Anfrage; im Request-Header, damit Next sie an seine Skripte
  // hängt, und im Response-Header, damit der Browser sie prüft.
  const nonce = btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(16))));
  const csp = buildCsp(nonce);
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("Content-Security-Policy-Report-Only", csp);
  requestHeaders.set("x-nonce", nonce);

  const res = NextResponse.next({ request: { headers: requestHeaders } });
  res.headers.set("Content-Security-Policy-Report-Only", csp);
  return res;
}

export const config = {
  matcher: [
    // Alle Seiten — ohne statische Dateien, Bilder und Sitemap/Robots, die
    // keinen HTML-Inhalt haben und keine CSP brauchen.
    "/((?!_next/static|_next/image|favicon.ico|media/|robots.txt|sitemap.xml|opengraph-image|twitter-image).*)"
  ]
};
