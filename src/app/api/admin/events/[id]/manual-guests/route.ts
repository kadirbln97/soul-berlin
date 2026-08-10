import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/authGuard";
import { manualGuestsSchema } from "@/lib/validation";
import { parseGuestLines, countPeople } from "@/lib/parseGuestLine";

const MAX_NAMES_PER_REQUEST = 500;

/**
 * Trägt Gäste manuell auf die Gästeliste ein — gedacht für Namenslisten, die
 * Promoter per Nachricht schicken. Ein Name pro Zeile.
 *
 * Begleitpersonen dürfen wie gewohnt hinter den Namen geschrieben werden
 * ("Max Mustermann +2"): daraus wird ein Eintrag, der an der Tür mit einem
 * Klick für die ganze Gruppe eingecheckt wird und in allen Zählungen mit
 * drei Personen statt mit einer zu Buche schlägt.
 *
 * Diese Gäste bekommen bewusst keine E-Mail und keinen QR-Code: sie werden an
 * der Tür über die Namenssuche im Scanner eingecheckt.
 */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Nicht eingeloggt" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = manualGuestsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Ungültige Eingabe" },
      { status: 400 }
    );
  }

  const event = await prisma.event.findUnique({ where: { id } });
  if (!event) {
    return NextResponse.json({ error: "Event nicht gefunden" }, { status: 404 });
  }

  const guests = parseGuestLines(parsed.data.names);

  if (guests.length === 0) {
    return NextResponse.json(
      { error: "Keine verwertbaren Namen gefunden (mindestens 2 Zeichen pro Zeile)." },
      { status: 400 }
    );
  }

  if (guests.length > MAX_NAMES_PER_REQUEST) {
    return NextResponse.json(
      { error: `Bitte höchstens ${MAX_NAMES_PER_REQUEST} Namen auf einmal einfügen.` },
      { status: 400 }
    );
  }

  const promoterName = parsed.data.promoterName?.trim() || null;
  const tierLabel = parsed.data.tierLabel?.trim() || null;

  await prisma.ticket.createMany({
    data: guests.map((guest) => ({
      eventId: event.id,
      name: guest.name.slice(0, 100),
      partySize: guest.partySize,
      email: "",
      isManual: true,
      promoterName,
      tierLabel,
      currency: event.currency,
      status: "VALID"
    }))
  });

  // added = Zeilen, people = tatsächliche Personenzahl inklusive Begleitung.
  // Beides zurückgeben, damit die Rückmeldung im Admin ehrlich zeigt, was
  // gerade auf der Liste gelandet ist ("4 Einträge · 9 Gäste").
  return NextResponse.json({
    ok: true,
    added: guests.length,
    people: countPeople(guests)
  });
}
