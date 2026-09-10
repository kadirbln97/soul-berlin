import { prisma } from "./prisma";

/**
 * Speicherbegrenzung (Art. 5 Abs. 1 lit. e DSGVO) — setzt um, was Ziffer 10
 * der Datenschutzerklärung verspricht: 90 Tage nach dem Event verschwinden
 * die personenbezogenen Daten der Gäste.
 *
 * Zwei Wege, weil zwei Rechtslagen:
 *
 * - Gästelisten-Einträge und manuelle Promoter-Gäste (keine Zahlung) werden
 *   vollständig gelöscht. Es gibt nichts, was aufbewahrt werden müsste.
 *
 * - Online bezahlte Tickets (stripeSessionId gesetzt) unterliegen der
 *   Aufbewahrungspflicht für Buchungsbelege (§ 147 AO, § 257 HGB, bis zu
 *   zehn Jahre). Der Datensatz bleibt deshalb — aber anonymisiert: Name,
 *   E-Mail und Telefon werden durch Platzhalter ersetzt, Betrag, Gebühr,
 *   Zeitpunkt und Stripe-Referenz bleiben für die Buchhaltung. Aus dem
 *   Datensatz lässt sich danach keine Person mehr ermitteln, womit er im
 *   Sinne der DSGVO nicht mehr personenbezogen ist.
 *
 * Läuft täglich per Vercel Cron (vercel.json → /api/cron/cleanup).
 */

export const RETENTION_DAYS = 90;

// Bewusst keine leeren Strings: "name" und "email" sind Pflichtfelder, und
// ein erkennbar anonymisierter Wert ist in der Gästetabelle ehrlicher als
// eine leere Zelle, die wie ein Datenfehler aussieht.
export const ANONYMIZED_NAME = "Gelöscht (Aufbewahrungsfrist)";
export const ANONYMIZED_EMAIL = "geloescht@anonymisiert.invalid";

export function retentionCutoff(now = new Date()) {
  return new Date(now.getTime() - RETENTION_DAYS * 24 * 60 * 60 * 1000);
}

// Newsletter-Anmeldungen, die nie bestätigt wurden: nach 30 Tagen ist klar,
// dass die Bestätigung nicht mehr kommt. Die Adresse ohne Einwilligung
// weiter zu speichern, hätte keine Rechtsgrundlage.
export const PENDING_SUBSCRIBER_DAYS = 30;

export async function runRetentionCleanup(now = new Date()) {
  const cutoff = retentionCutoff(now);

  const stalePending = await prisma.newsletterSubscriber.deleteMany({
    where: {
      status: "PENDING",
      createdAt: { lt: new Date(now.getTime() - PENDING_SUBSCRIBER_DAYS * 24 * 60 * 60 * 1000) }
    }
  });

  // Nur Events, die lange genug vorbei sind. Maßgeblich ist der Beginn:
  // dateEnd ist optional und bei Partys ohnehin dieselbe Nacht.
  const expiredEvents = await prisma.event.findMany({
    where: { dateStart: { lt: cutoff } },
    select: { id: true }
  });
  const eventIds = expiredEvents.map((e) => e.id);

  if (eventIds.length === 0) {
    return { events: 0, deleted: 0, anonymized: 0, stalePending: stalePending.count, cutoff };
  }

  const [deleted, anonymized] = await prisma.$transaction([
    prisma.ticket.deleteMany({
      where: { eventId: { in: eventIds }, stripeSessionId: null }
    }),
    prisma.ticket.updateMany({
      where: {
        eventId: { in: eventIds },
        stripeSessionId: { not: null },
        // Schon anonymisierte Datensätze nicht jede Nacht neu anfassen —
        // sonst zählt die Statistik jeden Tag dieselben Tickets.
        NOT: { email: ANONYMIZED_EMAIL }
      },
      data: {
        name: ANONYMIZED_NAME,
        email: ANONYMIZED_EMAIL,
        phone: null,
        promoterName: null
      }
    })
  ]);

  return {
    events: eventIds.length,
    deleted: deleted.count,
    anonymized: anonymized.count,
    stalePending: stalePending.count,
    cutoff
  };
}
