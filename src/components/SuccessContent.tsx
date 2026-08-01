"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { getDict, DEFAULT_LOCALE, type Locale } from "@/lib/i18n";

type TicketInfo = {
  id: string;
  name: string;
  email: string;
  eventTitle: string;
};

/**
 * Interaktiver Teil der Success-Seite: fragt so lange nach, bis der
 * Stripe-Webhook das Ticket angelegt hat. Bewusst ohne Header/Footer — die
 * rendert die umschließende Server-Komponente, weil sie die Sprache aus den
 * Request-Headern liest und das in einer Client-Komponente nicht geht.
 */
export function SuccessContent({ locale = DEFAULT_LOCALE }: { locale?: Locale }) {
  return (
    <Suspense fallback={null}>
      <Inner locale={locale} />
    </Suspense>
  );
}

function Inner({ locale }: { locale: Locale }) {
  const t = getDict(locale).success;
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const [ticket, setTicket] = useState<TicketInfo | null>(null);
  const [ticketCount, setTicketCount] = useState(1);
  const [attempts, setAttempts] = useState(0);

  useEffect(() => {
    if (!sessionId) return;
    if (attempts > 15) return;

    const timer = setTimeout(async () => {
      const res = await fetch(`/api/tickets/by-session?session_id=${sessionId}`);
      const data = await res.json();
      if (data.ready) {
        setTicket(data.ticket);
        setTicketCount(data.ticketCount ?? 1);
      } else {
        setAttempts((a) => a + 1);
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, [sessionId, attempts, ticket]);

  if (!sessionId) {
    return <p className="text-paper/60">{t.noSession}</p>;
  }

  if (ticket) {
    return (
      <>
        <p className="text-display text-3xl uppercase text-soul-orange">{t.title}</p>
        <p className="text-paper/70">
          {t.thanks(ticket.name)}{" "}
          {ticketCount > 1 ? t.multiIntro(ticketCount) : t.singleIntro}{" "}
          <strong>{ticket.eventTitle}</strong> — <strong>{ticket.email}</strong>. {t.checkInbox}
        </p>
      </>
    );
  }

  return (
    <>
      <p className="text-display text-2xl uppercase text-paper">{t.confirming}</p>
      <p className="text-paper/50">{t.confirmingText}</p>
      <div className="h-1 w-40 overflow-hidden rounded-full bg-paper/10">
        <div className="h-full w-1/3 animate-pulse bg-soul-orange" />
      </div>
    </>
  );
}
