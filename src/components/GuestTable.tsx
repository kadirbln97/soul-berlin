"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { formatEventDate, formatPrice } from "@/lib/format";

type Ticket = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  status: string;
  amountCents: number | null;
  currency: string;
  // War es eine echte Online-Zahlung über Stripe? (im Unterschied zu einem
  // informativen Abendkassen-Preis bei gestaffelten Gästelisten)
  isPaidOnline: boolean;
  checkedInAt: string | null;
  createdAt: string;
};

const STATUS_LABEL: Record<string, string> = {
  VALID: "Gültig",
  CHECKED_IN: "Eingecheckt",
  REFUNDED: "Erstattet",
  CANCELLED: "Storniert"
};

const STATUS_STYLE: Record<string, string> = {
  VALID: "bg-soul-orange/20 text-soul-orange",
  CHECKED_IN: "bg-green-500/20 text-green-400",
  REFUNDED: "bg-paper/10 text-paper/40",
  CANCELLED: "bg-paper/10 text-paper/40"
};

export function GuestTable({ tickets }: { tickets: Ticket[] }) {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleErasure(ticket: Ticket) {
    const confirmed = window.confirm(
      `Alle personenbezogenen Daten von ${ticket.name} unwiderruflich löschen (DSGVO Art. 17)?\n\nDas entfernt den kompletten Datensatz (Name, E-Mail, Telefon) aus der Datenbank — nicht nur eine Stornierung. Kann nicht rückgängig gemacht werden.`
    );
    if (!confirmed) return;

    setLoadingId(ticket.id);
    setError(null);

    const res = await fetch(`/api/tickets/${ticket.id}`, { method: "DELETE" });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Löschen fehlgeschlagen.");
      setLoadingId(null);
      return;
    }

    setLoadingId(null);
    router.refresh();
  }

  async function handleRefund(ticket: Ticket) {
    const confirmed = window.confirm(
      ticket.isPaidOnline
        ? `Ticket von ${ticket.name} stornieren und über Stripe zurückerstatten?`
        : `Ticket von ${ticket.name} stornieren (kein Einlass mehr möglich)?`
    );
    if (!confirmed) return;

    setLoadingId(ticket.id);
    setError(null);

    const res = await fetch(`/api/tickets/${ticket.id}/refund`, { method: "POST" });
    const data = await res.json();

    if (!res.ok) {
      setError(data.error ?? "Stornierung fehlgeschlagen.");
      setLoadingId(null);
      return;
    }

    setLoadingId(null);
    router.refresh();
  }

  if (tickets.length === 0) {
    return (
      <p className="rounded-2xl card-border p-8 text-center text-paper/50">
        Noch keine Anmeldungen für dieses Event.
      </p>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl card-border">
      {error && (
        <p role="alert" className="bg-red-500/10 px-5 py-2 text-sm text-red-400">
          {error}
        </p>
      )}
      <table className="w-full text-left text-sm">
        <thead className="bg-white/5 text-xs uppercase tracking-widest text-paper/50">
          <tr>
            <th className="px-5 py-3">Name</th>
            <th className="px-5 py-3">Kontakt</th>
            <th className="px-5 py-3">Status</th>
            <th className="px-5 py-3">Betrag</th>
            <th className="px-5 py-3">Angemeldet</th>
            <th className="px-5 py-3" />
          </tr>
        </thead>
        <tbody>
          {tickets.map((ticket) => (
            <tr key={ticket.id} className="border-t border-paper/10">
              <td className="px-5 py-4 font-medium text-paper">{ticket.name}</td>
              <td className="px-5 py-4 text-paper/60">
                {ticket.email}
                {ticket.phone ? ` · ${ticket.phone}` : ""}
              </td>
              <td className="px-5 py-4">
                <span
                  className={`rounded-full px-2 py-1 text-[11px] font-semibold uppercase ${STATUS_STYLE[ticket.status]}`}
                >
                  {STATUS_LABEL[ticket.status] ?? ticket.status}
                </span>
              </td>
              <td className="px-5 py-4 text-paper/60">
                {ticket.amountCents ? (
                  <>
                    {formatPrice(ticket.amountCents, ticket.currency)}
                    {!ticket.isPaidOnline && (
                      <span className="ml-1 text-[10px] uppercase text-paper/30">
                        Abendkasse
                      </span>
                    )}
                  </>
                ) : (
                  "—"
                )}
              </td>
              <td className="px-5 py-4 text-paper/50">{formatEventDate(ticket.createdAt)}</td>
              <td className="px-5 py-4 text-right">
                <div className="flex justify-end gap-4">
                  {(ticket.status === "VALID" || ticket.status === "CHECKED_IN") && (
                    <button
                      onClick={() => handleRefund(ticket)}
                      disabled={loadingId === ticket.id}
                      className="text-xs font-semibold uppercase tracking-widest text-red-400 hover:underline disabled:opacity-40"
                    >
                      {loadingId === ticket.id
                        ? "…"
                        : ticket.isPaidOnline
                          ? "Erstatten"
                          : "Stornieren"}
                    </button>
                  )}
                  <button
                    onClick={() => handleErasure(ticket)}
                    disabled={loadingId === ticket.id}
                    title="Personenbezogene Daten unwiderruflich löschen (DSGVO Art. 17)"
                    className="text-xs font-semibold uppercase tracking-widest text-paper/40 hover:text-paper hover:underline disabled:opacity-40"
                  >
                    DSGVO löschen
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
