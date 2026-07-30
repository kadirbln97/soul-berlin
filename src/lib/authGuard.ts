import { cookies } from "next/headers";
import { SESSION_COOKIE, verifySessionToken } from "./auth";

/** Server-seitiger Helfer: gibt die Session zurück oder null, wenn nicht eingeloggt. */
export async function getAdminSession() {
  const token = cookies().get(SESSION_COOKIE)?.value;
  return verifySessionToken(token);
}
