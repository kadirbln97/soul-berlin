"use client";

import { useState, type FormEvent } from "react";

const TOPICS = [
  { value: "general", label: "Allgemeine Anfrage" },
  { value: "refund", label: "Ticket-Rückerstattung" },
  { value: "bug", label: "Fehler melden" },
  { value: "feature", label: "Idee / Feature-Wunsch" }
];

export function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [topic, setTopic] = useState("general");
  const [message, setMessage] = useState("");
  const [ticketRef, setTicketRef] = useState("");
  const [eventName, setEventName] = useState("");
  const [website, setWebsite] = useState(""); // Honeypot — bleibt für Menschen leer
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, topic, message, website, ticketRef, eventName })
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Etwas ist schiefgelaufen.");
        setLoading(false);
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
        <p className="text-display text-xl uppercase text-paper">Nachricht angekommen</p>
        <p className="mt-2 text-sm text-paper/70">
          Danke! Wir melden uns so schnell wie möglich bei dir zurück.
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
        <label className="label-field" htmlFor="topic">
          Thema
        </label>
        <select
          id="topic"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          className="input-field"
        >
          {TOPICS.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </div>
      {/* Zusatzfelder nur bei Rückerstattungen — damit die Anfrage direkt alle
          Angaben enthält, die zum Auffinden des Tickets nötig sind. */}
      {topic === "refund" && (
        <div className="flex flex-col gap-4 rounded-2xl border border-soul-orange/30 bg-soul-orange/5 p-4">
          <p className="text-xs text-paper/60">
            Damit wir dein Ticket schnell finden: Die Ticket-Nummer steht in deiner
            Bestätigungs-E-Mail direkt beim QR-Code.
          </p>
          <div>
            <label className="label-field" htmlFor="ticketRef">
              Ticket-Nummer
            </label>
            <input
              id="ticketRef"
              value={ticketRef}
              onChange={(e) => setTicketRef(e.target.value)}
              className="input-field"
              placeholder="z.B. cms97qb2y0001..."
            />
          </div>
          <div>
            <label className="label-field" htmlFor="eventName">
              Event
            </label>
            <input
              id="eventName"
              value={eventName}
              onChange={(e) => setEventName(e.target.value)}
              className="input-field"
              placeholder="z.B. SØUL @THE DOOR, 01.08."
            />
          </div>
        </div>
      )}

      <div>
        <label className="label-field" htmlFor="message">
          Nachricht
        </label>
        <textarea
          id="message"
          required
          minLength={10}
          rows={5}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="input-field resize-none"
          placeholder={
            topic === "refund"
              ? "Was ist passiert? (z.B. an der Tür abgewiesen, Event verpasst, doppelt gekauft)"
              : "Wie können wir helfen?"
          }
        />
      </div>

      {/* Honeypot: für Menschen unsichtbar, Bots füllen es oft trotzdem aus. */}
      <div className="absolute -left-[9999px] top-auto h-0 w-0 overflow-hidden" aria-hidden="true">
        <label htmlFor="website">Website</label>
        <input
          id="website"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
        />
      </div>

      {error && (
        <p role="alert" className="text-sm text-red-400">
          {error}
        </p>
      )}

      <button type="submit" disabled={loading} className="btn-primary mt-2 w-full py-4 text-[13px]">
        {loading ? "Wird gesendet …" : "Nachricht senden →"}
      </button>
    </form>
  );
}
