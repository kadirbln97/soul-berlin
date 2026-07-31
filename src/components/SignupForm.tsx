"use client";

import { useState, type FormEvent } from "react";

export function SignupForm({
  eventId,
  ticketMode
}: {
  eventId: string;
  ticketMode: string;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const endpoint = ticketMode === "PAID" ? "/api/checkout" : "/api/guestlist";
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId, name, email, phone })
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Etwas ist schiefgelaufen.");
        setLoading(false);
        return;
      }

      if (ticketMode === "PAID" && data.url) {
        window.location.href = data.url;
        return;
      }

      setSuccess(true);
    } catch {
      setError("Verbindung fehlgeschlagen. Bitte versuch es erneut.");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div
        role="status"
        className="rounded-2xl border border-soul-orange/40 bg-soul-orange/10 p-6 text-center"
      >
        <p className="text-display text-xl uppercase text-paper">Du bist auf der Liste 🎉</p>
        <p className="mt-2 text-sm text-paper/70">
          Check dein Postfach — dein QR-Ticket ist unterwegs an deine E-Mail-Adresse.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <label className="label-field" htmlFor="name">
          Name
        </label>
        <input
          id="name"
          required
          minLength={2}
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="input-field"
          placeholder="Dein vollständiger Name"
        />
      </div>
      <div>
        <label className="label-field" htmlFor="email">
          E-Mail
        </label>
        <input
          id="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="input-field"
          placeholder="du@example.com"
        />
      </div>
      <div>
        <label className="label-field" htmlFor="phone">
          Telefon (optional)
        </label>
        <input
          id="phone"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="input-field"
          placeholder="+49 …"
        />
      </div>

      {error && (
        <p role="alert" className="text-sm text-red-400">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="btn-primary mt-2 w-full py-4 text-[13px]"
      >
        {loading
          ? "Einen Moment …"
          : ticketMode === "PAID"
            ? "Jetzt Ticket sichern →"
            : "Jetzt auf die Gästeliste →"}
      </button>
      <p className="text-center text-[11px] text-paper/40">
        Mit der Anmeldung akzeptierst du unsere{" "}
        <a href="/legal/agb" className="underline hover:text-soul-orange">
          AGB
        </a>{" "}
        &{" "}
        <a href="/legal/datenschutz" className="underline hover:text-soul-orange">
          Datenschutzerklärung
        </a>
        .
      </p>
    </form>
  );
}
