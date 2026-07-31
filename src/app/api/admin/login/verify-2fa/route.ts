import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { totpCodeSchema } from "@/lib/validation";
import {
  createSessionToken,
  verifyPendingTwoFactorToken,
  PENDING_2FA_COOKIE,
  SESSION_COOKIE
} from "@/lib/auth";
import { verifyTotp } from "@/lib/totp";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";

/**
 * Schritt 2 des Admin-Logins: prüft den 6-stelligen Code aus der
 * Authenticator-App. Setzt die echte Session erst hier — vorher (nur
 * PENDING_2FA_COOKIE gesetzt) hat niemand Zugriff auf /admin/*.
 */
export async function POST(req: Request) {
  // Strengeres Limit als der Passwort-Schritt: ein 6-stelliger Code hat nur
  // 1 Million Kombinationen, also aggressiv gegen Durchprobieren schützen.
  const ip = getClientIp(req);
  const rl = checkRateLimit(`2fa:${ip}`, 5, 10 * 60_000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Zu viele Versuche. Bitte in ein paar Minuten erneut versuchen." },
      { status: 429 }
    );
  }

  const pendingToken = cookies().get(PENDING_2FA_COOKIE)?.value;
  const pending = await verifyPendingTwoFactorToken(pendingToken);
  if (!pending) {
    return NextResponse.json(
      { error: "Sitzung abgelaufen. Bitte E-Mail und Passwort erneut eingeben." },
      { status: 401 }
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = totpCodeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Ungültiger Code" },
      { status: 400 }
    );
  }

  const totpSecret = process.env.ADMIN_TOTP_SECRET;
  if (!totpSecret) {
    return NextResponse.json(
      { error: "2FA ist server-seitig nicht konfiguriert (ADMIN_TOTP_SECRET fehlt)." },
      { status: 500 }
    );
  }

  const isValid = verifyTotp(parsed.data.code, totpSecret);
  if (!isValid) {
    return NextResponse.json({ error: "Code ungültig oder abgelaufen." }, { status: 401 });
  }

  const token = await createSessionToken(pending.email);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7
  });
  // Zwischen-Cookie wird nicht mehr gebraucht.
  res.cookies.set(PENDING_2FA_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0
  });
  return res;
}
