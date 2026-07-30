import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { loginSchema } from "@/lib/validation";
import { createSessionToken, SESSION_COOKIE } from "@/lib/auth";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Bitte E-Mail und Passwort angeben" }, { status: 400 });
  }

  const { email, password } = parsed.data;

  const adminEmail = process.env.ADMIN_EMAIL;
  const adminHash = process.env.ADMIN_PASSWORD_HASH;

  if (!adminEmail || !adminHash) {
    return NextResponse.json(
      { error: "Admin-Zugang ist server-seitig nicht konfiguriert (.env)" },
      { status: 500 }
    );
  }

  const emailMatches = email.toLowerCase() === adminEmail.toLowerCase();
  const passwordMatches = bcrypt.compareSync(password, adminHash);

  if (!emailMatches || !passwordMatches) {
    return NextResponse.json({ error: "E-Mail oder Passwort falsch" }, { status: 401 });
  }

  const token = await createSessionToken(adminEmail);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7
  });
  return res;
}
