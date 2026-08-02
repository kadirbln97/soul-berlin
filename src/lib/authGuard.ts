import { cookies } from "next/headers";
import { SESSION_COOKIE, verifySessionToken } from "./auth";

/** Server-seitiger Helfer: gibt die Session zurück oder null, wenn nicht eingeloggt. */
export async function getAdminSession() {
  // Seit Next.js 15 ist cookies() asynchron.
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  return verifySessionToken(token);
}
