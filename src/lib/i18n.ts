/**
 * Zweisprachigkeit (Deutsch/Englisch) ohne Zusatz-Bibliothek.
 *
 * Die gewählte Sprache steht in einem Cookie (siehe LOCALE_COOKIE); Server-
 * Komponenten lesen sie über getLocale() aus src/lib/serverLocale.ts. Bewusst
 * ohne eigene URLs pro Sprache — dafür ohne Umbau der Routen und ohne das
 * Risiko kaputter Links.
 *
 * Rechtsseiten (Impressum/AGB/Datenschutz) bleiben absichtlich auf Deutsch:
 * verbindlich ist die deutsche Fassung, eine Übersetzung könnte im Streitfall
 * abweichen.
 */
export const LOCALE_COOKIE = "soul_lang";
export const LOCALES = ["de", "en"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "en";

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (LOCALES as readonly string[]).includes(value);
}

type Dict = {
  nav: { home: string; events: string; instagram: string; skipToContent: string; menu: string; close: string };
  footer: { contact: string; imprint: string; terms: string; privacy: string; whatsapp: string };
  home: { allEvents: string };
  /** Hinweis auf KI-generierte Bilder (Art. 50 KI-VO). */
  ai: { badge: string; imageNotice: string };
  /** Dauerhafte Ticket-Seite, auf die die Bestätigungsmail verlinkt. */
  ticket: {
    heading: string;
    intro: string;
    guest: string;
    statusValid: string;
    statusCheckedIn: string;
    statusInvalid: string;
    saveTip: string;
    notFound: string;
    emailIntro: string;
    emailLink: string;
  };
  /** Preisangaben (Kleinunternehmer, § 19 UStG). */
  price: { total: string; noVat: string; feeIncluded: string };
  events: {
    title: string;
    empty: string;
    soldOut: string;
    details: string;
    free: string;
    ticketAndGuestlist: string;
    ticket: string;
    guestlist: string;
    from: string;
    past: string;
  };
  event: {
    buyTicket: string;
    guestlist: string;
    quantity: string;
    voucher: string;
    voucherPlaceholder: string;
    redeem: string;
    remove: string;
    subtotal: string;
    serviceFee: string;
    total: string;
    tierHeading: string;
    until: string;
    spotsLeft: string;
    soldOut: string;
    soldOutText: string;
    /** Überschrift über der Liste der Ticketphasen. */
    phaseHeading: string;
    /** Badge auf einer ausverkauften Phase. */
    phaseSoldOut: string;
    /** Badge auf der gerade laufenden Phase. */
    phaseActive: string;
    /** Restmenge in der laufenden Phase. */
    phaseRemaining: string;
    /** Hinweis, wenn alle Phasen durch sind. */
    boxOfficeHint: string;
    /** Knopf zum externen Ticketshop, {name} = Anbietername. */
    externalTickets: string;
    /** Fallback ohne hinterlegten Anbieternamen. */
    externalTicketsNeutral: string;
    /** Hinweis unter dem Knopf: der Kauf läuft woanders. */
    externalHint: string;
    salesEndsIn: string;
    signupEndsIn: string;
    almostOver: string;
    salesClosed: string;
    salesClosedText: string;
    signupClosed: string;
    signupClosedText: string;
    location: string;
    routeGoogle: string;
    routeApple: string;
    payNote: string;
    unitDays: string;
    unitHours: string;
    unitMinutes: string;
    unitSeconds: string;
  };
  form: {
    name: string;
    namePlaceholder: string;
    email: string;
    phone: string;
    submitTicket: string;
    submitGuestlist: string;
    loading: string;
    consent: string;
    terms: string;
    privacy: string;
    successTitle: string;
    successText: string;
    errorGeneric: string;
    errorConnection: string;
  };
  contact: {
    topicLabel: string;
    topicGeneral: string;
    topicRefund: string;
    topicBug: string;
    topicFeature: string;
    message: string;
    messagePlaceholder: string;
    messagePlaceholderRefund: string;
    send: string;
    sending: string;
    successTitle: string;
    successText: string;
    refundHint: string;
    ticketNumber: string;
    eventName: string;
  };
  success: {
    noSession: string;
    title: string;
    thanks: (name: string) => string;
    singleIntro: string;
    multiIntro: (n: number) => string;
    checkInbox: string;
    confirming: string;
    confirmingText: string;
  };
  email: {
    ticketSubject: (event: string) => string;
    greeting: (name: string) => string;
    ticketIntro: string;
    ticketId: string;
    ticketLabel: string;
    serviceFee: string;
    paid: string;
    doorPrice: string;
    signOff: string;
  };
};

