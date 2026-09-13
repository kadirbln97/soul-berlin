import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { loginSchema } from "@/lib/validation";
import {
  createSessionToken,
  getAdminUsers,
  SESSION_COOKIE,
  SESSION_MAX_AGE_SECONDS
} from "@/lib/auth";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";
import { verifyTotp } from "@/lib/totp";

// TOTP braucht node:crypto — nicht im Edge-Runtime ausführen.
export const runtime = "nodejs";

export async function POST(req: Request) {
  // Brute-Force-Schutz: max. 8 Login-Versuche pro 10 Minuten pro IP.
  const ip = getClientIp(req);
  const rl = await checkRateLimit(`login:${ip}`, 8, 10 * 60_000);
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

  const { email, password, code } = parsed.data;

  // Zweite Bremse pro Konto: aus vielen IPs (Botnetz) ließe sich ein Konto
  // sonst weiter durchprobieren. 20 Fehlversuche pro Stunde reichen jedem
  // echten Menschen; ein Angreifer kommt damit nirgendwo hin.
  const rlUser = await checkRateLimit(`login-user:${email.toLowerCase()}`, 20, 60 * 60_000);
  if (!rlUser.allowed) {
    return NextResponse.json(
      { error: "Zu viele Login-Versuche für dieses Konto. Bitte in einer Stunde erneut versuchen." },
      { status: 429 }
    );
  }

  const users = getAdminUsers();
  if (users.length === 0) {
    return NextResponse.json(
      { error: "Admin-Zugang ist server-seitig nicht konfiguriert (.env)" },
      { status: 500 }
    );
  }

  // Passwort immer gegen einen Hash prüfen — auch bei unbekannter E-Mail
  // gegen den ersten. Sonst verrät die Antwortzeit, welche Adressen es gibt.
  const user = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  const passwordMatches = bcrypt.compareSync(password, (user ?? users[0]).passwordHash);

  // Zweiter Faktor: Einmalcode aus der Authenticator-App, sobald
  // ADMIN_TOTP_SECRET gesetzt ist. Wird zusammen mit dem Passwort geprüft und
  // mit derselben Fehlermeldung beantwortet — ein Angreifer erfährt so nicht,
  // ob das Passwort schon gestimmt hat.
  const totpSecret = process.env.ADMIN_TOTP_SECRET?.trim();
  const codeMatches = totpSecret ? verifyTotp(totpSecret, code ?? "") : true;

  if (!user || !passwordMatches || !codeMatches) {
    return NextResponse.json(
      {
        error: totpSecret
          ? "E-Mail, Passwort oder Einmalcode falsch"
          : "E-Mail oder Passwort falsch"
      },
      { status: 401 }
    );
  }

  const adminEmail = user.email;
  const token = await createSessionToken(adminEmail);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS
  });
  return res;
}
