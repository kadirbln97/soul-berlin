# SØUL Berlin — Event-Website mit Tickets, Gästeliste & QR-Einlass

Komplette Next.js-Webseite für deine Partyreihe: öffentliche Event-Seiten im
SØUL-Look, Ticketverkauf über Stripe **oder** kostenlose Gästeliste (pro Event
wählbar), automatischer QR-Code-Versand per E-Mail, und ein Admin-Bereich mit
Einlass-Scanner (läuft direkt im Handy-Browser über die Kamera — keine App
nötig) sowie Stornierung/Rückerstattung.

## Was ist enthalten

- **Öffentliche Seiten:** Home, Events-Übersicht, Event-Detail mit Anmeldung/Checkout
- **Ticketverkauf:** Stripe Checkout (Kreditkarte etc.), inkl. Kapazitätslimit & "Sold out"
- **Kostenlose Gästeliste:** ganz ohne Zahlung, trotzdem mit gültigem QR-Ticket
- **QR-Codes:** fälschungssicher signiert (HMAC), per E-Mail an den Gast verschickt
- **Scanner:** Admin-Seite, die die Handykamera nutzt, um QR-Codes zu validieren und
  Gäste einzuchecken — funktioniert auf jedem Smartphone im Browser
- **Rückerstattung/Stornierung:** ein Klick im Admin-Bereich storniert das Ticket;
  bei bezahlten Tickets wird automatisch über Stripe zurückerstattet
- **Admin-Dashboard:** Events anlegen/bearbeiten, Gästeliste pro Event einsehen

## Wichtiger Hinweis zu diesem Setup

Dieses Projekt wurde in einer Sandbox ohne Internetzugriff zum npm-Registry
geschrieben — `npm install` konnte hier **nicht** getestet werden. Der Code ist
sorgfältig geschrieben, aber führe nach der Installation unbedingt einmal
`npm run dev` aus und melde dich bei mir, falls eine Fehlermeldung auftaucht —
das lässt sich in der Regel schnell beheben.

---

## 1. Voraussetzungen

- Node.js ≥ 20 (du hast bereits Node über Homebrew installiert)
- Ein Stripe-Konto (kostenlos, nur nötig falls du bezahlte Tickets nutzt) → https://dashboard.stripe.com
- Ein SMTP-Zugang zum Mailversand, z.B. [Resend](https://resend.com) (kostenloses
  Kontingent), Brevo, Postmark oder ein bestehendes Gmail-Konto mit App-Passwort

## 2. Installation

```bash
cd soul-berlin
npm install
cp .env.example .env
```

Öffne `.env` und fülle die Werte aus (Details unten). Danach:

```bash
# APP_SECRET erzeugen (langer Zufallswert):
openssl rand -hex 32
# → Ergebnis in .env bei APP_SECRET einsetzen

# Admin-Passwort-Hash erzeugen:
npm run hash-password -- "DeinSicheresPasswort"
# → Ausgabe in .env bei ADMIN_PASSWORD_HASH einsetzen

# Datenbank anlegen (lokal, SQLite — kein Extra-Setup nötig):
npm run db:push

# 2 Demo-Events anlegen (optional, aber empfohlen zum Testen):
npm run db:seed

# Los geht's:
npm run dev
```

Seite läuft dann unter http://localhost:3000, Admin-Bereich unter
http://localhost:3000/admin (Login mit `ADMIN_EMAIL` + deinem Passwort).

## 3. Stripe einrichten (nur für bezahlte Tickets nötig)

1. Auf https://dashboard.stripe.com/apikeys den **Secret Key** (Testmodus reicht
   zum Ausprobieren) kopieren → `STRIPE_SECRET_KEY` in `.env`.