const de: Dict = {
  nav: {
    home: "Home",
    events: "Events",
    instagram: "Instagram",
    skipToContent: "Zum Inhalt springen",
    menu: "Menü öffnen",
    close: "Menü schließen"
  },
  footer: {
    contact: "Kontakt",
    imprint: "Impressum",
    terms: "AGB",
    privacy: "Datenschutz",
    whatsapp: "WhatsApp"
  },
  home: { allEvents: "Alle ansehen →" },
  ai: {
    badge: "KI-generiert",
    imageNotice: "Dieses Bild wurde mit Künstlicher Intelligenz erstellt oder bearbeitet."
  },
  ticket: {
    heading: "Dein Ticket",
    intro: "Zeig diesen Code am Einlass — er wird gescannt und ist nur einmal gültig.",
    guest: "Gast",
    statusValid: "Gültig",
    statusCheckedIn: "Bereits eingecheckt",
    statusInvalid: "Nicht mehr gültig",
    saveTip:
      "Tipp: Leg diese Seite auf deinen Startbildschirm — dann hast du den Code an der Tür sofort parat, auch ohne die E-Mail zu suchen.",
    notFound: "Dieses Ticket gibt es nicht (mehr).",
    emailIntro: "Kein Netz an der Tür oder E-Mail nicht zur Hand?",
    emailLink: "Ticket im Browser öffnen"
  },
  price: {
    total: "Gesamt",
    noVat: "Kein Ausweis der Umsatzsteuer gemäß § 19 UStG (Kleinunternehmer).",
    feeIncluded: "inkl. Servicegebühr"
  },
  events: {
    title: "Events",
    empty: "Aktuell sind keine Events veröffentlicht — schau bald wieder vorbei.",
    soldOut: "Ausverkauft",
    details: "Details →",
    free: "Kostenlos",
    ticketAndGuestlist: "Ticket & Gästeliste",
    ticket: "Ticket",
    guestlist: "Gästeliste",
    from: "ab",
    past: "Vergangen"
  },
  event: {
    buyTicket: "Ticket kaufen",
    guestlist: "Gästeliste",
    quantity: "Anzahl Tickets",
    voucher: "Gutscheincode (optional)",
    voucherPlaceholder: "z.B. SOUL20",
    redeem: "Einlösen",
    remove: "Entfernen",
    subtotal: "Ticket",
    serviceFee: "Servicegebühr",
    total: "Gesamt",
    tierHeading: "Preisstaffeln (Zahlung an der Abendkasse)",
    until: "bis",
    spotsLeft: "Nur noch {n} Plätze",
    soldOut: "Sold out",
    soldOutText: "Dieses Event ist leider ausgebucht.",
    phaseHeading: "Ticketphasen",
    phaseSoldOut: "Sold out",
    phaseActive: "Jetzt gültig",
    phaseRemaining: "nur noch {n}",
    boxOfficeHint:
      "Der Online-Vorverkauf ist beendet. An der Abendkasse gibt es noch ein limitiertes Restkontingent — komm früh, es gilt solange der Vorrat reicht.",
    externalTickets: "Tickets bei {name}",
    externalTicketsNeutral: "Tickets extern kaufen",
    externalHint: "Der Kauf läuft über einen externen Anbieter — du verlässt dabei unsere Seite.",
    salesEndsIn: "Ticketverkauf endet in",
    signupEndsIn: "Anmeldung schließt in",
    almostOver: "Nur noch kurz",
    salesClosed: "Ticketverkauf beendet",
    salesClosedText: "Für dieses Event werden online keine Tickets mehr verkauft.",
    signupClosed: "Anmeldung geschlossen",
    signupClosedText: "Der Anmeldezeitraum für dieses Event ist leider abgelaufen.",
    location: "Location",
    routeGoogle: "Route in Google Maps",
    routeApple: "Route in Apple Maps",
    payNote: "Sichere Zahlung via Karte, Apple Pay, Google Pay oder PayPal (abgewickelt von Stripe).",
    unitDays: "Tage",
    unitHours: "Std",
    unitMinutes: "Min",
    unitSeconds: "Sek"
  },
  form: {
    name: "Name",
    namePlaceholder: "Dein vollständiger Name",
    email: "E-Mail",
    phone: "Telefon (optional)",
    submitTicket: "Jetzt Ticket sichern →",
    submitGuestlist: "Jetzt auf die Gästeliste →",
    loading: "Einen Moment …",
    consent: "Mit der Anmeldung akzeptierst du unsere",
    terms: "AGB",
    privacy: "Datenschutzerklärung",
    successTitle: "Du bist auf der Liste 🎉",
    successText: "Check dein Postfach — dein QR-Ticket ist unterwegs an deine E-Mail-Adresse.",
    errorGeneric: "Etwas ist schiefgelaufen.",
    errorConnection: "Verbindung fehlgeschlagen. Bitte versuch es erneut."
  },
  contact: {
    topicLabel: "Thema",
    topicGeneral: "Allgemeine Anfrage",
    topicRefund: "Ticket-Rückerstattung",
    topicBug: "Fehler melden",
    topicFeature: "Idee / Feature-Wunsch",
    message: "Nachricht",
    messagePlaceholder: "Wie können wir helfen?",
    messagePlaceholderRefund:
      "Was ist passiert? (z.B. an der Tür abgewiesen, Event verpasst, doppelt gekauft)",
    send: "Nachricht senden →",
    sending: "Wird gesendet …",
    successTitle: "Nachricht angekommen",
    successText: "Danke! Wir melden uns so schnell wie möglich bei dir zurück.",
    refundHint:
      "Damit wir dein Ticket schnell finden: Die Ticket-Nummer steht in deiner Bestätigungs-E-Mail direkt beim QR-Code.",
    ticketNumber: "Ticket-Nummer",
    eventName: "Event"
  },
  success: {
    noSession: "Keine gültige Zahlungssitzung gefunden.",
    title: "Zahlung erfolgreich 🎉",
    thanks: (name) => `Danke, ${name}!`,
    singleIntro: "Dein Ticket für",
    multiIntro: (n) => `Deine ${n} Tickets für`,
    checkInbox: "Check deinen Posteingang (ggf. auch Spam) für den QR-Code.",
    confirming: "Zahlung wird bestätigt …",
    confirmingText:
      "Einen Moment, wir stellen dein Ticket aus. Diese Seite aktualisiert sich automatisch."
  },
  email: {
    ticketSubject: (event) => `Dein Ticket · ${event}`,
    greeting: (name) => `Hi ${name},`,
    ticketIntro:
      "hier ist dein Ticket. Zeig einfach diesen QR-Code am Einlass — er wird gescannt und ist nur einmal gültig.",
    ticketId: "Ticket-ID",
    ticketLabel: "Ticket",
    serviceFee: "Servicegebühr",
    paid: "Bezahlt",
    doorPrice: "Preis an der Abendkasse",
    signOff: "Good people. Good music. — SØUL Berlin"
  }
};

