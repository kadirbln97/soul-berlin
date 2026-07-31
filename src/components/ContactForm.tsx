"use client";

import { useState, type FormEvent } from "react";

const TOPICS = [
  { value: "general", label: "Allgemeine Anfrage" },
  { value: "bug", label: "Fehler melden" },
  { value: "feature", label: "Idee / Feature-Wunsch" }
];

export function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [topic, setTopic] = useState("general");
  const [message, setMessage] = useState("");
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
        body: JSON.stringify({ name, email, topic, message, website })
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
          placeholder="Wie können wir helfen?"
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