2. Für lokale Tests den [Stripe CLI](https://docs.stripe.com/stripe-cli) nutzen:
   ```bash
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```
   Der dabei angezeigte `whsec_...` kommt in `STRIPE_WEBHOOK_SECRET`.
3. Für den Live-Betrieb: in Stripe unter **Developers → Webhooks** einen Endpoint
   auf `https://deine-domain.de/api/webhooks/stripe` anlegen, Event
   `checkout.session.completed` aktivieren, den dortigen Signing Secret in
   `STRIPE_WEBHOOK_SECRET` eintragen.
4. Wenn ein Event live gehen soll: im Admin-Bereich Event mit Ticket-Modus
   "Bezahlte Tickets" + Preis anlegen und auf "Veröffentlicht" stellen.

**Rückerstattung:** Im Admin-Bereich bei einem Ticket auf "Erstatten" klicken —
das löst automatisch eine echte Stripe-Rückerstattung aus und entwertet den
QR-Code (Einlass wird dann verweigert).

## 4. E-Mail-Versand einrichten

In `.env` unter `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` deine
Zugangsdaten eintragen. Funktioniert mit jedem SMTP-Anbieter. Beispiel mit
[Resend](https://resend.com) (100 E-Mails/Tag kostenlos):

```
SMTP_HOST="smtp.resend.com"
SMTP_PORT="587"
SMTP_USER="resend"
SMTP_PASS="dein-resend-api-key"
SMTP_FROM="SØUL Berlin <no-reply@deine-domain.de>"
```

Ohne eigene Domain kannst du zum Testen vorübergehend eine private Gmail-Adresse
mit [App-Passwort](https://myaccount.google.com/apppasswords) nutzen
(`SMTP_HOST="smtp.gmail.com"`, `SMTP_PORT="587"`).

## 5. Deployment (empfohlen: Vercel + Supabase/Neon)

SQLite eignet sich nur für lokale Tests. Für den Live-Betrieb:

1. Kostenlose Postgres-Datenbank anlegen, z.B. bei
   [Supabase](https://supabase.com) oder [Neon](https://neon.tech).
2. In `prisma/schema.prisma` den datasource-Block anpassen:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```
3. `DATABASE_URL` in den Vercel-Umgebungsvariablen auf die Postgres-Connection-URL
   setzen (alle anderen `.env`-Werte ebenfalls als Vercel Environment Variables
   eintragen — inkl. `APP_URL` auf deine echte Domain).
4. Projekt zu GitHub pushen, bei [Vercel](https://vercel.com) importieren, deployen.
5. Nach dem ersten Deploy einmalig `npx prisma db push` gegen die Produktions-DB
   laufen lassen (z.B. lokal mit der Produktions-`DATABASE_URL` in `.env`).
6. Stripe-Webhook (siehe oben) auf die echte Domain umstellen.

## 6. Branding anpassen

- Logo: `public/logo.png` ersetzen
- Farben: `tailwind.config.ts` → `soul.orange` etc.
- Texte/Footer/Legal-Platzhalter: `src/app/legal/*` — **vor dem Live-Gang unbedingt
  durch echte Impressum-/AGB-/Datenschutz-Texte ersetzen** (Pflicht in Deutschland,
  besonders da echte Zahlungen & personenbezogene Daten verarbeitet werden).

## 7. Wie der QR-Flow funktioniert

1. Gast meldet sich an (Gästeliste) oder bezahlt (Stripe Checkout).
2. Ein Ticket wird in der Datenbank angelegt, eine fälschungssichere,
   signierte Kennung wird als QR-Code erzeugt (kein Rätselraten möglich —
   ohne den geheimen `APP_SECRET` lässt sich kein gültiger Code fälschen).
3. Der QR-Code wird per E-Mail verschickt.
4. Am Einlass: Admin/Türsteher öffnet auf dem Handy `/admin/scanner`
   (eingeloggt), hält die Kamera auf den QR-Code. Die Seite zeigt sofort:
   gültig (grün), bereits benutzt (gelb) oder storniert/ungültig (rot) — und
   markiert das Ticket automatisch als "eingecheckt".
5. Mehrere Türsteher können sich gleichzeitig mit demselben Admin-Login auf
   ihren eigenen Handys einloggen und parallel scannen.

## 8. Sicherheit & DSGVO — was schon eingebaut ist

**Sicherheit:**
- Passwort-Hashing (bcrypt), signierte Session-Cookies (httpOnly, secure in Produktion, SameSite)
- Fälschungssichere, HMAC-signierte QR-Codes (nicht erratbar)
- Stripe-Webhook-Signaturprüfung + Idempotenz (keine doppelten Tickets)
- Rate-Limiting auf Login, Gästeliste, Checkout & Scanner (Schutz vor Brute-Force/Spam)
- Security-Header (X-Frame-Options, X-Content-Type-Options, Referrer-Policy,
  Permissions-Policy — Kamera nur für die eigene Seite)
- HTML-Escaping von Nutzereingaben in E-Mails (verhindert Markup-Injection)
- Serverseitige Eingabevalidierung (Zod) mit sinnvollen Ober-/Untergrenzen

**DSGVO:**
- Datensparsamkeit: nur Name, E-Mail, optional Telefon — keine Tracking-Cookies,
  kein Analytics/Werbe-Skript eingebaut, deshalb bewusst **kein** Cookie-Banner
  (rechtlich für rein technische Cookies nicht nötig)
- "DSGVO löschen"-Button im Admin-Bereich pro Ticket → löscht personenbezogene
  Daten (Art. 17 DSGVO, Recht auf Löschung) vollständig und unwiderruflich
- Datenschutzerklärung mit Rechtsgrundlagen, Auftragsverarbeitern (Stripe, SMTP,
  Hosting) und Betroffenenrechten vorbereitet (`/legal/datenschutz`) — Platzhalter
  `[...]` bitte vor Live-Gang ausfüllen (Retention-Frist, Kontakt-E-Mail etc.)

**Was du trotzdem noch selbst erledigen musst:**
- Echte Impressum-/AGB-Angaben eintragen (Pflicht in Deutschland)
- HTTPS sicherstellen (bei Vercel automatisch inklusive)
- Auftragsverarbeitungsverträge (AVV) mit Stripe & deinem E-Mail-Anbieter abschließen
  bzw. akzeptieren (meist direkt im jeweiligen Dashboard)
- Falls du später Analytics/Werbe-Pixel einbaust: Cookie-Consent-Banner nachrüsten
- Bei sehr hohem Traffic auf Serverless (Vercel): Rate-Limiting durch einen
  verteilten Dienst (z.B. Upstash Redis) ersetzen — die eingebaute Variante ist
  In-Memory pro Server-Prozess

## 9. Struktur (falls du selbst weiterbauen willst)

```
src/app/            Seiten (App Router) — öffentlich, /admin, /api
src/components/      Wiederverwendbare UI-Komponenten
src/lib/             Prisma, Auth, Stripe, QR/Token, E-Mail, Validierung
prisma/schema.prisma Datenbankschema (Event, Ticket)
prisma/seed.ts       Demo-Events
```

Bei Fragen oder Fehlern beim ersten `npm run dev` einfach den Fehlertext
zurückmelden — lässt sich normalerweise schnell fixen.