const en: Dict = {
  nav: {
    home: "Home",
    events: "Events",
    instagram: "Instagram",
    skipToContent: "Skip to content",
    menu: "Open menu",
    close: "Close menu"
  },
  footer: {
    contact: "Contact",
    imprint: "Imprint",
    terms: "Terms",
    privacy: "Privacy",
    whatsapp: "WhatsApp"
  },
  home: { allEvents: "See all →" },
  ai: {
    badge: "AI-generated",
    imageNotice: "This image was created or edited using artificial intelligence."
  },
  ticket: {
    heading: "Your ticket",
    intro: "Show this code at the door — it gets scanned and is valid only once.",
    guest: "Guest",
    statusValid: "Valid",
    statusCheckedIn: "Already checked in",
    statusInvalid: "No longer valid",
    saveTip:
      "Tip: add this page to your home screen — then your code is one tap away at the door, no need to dig through your inbox.",
    notFound: "This ticket doesn't exist (anymore).",
    emailIntro: "No signal at the door, or email not at hand?",
    emailLink: "Open ticket in browser"
  },
  price: {
    total: "Total",
    noVat: "No VAT is shown under § 19 German VAT Act (small business rule).",
    feeIncluded: "incl. service fee"
  },
  events: {
    title: "Events",
    empty: "No events published right now — check back soon.",
    soldOut: "Sold out",
    details: "Details →",
    free: "Free",
    ticketAndGuestlist: "Ticket & guest list",
    ticket: "Ticket",
    guestlist: "Guest list",
    from: "from",
    past: "Past"
  },
  event: {
    buyTicket: "Buy ticket",
    guestlist: "Guest list",
    quantity: "Number of tickets",
    voucher: "Voucher code (optional)",
    voucherPlaceholder: "e.g. SOUL20",
    redeem: "Apply",
    remove: "Remove",
    subtotal: "Ticket",
    serviceFee: "Service fee",
    total: "Total",
    tierHeading: "Price tiers (paid at the door)",
    until: "until",
    spotsLeft: "Only {n} spots left",
    soldOut: "Sold out",
    soldOutText: "This event is fully booked.",
    phaseHeading: "Ticket phases",
    phaseSoldOut: "Sold out",
    phaseActive: "On sale now",
    phaseRemaining: "only {n} left",
    boxOfficeHint:
      "Online pre-sale has ended. A limited number of tickets is still available at the door — come early, while stocks last.",
    externalTickets: "Tickets on {name}",
    externalTicketsNeutral: "Buy tickets externally",
    externalHint: "Tickets are sold by an external provider — you will leave our site.",
    salesEndsIn: "Ticket sales end in",
    signupEndsIn: "Sign-up closes in",
    almostOver: "Almost over",
    salesClosed: "Ticket sales closed",
    salesClosedText: "Tickets for this event are no longer sold online.",
    signupClosed: "Sign-up closed",
    signupClosedText: "The sign-up period for this event has ended.",
    location: "Location",
    routeGoogle: "Directions in Google Maps",
    routeApple: "Directions in Apple Maps",
    payNote: "Secure payment via card, Apple Pay, Google Pay or PayPal (handled by Stripe).",
    unitDays: "Days",
    unitHours: "Hrs",
    unitMinutes: "Min",
    unitSeconds: "Sec"
  },
  form: {
    name: "Name",
    namePlaceholder: "Your full name",
    email: "Email",
    phone: "Phone (optional)",
    submitTicket: "Get your ticket →",
    submitGuestlist: "Join the guest list →",
    loading: "One moment …",
    consent: "By signing up you accept our",
    terms: "Terms",
    privacy: "Privacy Policy",
    successTitle: "You're on the list 🎉",
    successText: "Check your inbox — your QR ticket is on its way to your email address.",
    errorGeneric: "Something went wrong.",
    errorConnection: "Connection failed. Please try again."
  },
  contact: {
    topicLabel: "Topic",
    topicGeneral: "General enquiry",
    topicRefund: "Ticket refund",
    topicBug: "Report a bug",
    topicFeature: "Idea / feature request",
    message: "Message",
    messagePlaceholder: "How can we help?",
    messagePlaceholderRefund:
      "What happened? (e.g. refused at the door, missed the event, bought twice)",
    send: "Send message →",
    sending: "Sending …",
    successTitle: "Message received",
    successText: "Thanks! We'll get back to you as soon as possible.",
    refundHint:
      "So we can find your ticket quickly: the ticket number is in your confirmation email, right next to the QR code.",
    ticketNumber: "Ticket number",
    eventName: "Event"
  },
  success: {
    noSession: "No valid payment session found.",
    title: "Payment successful 🎉",
    thanks: (name) => `Thanks, ${name}!`,
    singleIntro: "Your ticket for",
    multiIntro: (n) => `Your ${n} tickets for`,
    checkInbox: "Check your inbox (and spam folder) for the QR code.",
    confirming: "Confirming payment …",
    confirmingText: "One moment, we're issuing your ticket. This page updates automatically."
  },
  email: {
    ticketSubject: (event) => `Your ticket · ${event}`,
    greeting: (name) => `Hi ${name},`,
    ticketIntro:
      "here's your ticket. Just show this QR code at the entrance — it will be scanned and is valid only once.",
    ticketId: "Ticket ID",
    ticketLabel: "Ticket",
    serviceFee: "Service fee",
    paid: "Paid",
    doorPrice: "Price at the door",
    signOff: "Good people. Good music. — SØUL Berlin"
  }
};

const DICTS: Record<Locale, Dict> = { de, en };

export function getDict(locale: Locale): Dict {
  return DICTS[locale] ?? DICTS[DEFAULT_LOCALE];
}

/** Ersetzt Platzhalter wie {n} in einem übersetzten Text. */
export function fill(template: string, values: Record<string, string | number>) {
  return Object.entries(values).reduce(
    (acc, [key, value]) => acc.replaceAll(`{${key}}`, String(value)),
    template
  );
}
