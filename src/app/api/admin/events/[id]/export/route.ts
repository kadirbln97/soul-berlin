import { NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/authGuard";

const STATUS_LABEL: Record<string, string> = {
  VALID: "Gültig",
  CHECKED_IN: "Eingecheckt",
  REFUNDED: "Erstattet",
  CANCELLED: "Storniert"
};

/**
 * Exportiert die komplette Gästeliste/Tickets eines Events als .xlsx —
 * jederzeit im Admin-Bereich abrufbar (z.B. für die Tür-Crew ausdruckbar).
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Nicht eingeloggt" }, { status: 401 });
  }

  const event = await prisma.event.findUnique({ where: { id } });
  if (!event) {
    return NextResponse.json({ error: "Event nicht gefunden" }, { status: 404 });
  }

  const tickets = await prisma.ticket.findMany({
    where: { eventId: event.id },
    orderBy: { createdAt: "asc" }
  });

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "SØUL Berlin Admin";
  workbook.created = new Date();

  const sheet = workbook.addWorksheet("Gästeliste", {
    views: [{ state: "frozen", ySplit: 1 }]
  });

  sheet.columns = [
    { header: "Name", key: "name", width: 26 },
    // Direkt hinter dem Namen: die Tür-Crew liest die Liste von links nach
    // rechts und muss sofort sehen, für wie viele Personen der Eintrag gilt.
    { header: "Personen", key: "partySize", width: 10 },
    { header: "E-Mail", key: "email", width: 30 },
    { header: "Telefon", key: "phone", width: 18 },
    { header: "Kategorie", key: "tierLabel", width: 18 },
    { header: "Status", key: "status", width: 14 },
    { header: "Betrag (€)", key: "amount", width: 12 },
    { header: "Zahlungsart", key: "paymentType", width: 16 },
    { header: "Eingecheckt am", key: "checkedInAt", width: 20 },
    { header: "Angemeldet am", key: "createdAt", width: 20 },
    { header: "E-Mail versendet", key: "emailSentAt", width: 16 },
    { header: "Ticket-ID", key: "id", width: 28 }
  ];
  sheet.getRow(1).font = { bold: true };

  // Alle Zeitangaben explizit in Europe/Berlin formatieren — Server laufen
  // intern auf UTC, ohne das würden die Uhrzeiten in der Tabelle verschoben sein.
  const fmt = new Intl.DateTimeFormat("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Berlin"
  });

  for (const t of tickets) {
    sheet.addRow({
      name: t.name,
      partySize: t.partySize,
      email: t.email,
      phone: t.phone ?? "",
      tierLabel: t.tierLabel ?? "",
      status: STATUS_LABEL[t.status] ?? t.status,
      amount: t.amountCents ? (t.amountCents / 100).toFixed(2) : "",
      paymentType: t.amountCents
        ? t.stripePaymentIntentId
          ? "Online (Stripe)"
          : "Abendkasse"
        : "Kostenlos",
      checkedInAt: t.checkedInAt ? fmt.format(t.checkedInAt) : "",
      createdAt: fmt.format(t.createdAt),
      emailSentAt: t.emailSentAt ? "Ja" : "Nein",
      id: t.id
    });
  }

  const buffer = await workbook.xlsx.writeBuffer();

  const safeSlug = event.slug.replace(/[^a-z0-9-]/gi, "");
  const filename = `gaesteliste-${safeSlug}.xlsx`;

  return new NextResponse(buffer as unknown as ArrayBuffer, {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`
    }
  });
}
