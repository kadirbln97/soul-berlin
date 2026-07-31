import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { loginSchema } from "@/lib/validation";
import { createPendingTwoFactorToken, PENDING_2FA_COOKIE } from "@/lib/auth";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";

export async function POST(req: Request) {
  // Brute-Force-Schutz: max. 8 Login-Versuche pro 10 Minuten pro IP.
  const ip = getClientIp(req);
  const rl = checkRateLimit(`login:${ip}`, 8, 10 * 60_000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Zu viele Login-Versuche. Bitte in ein paar Minuten erneut versuchen." },
      { status: 429 }
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Bitte E-Mail und Passwort angeben" }, { status: 400 });
  }

  const { email, password } = parsed.data;

  const adminEmail = process.env.ADMIN_EMAIL;
  const adminHash = process.env.ADMIN_PASSWORD_HASH;
  const totpSecret = process.env.ADMIN_TOTP_SECRET;

  if (!adminEmail || !adminHash) {
    return NextResponse.json(
      { error: "Admin-Zugang ist server-seitig nicht konfiguriert (.env)" },
      { status: 500 }
    );
  }

  // Fail-closed: ohne eingerichtete 2FA bleibt der Admin-Login komplett
  // gesperrt, statt (unsicher) auf reines Passwort zurückzufallen. Einrichten
  // mit: npm run generate-2fa-secret -- deine@email.de
  if (!totpSecret) {
    return NextResponse.json(
      {
        error:
          "Zwei-Faktor-Authentifizierung ist noch nicht eingerichtet (ADMIN_TOTP_SECRET fehlt). Admin-Login ist bis dahin gesperrt."
      },
      { status: 500 }
    );
  }

  const emailMatches = email.toLowerCase() === adminEmail.toLowerCase();
  const passwordMatches = bcrypt.compareSync(password, adminHash);

  if (!emailMatches || !passwordMatches) {
    return NextResponse.json({ error: "E-Mail oder Passwort falsch" }, { status: 401 });
  }

  // Passwort korrekt — aber noch keine volle Session. Erst nach dem korrekten
  // 6-stelligen Code aus der Authenticator-App (siehe verify-2fa/route.ts)
  // wird das echte Session-Cookie gesetzt.
  const pendingToken = await createPendingTwoFactorToken(adminEmail);
  const res = NextResponse.json({ ok: true, requires2FA: true });
  res.cookies.set(PENDING_2FA_COOKIE, pendingToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 5
  });
  return res;
}
