"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

type TicketInfo = {
  id: string;
  name: string;
  email: string;
  eventTitle: string;
};

export default function SuccessPage() {
  return (
    <Suspense fallback={null}>
      <SuccessContent />
    </Suspense>
  );
}

function SuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const [ticket, setTicket] = useState<TicketInfo | null>(null);
  const [attempts, setAttempts] = useState(0);

  useEffect(() => {
    if (!sessionId) return;
    if (attempts > 15) return;

    const timer = setTimeout(async () => {
      const res = await fetch(`/api/tickets/by-session?session_id=${sessionId}`);
      const data = await res.json();
      if (data.ready) {
        setTicket(data.ticket);
      } else {
        setAttempts((a) => a + 1);
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, [sessionId, attempts, ticket]);

  return (
    <>
      <Header />
      <main id="main-content" className="mx-auto flex max-w-xl flex-col items-center gap-6 px-5 py-24 text-center">
        {!sessionId ? (
          <p className="text-paper/60">Keine gültige Zahlungssitzung gefunden.</p>
        ) : ticket ? (
          <>
            <p className="text-display text-3xl uppercase text-soul-orange">
              Zahlung erfolgreich 🎉
            </p>
            <p className="text-paper/70">
              Danke, {ticket.name}! Dein Ticket für <strong>{ticket.eventTitle}</strong> ist
              unterwegs an <strong>{ticket.email}</strong> — check deinen Posteingang (ggf. auch
              Spam) für den QR-Code.
            </p>
          </>
        ) : (
          <>
            <p className="text-display text-2xl uppercase text-paper">
              Zahlung wird bestätigt …
            </p>
            <p className="text-paper/50">
              Einen Moment, wir stellen dein Ticket aus. Diese Seite aktualisiert sich
              automatisch.
            </p>
            <div className="h-1 w-40 overflow-hidden rounded-full bg-paper/10">
              <div className="h-full w-1/3 animate-pulse bg-soul-orange" />
            </div>
          </>
        )}
      </main>
      <Footer />
    </>
  );
}
