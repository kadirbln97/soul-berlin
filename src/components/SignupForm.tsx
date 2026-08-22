"use client";

import { useState, type FormEvent } from "react";
import { getDict, DEFAULT_LOCALE, type Locale } from "@/lib/i18n";

export function SignupForm({
  eventId,
  ticketMode,
  quantity = 1,
  discountCode = "",
  locale = DEFAULT_LOCALE
}: {
  eventId: string;
  ticketMode: string;
  /** Nur beim Ticketkauf: gewählte Stückzahl (kommt aus TicketPurchasePanel). */
  quantity?: number;
  /** Eingegebener Gutscheincode, wird zur Preisprüfung mitgeschickt. */
  discountCode?: string;
  locale?: Locale;
}) {
  const t = getDict(locale);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  // Bewusst false: eine vorangekreuzte Box ist keine wirksame Einwilligung
  // (EuGH, Planet49). Der Haken muss vom Gast selbst gesetzt werden.
  const [newsletter, setNewsletter] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const endpoint = ticketMode === "PAID" ? "/api/checkout" : "/api/guestlist";
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId,
          name,
          email,
          phone,
          quantity,
          discountCode,
          // Nur bei der Gästeliste relevant. Beim Ticketkauf greift die
          // Bestandskundenregel, dort wird nichts angekreuzt.
          newsletter: ticketMode === "PAID" ? false : newsletter
        })
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? t.form.errorGeneric);
        setLoading(false);
        return;
      }

      if (ticketMode === "PAID" && data.url) {
        window.location.href = data.url;
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
        className="enter-pop rounded-2xl border border-soul-orange/40 bg-soul-orange/10 p-6 text-center"
      >
        <p className="text-display text-xl uppercase text-paper">{t.form.successTitle}</p>
        <p className="mt-2 text-sm text-paper/70">
          {t.form.successText}
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
        <label className="label-field" htmlFor="phone">
          {t.form.phone}
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

      {/* Einwilligung in Werbung — bewusst als eigenes, leeres Kästchen und
          getrennt vom AGB-Hinweis darunter. Art. 7 Abs. 2 DSGVO verlangt, dass
          ein Einwilligungsersuchen von anderen Sachverhalten klar
          unterscheidbar ist; mit den AGB gebündelt wäre sie unwirksam.
          Die Anmeldung funktioniert ohne den Haken genauso — eine Kopplung
          an den Vertrag wäre nach Art. 7 Abs. 4 DSGVO ebenfalls unwirksam. */}
      {ticketMode !== "PAID" && (
        <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-paper/10 p-3 text-left">
          <input
            type="checkbox"
            checked={newsletter}
            onChange={(e) => setNewsletter(e.target.checked)}
            className="mt-0.5 h-4 w-4 shrink-0 accent-soul-orange"
          />
          <span className="min-w-0">
            <span className="block text-xs leading-snug text-paper/80">
              {t.form.newsletterLabel}
            </span>
            <span className="mt-1 block text-[11px] leading-snug text-paper/50">
              {t.form.newsletterHint}
            </span>
          </span>
        </label>
      )}

      {/* Pflichthinweis nach § 7 Abs. 3 UWG: Bestandskunden dürfen ohne
          Einwilligung Werbung für eigene ähnliche Angebote bekommen, müssen
          aber bereits bei der Erhebung der Adresse auf ihr kostenloses
          Widerspruchsrecht hingewiesen werden. Fehlt der Hinweis, ist die
          spätere Werbung unzulässig. */}
      {ticketMode === "PAID" && (
        <p className="rounded-xl border border-paper/10 p-3 text-[11px] leading-snug text-paper/50">
          {t.form.customerInfoNotice}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="btn-primary mt-2 w-full py-4 text-[13px]"
      >
        {loading
          ? t.form.loading
          : ticketMode === "PAID"
            ? t.form.submitTicket
            : t.form.submitGuestlist}
      </button>
      <p className="text-center text-[11px] text-paper/60">
        {t.form.consent}{" "}
        <a href="/legal/agb" className="underline hover:text-soul-orange">
          {t.form.terms}
        </a>{" "}
        &{" "}
        <a href="/legal/datenschutz" className="underline hover:text-soul-orange">
          {t.form.privacy}
        </a>
        .
      </p>
    </form>
  );
}
