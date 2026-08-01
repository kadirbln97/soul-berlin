"use client";

import { useState, type FormEvent } from "react";
import { getDict, DEFAULT_LOCALE, type Locale } from "@/lib/i18n";



export function ContactForm({ locale = DEFAULT_LOCALE }: { locale?: Locale }) {
  const t = getDict(locale);
  const TOPICS = [
    { value: "general", label: t.contact.topicGeneral },
    { value: "refund", label: t.contact.topicRefund },
    { value: "bug", label: t.contact.topicBug },
    { value: "feature", label: t.contact.topicFeature }
  ];

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
        setError(data.error ?? t.form.errorGeneric);
        setLoading(false);
        return;
      }

      setSuccess(true);
    } catch {
      setError(t.form.errorConnection);
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
        <p className="text-display text-xl uppercase text-paper">{t.contact.successTitle}</p>
        <p className="mt-2 text-sm text-paper/70">
          {t.contact.successText}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <label className="label-field" htmlFor="name">
          {t.form.name}
        </label>
        <input
          id="name"
          required
          minLength={2}
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="input-field"
          placeholder={t.form.namePlaceholder}
        />
      </div>
      <div>
        <label className="label-field" htmlFor="email">
          {t.form.email}
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
          {t.contact.topicLabel}
        </label>
        <select
          id="topic"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          className="input-field"
        >
          {TOPICS.map((topicOption) => (
            <option key={topicOption.value} value={topicOption.value}>
              {topicOption.label}
            </option>
          ))}
        </select>
      </div>
      {/* Zusatzfelder nur bei Rückerstattungen — damit die Anfrage direkt alle
          Angaben enthält, die zum Auffinden des Tickets nötig sind. */}
      {topic === "refund" && (
        <div className="flex flex-col gap-4 rounded-2xl border border-soul-orange/30 bg-soul-orange/5 p-4">
          <p className="text-xs text-paper/60">
            {t.contact.refundHint}
          </p>
          <div>
            <label className="label-field" htmlFor="ticketRef">
              {t.contact.ticketNumber}
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
              {t.contact.eventName}
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
          {t.contact.message}
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
              ? t.contact.messagePlaceholderRefund
              : t.contact.messagePlaceholder
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
        {loading ? t.contact.sending : t.contact.send}
      </button>
    </form>
  );
}
