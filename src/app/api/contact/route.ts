import { NextResponse } from "next/server";
import { contactSchema } from "@/lib/validation";
import { sendContactEmail } from "@/lib/email";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";

export async function POST(req: Request) {
  // Schutz vor Spam: max. 5 Nachrichten pro 10 Minuten pro IP.
  const ip = getClientIp(req);
  const rl = checkRateLimit(`contact:${ip}`, 5, 10 * 60_000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Zu viele Nachrichten. Bitte in ein paar Minuten erneut versuchen." },
      { status: 429 }
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = contactSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Ungültige Eingabe" },
      { status: 400 }
    );
  }

  // Honeypot-Feld: Bots füllen versteckte Felder oft blind aus, echte
  // Nutzer:innen sehen es nie (siehe ContactForm.tsx). Einfache, unauffällige
  // Ergänzung zum IP-Rate-Limiting ohne CAPTCHA/Drittanbieter.
  if (typeof body?.website === "string" && body.website.length > 0) {
    return NextResponse.json({ ok: true });
  }

  try {
    await sendContactEmail(parsed.data);
  } catch (err) {
    console.error("[contact] Versand fehlgeschlagen:", err);
    return NextResponse.json(
      { error: "Nachricht konnte nicht gesendet werden. Bitte später erneut versuchen." },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
