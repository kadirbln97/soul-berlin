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
 * Content-Security-Policy.
 *
 * Zweite Verteidigungslinie gegen eingeschleustes Skript (XSS) und gegen
 * Einbettung der Seite in fremde Seiten (Clickjacking). Alles außer Skripten
 * ist auf die eigene Seite und den Blob-Speicher begrenzt; Formulare dürfen
 * nur an die eigene Seite senden, <base> und <object> sind gesperrt.
 *
 * Skripte: die Seite lädt keinerlei Fremdskripte, daher 'self'. Nexts eigene
 * Inline-Skripte (Hydration) brauchen entweder 'unsafe-inline' oder eine
 * Nonce. Die Nonce wäre die strengere Variante — Next hängt sie aber auf
 * Vercel derzeit nicht an seine Skripte (siehe Report-Only-Variante unten,
 * die nur mit dem Cookie soul_csp_debug=1 mitgeschickt wird, damit sich das
 * weiter untersuchen lässt, ohne bei jedem Seitenaufruf ein Dutzend
 * Verstoßmeldungen zu erzeugen). Bis das läuft, gilt die Basis-Policy
 * scharf: sie blockiert jede fremde Skriptquelle, jedes fremde Formularziel
 * und jede fremde Einbettung — nur eingeschleuster Inline-Code bleibt
 * unbehandelt, den React durch sein Escaping ohnehin verhindert.
 */
const CSP_BASE = [
  "default-src 'self'",
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
  "upgrade-insecure-requests"
];

/** Scharfe Policy: ohne Nonce, dafür ohne Abhängigkeit von Next-Internas. */
function buildEnforcedCsp() {
  return [...CSP_BASE, "script-src 'self' 'unsafe-inline'"].join("; ");
}

/** Strenge Nonce-Policy — nur zur Beobachtung (Report-Only, mit Debug-Cookie). */
function buildStrictCsp(nonce: string) {
  return [
    ...CSP_BASE,
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`,
    "report-uri /api/csp-report"
  ].join("; ");
}

const CSP_DEBUG_COOKIE = "soul_csp_debug";

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

  const enforced = buildEnforcedCsp();

  // Normalfall: scharfe Basis-Policy, sonst nichts.
  if (req.cookies.get(CSP_DEBUG_COOKIE)?.value !== "1") {
    const res = NextResponse.next();
    res.headers.set("Content-Security-Policy", enforced);
    return res;
  }

  // Debug-Fall: zusätzlich die strenge Nonce-Policy im Report-Only-Modus.
  // Die Nonce geht als Request-Header an die Serverfunktion — unter beiden
  // Header-Namen, die Next dafür ausliest. Stand September 2026: die Header
  // kommen dort nachweislich an (mit headers() geprüft), Next 15.5 hängt die
  // Nonce auf Vercel trotzdem an kein einziges Skript. Nach einem
  // Next-Update hier erneut prüfen: Cookie setzen, Seite laden, im HTML nach
  // nonce="…" an den <script>-Tags suchen.
  const nonce = btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(16))));
  const strict = buildStrictCsp(nonce);
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("Content-Security-Policy", strict);
  requestHeaders.set("Content-Security-Policy-Report-Only", strict);
  requestHeaders.set("x-nonce", nonce);

  const res = NextResponse.next({ request: { headers: requestHeaders } });
  res.headers.set("Content-Security-Policy", enforced);
  res.headers.set("Content-Security-Policy-Report-Only", strict);
  return res;
}

export const config = {
  matcher: [
    // Alle Seiten — ohne statische Dateien, Bilder und Sitemap/Robots, die
    // keinen HTML-Inhalt haben und keine CSP brauchen.
    "/((?!_next/static|_next/image|favicon.ico|media/|robots.txt|sitemap.xml|opengraph-image|twitter-image).*)"
  ]
};
