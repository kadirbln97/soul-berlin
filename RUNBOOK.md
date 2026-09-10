# Betriebshandbuch soulberlin.de

Kurz und für den Ernstfall geschrieben. Wenn etwas brennt, hier nachsehen — nicht im Code.

## Wo läuft was

| Baustein | Anbieter | Wo nachsehen |
|---|---|---|
| Website, Serverfunktionen, Cron | Vercel (Region `fra1`) | vercel.com → Projekt → Deployments / Logs / Settings |
| Datenbank (Postgres) | Neon, EU | console.neon.tech → Projekt |
| Hochgeladene Bilder/Videos | Vercel Blob | vercel.com → Storage |
| Zahlungen, Webhooks | Stripe | dashboard.stripe.com → Entwickler → Webhooks |
| E-Mail-Versand (SMTP) | Resend (oder der in `SMTP_HOST` eingetragene Anbieter) | Anbieter-Dashboard → Logs |
| Code | GitHub `kadirbln97/soul-berlin` | jeder Push auf `main` deployt automatisch |

## Umgebungsvariablen (Vercel → Settings → Environment Variables)

Pflicht: `DATABASE_URL`, `APP_URL`, `APP_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD_HASH`, `CRON_SECRET`.
Für Tickets: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`. Für E-Mails: `SMTP_*`. Optional: `CONTACT_EMAIL`.

Nach jeder Änderung an Umgebungsvariablen: **Redeploy** auslösen, sonst gilt der alte Wert weiter.

`DATABASE_URL` sollte Neons **Pooler-Endpunkt** sein (Hostname enthält `-pooler`). Ohne Pooler gehen bei einem Ticketstart mit vielen gleichzeitigen Aufrufen die Verbindungen aus.

## Was tun, wenn …

### … die Seite einen Fehler zeigt („Da ist etwas schiefgelaufen")

1. Vercel → Logs → nach `[error.tsx]` oder dem `digest` aus der Fehlermeldung suchen.
2. Häufigste Ursache: Datenbank nicht erreichbar → Neon-Status prüfen (Projekt evtl. im Sparmodus „suspended“ — öffnet sich beim ersten Aufruf von selbst, dauert 1–3 s).
3. War es das letzte Deployment? Vercel → Deployments → vorheriges Deployment → „Promote to Production“. Damit ist die Seite in unter einer Minute wieder auf dem alten Stand.

### … Stripe-Webhooks fehlschlagen (Gast hat bezahlt, aber kein Ticket)

1. Stripe → Entwickler → Webhooks → Endpunkt `/api/webhooks/stripe` → fehlgeschlagene Zustellungen ansehen.
2. Häufig: `STRIPE_WEBHOOK_SECRET` stimmt nicht mehr (nach Neuanlage des Endpunkts). Wert aus Stripe kopieren, in Vercel setzen, Redeploy.
3. Danach in Stripe die fehlgeschlagenen Events **„Resend“** — der Webhook ist idempotent, doppelte Zustellung erzeugt keine Doppeltickets.
4. Notfall von Hand: Admin → Event → „Gäste manuell eintragen“ mit dem Namen aus Stripe; Gast bekommt dann keinen QR-Code, wird aber per Namenssuche eingecheckt.

### … Ticket-E-Mails nicht ankommen

1. Admin → Event → Gästetabelle: Tickets ohne Versandzeitpunkt haben keine E-Mail bekommen.
2. SMTP-Anbieter-Dashboard prüfen (Kontingent, gesperrter Absender, Bounce).
3. Gast kann sein Ticket immer unter `/ticket/<token>` öffnen — der Link steht in der E-Mail; notfalls den Token aus der Datenbank (Tabelle `Ticket`) heraussuchen und dem Gast schicken.

### … das Admin-Passwort vergessen ist

```
npm run hash-password -- "NeuesLangesPasswort"
```
Den ausgegebenen Hash als `ADMIN_PASSWORD_HASH` in Vercel setzen, Redeploy. Alle bestehenden Sessions bleiben gültig, bis sie ablaufen (7 Tage) — bei Verdacht auf Fremdzugriff zusätzlich `APP_SECRET` neu setzen, das wirft alle sofort raus (und macht bestehende Ticket-QR-Codes ungültig → nur tun, wenn gerade kein Event läuft, sonst vorher die Tickets neu versenden).

### … `APP_SECRET` rotiert werden muss

`APP_SECRET` signiert Admin-Sessions **und** die QR-Codes auf Tickets. Rotation = alle bestehenden QR-Codes werden ungültig. Deshalb: nur zwischen Events, danach allen Gästen mit gültigem Ticket die E-Mail erneut senden.

### … ein Backup eingespielt werden muss

Neon hält automatisch eine Historie (Point-in-Time-Recovery, im Free-Tier 24 h, bei bezahlten Plänen bis 30 Tage).
1. Neon → Projekt → Branches → „Restore“ → Zeitpunkt wählen. Neon erstellt einen neuen Branch mit dem Stand von damals.
2. Verbindungs-URL des neuen Branches als `DATABASE_URL` in Vercel setzen, Redeploy — oder den Branch in Neon zum Hauptbranch machen.
3. Einmal im Quartal probehalber durchspielen (Branch anlegen, gegen die Vorschau-Umgebung starten, Branch wieder löschen). 20 Minuten, danach weiß man, dass es geht.

### … der nächtliche Aufräumlauf nicht läuft

Vercel → Projekt → Settings → Cron Jobs zeigt die letzten Läufe von `/api/cron/cleanup`. Läuft er mit `503`: `CRON_SECRET` fehlt. Mit `401`: der Wert in Vercel stimmt nicht mit dem überein, den Vercel schickt (nach Änderung Redeploy).
Was er tut: 90 Tage nach dem Event Gästelisten-Einträge löschen, bezahlte Tickets anonymisieren, unbestätigte Newsletter-Anmeldungen nach 30 Tagen löschen — siehe `src/lib/retention.ts`.

### … ein Gast Auskunft oder Löschung verlangt (DSGVO)

Auskunft: Admin → Event → Gästetabelle → Excel-Export, Zeilen des Gasts heraussuchen; Newsletter: Admin → Newsletter-Export.
Löschung: Admin → Gästetabelle → „DSGVO löschen“ am Eintrag (entfernt den Datensatz vollständig). Bei bezahlten Tickets stattdessen Name/E-Mail/Telefon durch Platzhalter ersetzen — Betrag und Zahlungsreferenz müssen bleiben (Aufbewahrungspflicht). Newsletter: Abmeldelink oder Eintrag in Neon auf `UNSUBSCRIBED` setzen.

## Vor jedem Event

- Admin → Event: Status „Veröffentlicht“, Datum/Uhrzeit, Kontingente, Phasen, Verkaufsschluss.
- Testkauf mit Stripe-Testkarte in der Vorschau-Umgebung — oder ein 1-€-Ticket live und danach erstatten.
- Scanner auf dem Handy öffnen (`/admin/scanner`), Kamera freigeben, ein Ticket probescannen. Offline-Modus greift automatisch, wenn das Netz am Einlass wegbricht; die Check-ins werden nachgetragen, sobald es zurück ist.
- Nach dem Event: Tischplan-Häkchen „Vergeben“ zurücksetzen, falls das nächste Event denselben Plan nutzt.

## Entwickeln

```
npm install
cp .env.example .env      # Werte eintragen
npm run db:push           # Schema in die Datenbank
npm run dev
npm run typecheck && npm test
```

Tests laufen ohne Datenbank (nur Preis-, Phasen-, Staffel- und Parser-Logik). Vor jedem Push: Typecheck und Tests grün — GitHub Actions wiederholt beides bei jedem Push.
