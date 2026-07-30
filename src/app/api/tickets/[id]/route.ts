import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/authGuard";

/**
 * DSGVO Art. 17 — Recht auf Löschung.
 * Löscht den Ticket-Datensatz (Name, E-Mail, Telefon) vollständig aus der
 * Datenbank. Anders als "Stornieren/Erstatten" (Ticket bleibt als Datensatz
 * erhalten, wird aber entwertet), entfernt dies die personenbezogenen Daten
 * komplett — z.B. auf Anfrage eines Gasts nach dem Event.
 */
export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Nicht eingeloggt" }, { status: 401 });
  }

  const ticket = await prisma.ticket.findUnique({ where: { id: params.id } });
  if (!ticket) {
    return NextResponse.json({ error: "Ticket nicht gefunden" }, { status: 404 });
  }

  await prisma.ticket.delete({ where: { id: params.id } });

  return NextResponse.json({ ok: true });
}
