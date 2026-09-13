import { NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/auth";

function clearSessionCookie(res: NextResponse) {
  // Gleiche Attribute wie beim Setzen — sonst löscht der Browser ein
  // "__Host-"-Cookie nicht.
  res.cookies.set(SESSION_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0
  });
  return res;
}

export async function POST() {
  return clearSessionCookie(NextResponse.json({ ok: true }));
}
