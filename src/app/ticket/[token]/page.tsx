import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { verifyTicketToken } from "@/lib/ticketToken";
import { ticketQrDataUrl } from "@/lib/qr";
import { formatEventDate } from "@/lib/format";
import { getTranslations, pickText } from "@/lib/serverLocale";

export const dynamic = "force-dynamic";

/**
 * Diese Seite darf niemals in einer Suchmaschine landen — die Adresse ist der
 * Ticket-Zugang. Zusätzlich zur robots.txt hier explizit noindex.
 */
export const metadata: Metadata = {
  robots: { index: false, follow: false, nocache: true }
};

/**
 * Dauerhafte Ticket-Seite. Die Bestätigungsmail verlinkt hierher, damit Gäste
 * an der Tür nicht erst ihr Postfach durchsuchen müssen — die Seite lässt sich
 * auf dem Startbildschirm ablegen und ist dann einen Fingertipp entfernt.
 *
 * Sicherheit: Die Adresse enthält dasselbe HMAC-signierte Token wie der
 * QR-Code. Ohne gültige Signatur ist die Seite nicht erreichbar; Ticket-IDs
 * lassen sich also nicht durchprobieren.
 */
export default async function TicketPage({
  params
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const { valid, ticketId } = verifyTicketToken(decodeURIComponent(token));
  if (!valid || !ticketId) notFound();

  const ticket = await prisma.ticket.findUnique({
    where: { id: ticketId },
    include: { event: true }
  });
  if (!ticket) notFound();

  const { locale, t } = await getTranslations();
  const qr = await ticketQrDataUrl(ticket.id);

  const eventTitle = pickText(locale, ticket.event.title, ticket.event.titleEn);
  const isCheckedIn = ticket.status === "CHECKED_IN";
  const isDead = ticket.status === "REFUNDED" || ticket.status === "CANCELLED";

  const statusLabel = isDead
    ? t.ticket.statusInvalid
    : isCheckedIn
      ? t.ticket.statusCheckedIn
      : t.ticket.statusValid;

  return (
    <main
      id="main-content"
      className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-6 px-5 py-10"
    >
      <div className="overflow-hidden rounded-3xl card-border bg-white/[0.03]">
        <div className="px-6 pt-6">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-soul-orange">
            SØUL Berlin
          </p>
          <h1 className="text-display mt-1 text-2xl uppercase leading-tight text-paper">
            {eventTitle}
          </h1>
          <p className="mt-1 text-sm text-paper/80">
            {formatEventDate(ticket.event.dateStart)}
          </p>
          <p className="text-sm text-paper/70">
            {ticket.event.venue}
            {ticket.event.address ? ` · ${ticket.event.address}` : ""}
          </p>
        </div>

        {/* Heller Block hinter dem Code: Scanner tun sich mit dunklen
            Displays schwer, und viele Handys dimmen dunkle Bilder zusätzlich. */}
        <div className="mt-6 bg-paper px-6 py-7 text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={qr}
            alt={t.ticket.heading}
            width={480}
            height={480}
            className={`mx-auto h-auto w-full max-w-[280px] ${isDead ? "opacity-25" : ""}`}
          />
          <p className="mt-3 text-[11px] uppercase tracking-widest text-ink/60">
            {t.email.ticketId}: {ticket.id}
          </p>
        </div>

        <div className="px-6 pb-6 pt-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-widest text-paper/75">
                {t.ticket.guest}
              </p>
              <p className="text-paper">{ticket.name}</p>
            </div>
            <span
              className={`rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-widest ${
                isDead
                  ? "bg-red-500/20 text-red-300"
                  : isCheckedIn
                    ? "bg-paper/15 text-paper/80"
                    : "bg-soul-orange/20 text-soul-orange"
              }`}
            >
              {statusLabel}
            </span>
          </div>

          {!isDead && (
            <p className="mt-4 border-t border-paper/10 pt-4 text-sm leading-relaxed text-paper/75">
              {t.ticket.intro}
            </p>
          )}
        </div>
      </div>

      <p className="text-center text-xs leading-relaxed text-paper/75">{t.ticket.saveTip}</p>
    </main>
  );
}
