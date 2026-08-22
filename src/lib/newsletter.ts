import { randomBytes } from "crypto";
import { prisma } from "./prisma";

/**
 * Newsletter-Verwaltung mit zwei sauber getrennten Rechtsgrundlagen.
 *
 * Warum diese Trennung so wichtig ist: Wer aus einem Ticketkauf auf der Liste
 * landet (§ 7 Abs. 3 UWG), darf nur Werbung für eigene ähnliche
 * Veranstaltungen bekommen. Wer per Häkchen eingewilligt hat, darf breiter
 * angeschrieben werden. Würde beides in einem Topf landen, gälte am Ende für
 * alle die engere Grenze — oder man verstößt dagegen, ohne es zu merken.
 */

/** Kryptografisch sicherer Token — nicht erratbar, nicht hochzählbar. */
function neuerToken() {
  return randomBytes(32).toString("base64url");
}

/**
 * Trägt eine Adresse nach ausdrücklicher Einwilligung ein (Häkchen bei der
 * Gästeliste). Der Eintrag bleibt so lange PENDING, bis der Link aus der
 * Bestätigungsmail geklickt wurde — vorher darf keine Werbung rausgehen.
 *
 * @returns Der Bestätigungstoken, wenn eine Mail verschickt werden soll;
 *          null, wenn nichts zu tun ist (bereits aktiv).
 */
export async function einwilligungErfassen(params: {
  email: string;
  name?: string | null;
  ip?: string | null;
}): Promise<string | null> {
  const email = params.email.trim().toLowerCase();
  if (!email) return null;

  const vorhanden = await prisma.newsletterSubscriber.findUnique({ where: { email } });

  // Schon bestätigt: keine zweite Mail. Sonst wäre eine fremde Adresse per
  // wiederholter Anmeldung mit Bestätigungsmails zuzumüllen.
  if (vorhanden?.status === "ACTIVE" && vorhanden.source === "CONSENT") {
    return null;
  }

  const confirmToken = neuerToken();

  await prisma.newsletterSubscriber.upsert({
    where: { email },
    create: {
      email,
      name: params.name?.trim() || null,
      source: "CONSENT",
      status: "PENDING",
      consentAt: new Date(),
      consentIp: params.ip ?? null,
      confirmToken,
      unsubscribeToken: neuerToken()
    },
    update: {
      // Auch ein früher abgemeldeter Kontakt darf sich erneut anmelden —
      // dann beginnt der Double-Opt-in von vorn.
      name: params.name?.trim() || vorhanden?.name || null,
      source: "CONSENT",
      status: "PENDING",
      consentAt: new Date(),
      consentIp: params.ip ?? null,
      confirmToken,
      unsubscribedAt: null
    }
  });

  return confirmToken;
}

/**
 * Nimmt einen Ticketkäufer als Bestandskunden auf (§ 7 Abs. 3 UWG).
 *
 * Kein Double-Opt-in, weil hier keine Einwilligung vorliegt, die zu bestätigen
 * wäre — die Erlaubnis folgt aus dem Kauf. Dafür sind zwei Hinweise Pflicht,
 * die an anderer Stelle umgesetzt sind: beim Kauf (SignupForm) und in jeder
 * versendeten Mail (Abmeldelink + Hinweistext).
 *
 * Wer bereits ausdrücklich eingewilligt hat, behält diesen Status — die
 * Einwilligung ist die weiter reichende Grundlage und darf nicht durch die
 * engere Bestandskundenregel überschrieben werden.
 */
export async function bestandskundeErfassen(params: {
  email: string;
  name?: string | null;
}): Promise<void> {
  const email = params.email.trim().toLowerCase();
  if (!email) return;

  const vorhanden = await prisma.newsletterSubscriber.findUnique({ where: { email } });

  // Ein Widerspruch wiegt schwerer als ein neuer Kauf: Wer sich abgemeldet
  // hat, landet nicht durch das nächste Ticket wieder auf der Liste.
  if (vorhanden?.status === "UNSUBSCRIBED") return;

  if (vorhanden) {
    await prisma.newsletterSubscriber.update({
      where: { email },
      data: { name: vorhanden.name ?? params.name?.trim() ?? null }
    });
    return;
  }

  await prisma.newsletterSubscriber.create({
    data: {
      email,
      name: params.name?.trim() || null,
      source: "CUSTOMER",
      status: "ACTIVE",
      unsubscribeToken: neuerToken()
    }
  });
}

/** Bestätigt eine Einwilligung über den Link aus der Double-Opt-in-Mail. */
export async function einwilligungBestaetigen(params: {
  token: string;
  ip?: string | null;
}): Promise<{ ok: boolean; email?: string }> {
  const eintrag = await prisma.newsletterSubscriber.findUnique({
    where: { confirmToken: params.token }
  });

  if (!eintrag) return { ok: false };

  await prisma.newsletterSubscriber.update({
    where: { id: eintrag.id },
    data: {
      status: "ACTIVE",
      confirmedAt: new Date(),
      confirmedIp: params.ip ?? null,
      // Token entwerten, damit der Link kein zweites Mal greift.
      confirmToken: null
    }
  });

  return { ok: true, email: eintrag.email };
}

/**
 * Abmeldung über den Link aus einer E-Mail. Funktioniert bewusst ohne Login
 * und ohne Rückfrage: Werbung abzustellen muss mit einem Klick gehen.
 */
export async function abmelden(token: string): Promise<{ ok: boolean; email?: string }> {
  const eintrag = await prisma.newsletterSubscriber.findUnique({
    where: { unsubscribeToken: token }
  });

  if (!eintrag) return { ok: false };

  if (eintrag.status === "UNSUBSCRIBED") {
    // Schon abgemeldet — für den Nutzer trotzdem ein Erfolg.
    return { ok: true, email: eintrag.email };
  }

  await prisma.newsletterSubscriber.update({
    where: { id: eintrag.id },
    data: {
      status: "UNSUBSCRIBED",
      unsubscribedAt: new Date(),
      confirmToken: null
    }
  });

  return { ok: true, email: eintrag.email };
}
