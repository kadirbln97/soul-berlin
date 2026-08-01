import nodemailer from "nodemailer";
import { ticketQrBuffer } from "./qr";
import { formatEventDate } from "./format";
import { escapeHtml } from "./escapeHtml";
import { getContactRecipient } from "./siteContent";

function getTransport() {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    throw new Error(
      "SMTP-Zugangsdaten fehlen in .env (SMTP_HOST/SMTP_USER/SMTP_PASS) — E-Mail-Versand kann nicht funktionieren."
    );
  }
  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT ?? 587),
    secure: Number(SMTP_PORT ?? 587) === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS }
  });
}

export async function sendTicketEmail(params: {
  to: string;
  name: string;
  ticketId: string;
  eventTitle: string;
  eventDateStart: Date;
  eventVenue: string;
  eventAddress?: string | null;
  isPaid: boolean;
  // true bei kostenpflichtigen Gästelisten-Staffeln — Preis ist nur eine Info,
  // Zahlung erfolgt an der Abendkasse (kein Online-Payment).
  isDoorPrice?: boolean;
  amountCents?: number | null;
  /** Servicegebühr bei Online-Käufen — wird in der Mail aufgeschlüsselt. */
  feeCents?: number | null;
}) {
  const qr = await ticketQrBuffer(params.ticketId);
  const transport = getTransport();
  const from = process.env.SMTP_FROM ?? "SØUL Berlin <no-reply@soul-berlin.example>";

  // Nutzereingaben (Name) vor dem Einbetten in HTML escapen — verhindert
  // HTML/Markup-Injection im E-Mail-Client.
  const safeName = escapeHtml(params.name);
  const safeEventTitle = escapeHtml(params.eventTitle);
  const safeVenue = escapeHtml(params.eventVenue);
  const safeAddress = params.eventAddress ? escapeHtml(params.eventAddress) : null;

  const feeCents = params.feeCents ?? 0;
  const priceLine = params.isPaid
    ? `<p style="margin:0 0 4px;color:#f5f3ee;opacity:.7;font-size:14px;">Ticket: ${(
        (params.amountCents ?? 0) / 100
      ).toFixed(2)} €</p>${
        feeCents > 0
          ? `<p style="margin:0 0 4px;color:#f5f3ee;opacity:.7;font-size:14px;">Servicegebühr: ${(
              feeCents / 100
            ).toFixed(2)} €</p>`
          : ""
      }<p style="margin:0 0 4px;color:#f5f3ee;font-size:14px;"><strong>Bezahlt: ${(
        ((params.amountCents ?? 0) + feeCents) / 100
      ).toFixed(2)} €</strong></p>`
    : params.isDoorPrice && params.amountCents
      ? `<p style="margin:0 0 4px;color:#f5f3ee;opacity:.7;font-size:14px;">Preis an der Abendkasse: ${(
          params.amountCents / 100
        ).toFixed(2)} € (keine Online-Zahlung nötig)</p>`
      : "";

  const html = `
  <div style="background:#0a0a0a;padding:32px 16px;font-family:Arial,Helvetica,sans-serif;">
    <div style="max-width:480px;margin:0 auto;background:#111111;border:1px solid #262626;border-radius:16px;overflow:hidden;">
      <div style="padding:28px 28px 0;">
        <p style="color:#ff6a1a;letter-spacing:.2em;font-size:12px;font-weight:bold;margin:0 0 4px;">SØUL BERLIN</p>
        <h1 style="color:#f5f3ee;font-size:24px;margin:0 0 4px;">${safeEventTitle}</h1>
        <p style="color:#f5f3ee;opacity:.7;font-size:14px;margin:0 0 2px;">${formatEventDate(
          params.eventDateStart
        )}</p>
        <p style="color:#f5f3ee;opacity:.7;font-size:14px;margin:0 0 20px;">${safeVenue}${
    safeAddress ? " · " + safeAddress : ""
  }</p>
      </div>
      <div style="background:#f5f3ee;padding:24px;text-align:center;">
        <img src="cid:ticketqr" alt="QR Code" width="240" height="240" style="display:block;margin:0 auto;" />
        <p style="color:#0a0a0a;font-size:12px;letter-spacing:.05em;margin:12px 0 0;">Ticket-ID: ${
          params.ticketId
        }</p>
      </div>
      <div style="padding:24px 28px 28px;">
        <p style="color:#f5f3ee;margin:0 0 4px;">Hi ${safeName},</p>
        <p style="color:#f5f3ee;opacity:.8;font-size:14px;line-height:1.6;margin:0 0 12px;">
          hier ist dein Ticket. Zeig einfach diesen QR-Code am Einlass — er wird gescannt und ist
          nur einmal gültig.
        </p>
        ${priceLine}
        <p style="color:#f5f3ee;opacity:.5;font-size:12px;margin:16px 0 0;">
          Good people. Good music. — SØUL Berlin
        </p>
      </div>
    </div>
  </div>`;

  await transport.sendMail({
    from,
    to: params.to,
    subject: `Dein Ticket · ${params.eventTitle}`,
    html,
    attachments: [
      {
        filename: "ticket-qr.png",
        content: qr,
        cid: "ticketqr"
      }
    ]
  });
}

