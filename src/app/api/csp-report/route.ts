import { NextResponse } from "next/server";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";

const MAX_BODY_BYTES = 8 * 1024;

/**
 * Empfängt CSP-Verstoßmeldungen (report-uri in src/middleware.ts) und
 * schreibt sie ins Log. Kein Speichern, keine Datenbank: die Meldungen
 * dienen nur der Beobachtungsphase, bevor die CSP scharf geschaltet wird.
 *
 * Browser schicken die Meldung als application/csp-report bzw.
 * application/reports+json — beides ist JSON.
 */
export const runtime = "nodejs";

export async function POST(req: Request) {
  // Öffentlich erreichbar und unauthentifiziert — ohne Bremse könnte jemand
  // die Logs zumüllen und Funktionsaufrufe verbrennen. 60 Meldungen pro
  // Minute und IP reichen für jede echte Beobachtung.
  const rl = await checkRateLimit(`csp:${getClientIp(req)}`, 60, 60_000);
  if (!rl.allowed) return new NextResponse(null, { status: 429 });

  const declared = Number(req.headers.get("content-length") ?? 0);
  if (declared > MAX_BODY_BYTES) return new NextResponse(null, { status: 413 });

  let body: unknown = null;
  try {
    const text = await req.text();
    if (text.length > MAX_BODY_BYTES) return new NextResponse(null, { status: 413 });
    body = JSON.parse(text);
  } catch {
    return new NextResponse(null, { status: 204 });
  }

  // Nur das Wesentliche loggen — die vollständige Meldung enthält u.a. die
  // komplette Seiten-URL, mehr braucht die Auswertung nicht.
  const r =
    body && typeof body === "object" && "csp-report" in body
      ? (body as { "csp-report": Record<string, unknown> })["csp-report"]
      : (body as Record<string, unknown> | null);

  console.warn(
    "[csp-report]",
    JSON.stringify({
      directive: r?.["effective-directive"] ?? r?.["violated-directive"] ?? r?.["effectiveDirective"],
      blocked: r?.["blocked-uri"] ?? r?.["blockedURL"],
      page: r?.["document-uri"] ?? r?.["documentURL"],
      sample: r?.["script-sample"] ?? r?.["sample"]
    })
  );

  return new NextResponse(null, { status: 204 });
}
