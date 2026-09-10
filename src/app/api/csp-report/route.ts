import { NextResponse } from "next/server";

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
  let body: unknown = null;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: true });
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