const TOPIC_LABEL: Record<string, string> = {
  general: "Allgemeine Anfrage",
  bug: "Bug-Report",
  feature: "Feature-Wunsch",
  refund: "Ticket-Rückerstattung"
};

/**
 * Sendet eine Kontaktformular-Anfrage an die im Admin-Bereich hinterlegte
 * Empfängeradresse (/admin/homepage → Kontakt), ersatzweise an CONTACT_EMAIL
 * bzw. die Admin-Login-Adresse.
 */
export async function sendContactEmail(params: {
  name: string;
  email: string;
  topic: string;
  message: string;
  /** Nur bei Rückerstattungs-Anfragen: Ticket-Nummer und Event des Gastes. */
  ticketRef?: string;
  eventName?: string;
}) {
  const to = await getContactRecipient();
  if (!to) {
    throw new Error(
      "Keine Empfängeradresse gesetzt — Kontaktformular kann nicht zugestellt werden. " +
        "Im Admin-Bereich unter Startseite → Kontakt eintragen."
    );
  }

  const transport = getTransport();
  const from = process.env.SMTP_FROM ?? "SØUL Berlin <no-reply@soul-berlin.example>";

  const safeName = escapeHtml(params.name);
  const safeEmail = escapeHtml(params.email);
  const safeMessage = escapeHtml(params.message).replace(/\n/g, "<br/>");
  const topicLabel = TOPIC_LABEL[params.topic] ?? params.topic;

  // Bei Rückerstattungs-Anfragen die Ticket-Angaben deutlich hervorheben,
  // damit das Ticket im Admin-Bereich schnell gefunden werden kann.
  const ticketRows = [
    params.ticketRef ? ["Ticket-Nr.", params.ticketRef] : null,
    params.eventName ? ["Event", params.eventName] : null
  ].filter(Boolean) as [string, string][];

  const ticketBlock = ticketRows.length
    ? `<div style="margin:16px 0 0;padding:12px 14px;border:1px solid #ff6a1a55;border-radius:10px;background:#ff6a1a12;">
         ${ticketRows
           .map(
             ([k, v]) =>
               `<p style="color:#f5f3ee;margin:0 0 2px;font-size:14px;"><strong>${escapeHtml(
                 k
               )}:</strong> ${escapeHtml(v)}</p>`
           )
           .join("")}
       </div>`
    : "";

  const html = `
  <div style="background:#0a0a0a;padding:32px 16px;font-family:Arial,Helvetica,sans-serif;">
    <div style="max-width:520px;margin:0 auto;background:#111111;border:1px solid #262626;border-radius:16px;padding:28px;">
      <p style="color:#ff6a1a;letter-spacing:.2em;font-size:12px;font-weight:bold;margin:0 0 12px;">
        KONTAKTFORMULAR · ${escapeHtml(topicLabel)}
      </p>
      <p style="color:#f5f3ee;margin:0 0 4px;"><strong>Von:</strong> ${safeName} (${safeEmail})</p>
      ${ticketBlock}
      <p style="color:#f5f3ee;opacity:.85;font-size:14px;line-height:1.6;margin:16px 0 0;">${safeMessage}</p>
    </div>
  </div>`;

  await transport.sendMail({
    from,
    to,
    replyTo: params.email,
    subject: `[${topicLabel}] Neue Nachricht von ${params.name}`,
    html
  });
}
