import { NextResponse } from "next/server";
import { buildUnsubscribeToken } from "@/lib/newsletterTokens";
import { csvRow } from "@/lib/csv";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/authGuard";

/**
 * Exportiert die versandfähigen Empfänger als CSV — zum Import in das
 * Mailprogramm, mit dem der Newsletter tatsächlich verschickt wird.
 *
 * Bewusst nur Einträge mit Status ACTIVE: PENDING heißt, dass der
 * Bestätigungsklick fehlt, und an diese Adressen darf nichts rausgehen.
 * Die Spalte "Grundlage" wandert mit, weil sie bestimmt, was verschickt
 * werden darf — Bestandskunden nur eigene ähnliche Veranstaltungen.
 */
export async function GET() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Nicht eingeloggt" }, { status: 401 });
  }

  const empfaenger = await prisma.newsletterSubscriber.findMany({
    where: { status: "ACTIVE" },
    orderBy: { createdAt: "asc" },
    select: {
      email: true,
      name: true,
      source: true,
      consentAt: true,
      confirmedAt: true,
      createdAt: true,
      id: true
    }
  });

  const fmt = new Intl.DateTimeFormat("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Berlin"
  });

  const appUrl = (process.env.APP_URL ?? "https://soulberlin.de").replace(/\/$/, "");

  // Semikolon als Trennzeichen (Excel im Deutschen) und jedes Feld über
  // csvRow entschärft — Namen kommen aus einem öffentlichen Formular und
  // dürfen beim Öffnen der Datei keine Formel werden (siehe lib/csv.ts).
  const zeilen = [
    csvRow(["E-Mail", "Name", "Grundlage", "Eingewilligt am", "Bestätigt am", "Abmeldelink"]),
    ...empfaenger.map((e) =>
      csvRow([
        e.email,
        e.name ?? "",
        e.source === "CONSENT" ? "Einwilligung" : "Bestandskunde (§ 7 Abs. 3 UWG)",
        e.consentAt ? fmt.format(e.consentAt) : "",
        e.confirmedAt ? fmt.format(e.confirmedAt) : "",
        `${appUrl}/newsletter/abmelden?token=${buildUnsubscribeToken(e.id)}`
      ])
    )
  ];

  // BOM voran, sonst zeigt Excel Umlaute als Buchstabensalat.
  const csv = "﻿" + zeilen.join("\r\n");

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="soul-newsletter.csv"'
    }
  });
}
