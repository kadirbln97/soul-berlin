import { NextResponse } from "next/server";
import { resolveDiscount } from "@/lib/resolveDiscount";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";

/**
 * Prüft einen eingegebenen Gutscheincode für ein Event und gibt die Regel
 * zurück, damit die Preisvorschau stimmt. Der endgültige Preis wird beim
 * Checkout serverseitig noch einmal berechnet — diese Route dient nur der
 * Anzeige.
 */
export async function GET(req: Request) {
  // Verhindert das Durchprobieren von Codes.
  const ip = getClientIp(req);
  const rl = checkRateLimit(`discount-check:${ip}`, 20, 10 * 60_000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Zu viele Versuche. Bitte kurz warten." },
      { status: 429 }
    );
  }

  const url = new URL(req.url);
  const eventId = url.searchParams.get("eventId")?.trim();
  const code = url.searchParams.get("code")?.trim();

  if (!eventId || !code) {
    return NextResponse.json({ error: "Bitte einen Code eingeben." }, { status: 400 });
  }

  const { discount, codeInvalid } = await resolveDiscount(eventId, code);

  if (codeInvalid || !discount) {
    return NextResponse.json(
      { error: "Dieser Code ist ungültig oder nicht mehr einlösbar." },
      { status: 404 }
    );
  }

  return NextResponse.json({ discount: discount.rule });
}
