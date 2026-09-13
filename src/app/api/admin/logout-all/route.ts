import { NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/auth";
import { getAdminSession, invalidateAllSessions } from "@/lib/authGuard";

/**
 * "Überall abmelden": entwertet alle Admin-Sitzungen auf allen Geräten —
 * auch die eigene. Für den Fall, dass ein Handy verloren geht oder ein
 * Cookie in falsche Hände geraten sein könnte.
 */
export async function POST() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Nicht eingeloggt" }, { status: 401 });
  }

  await invalidateAllSessions();
  console.log(`[admin] Alle Sitzungen entwertet durch ${session.email}`);

  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0
  });
  return res;
}
