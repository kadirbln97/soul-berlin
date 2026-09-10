// Richtet den zweiten Faktor (Authenticator-App) für den Admin-Login ein.
// Nutzung: npm run totp-secret -- "deine@email.de"
//
// Gibt ein neues Geheimnis aus, zeigt es als QR-Code im Terminal (mit der
// Authenticator-App scannen) und nennt den Wert für ADMIN_TOTP_SECRET.
import QRCode from "qrcode";
import { buildOtpauthUrl, generateTotpSecret, totpNow } from "../src/lib/totp";

const account = process.argv[2];

if (!account) {
  console.error('Bitte die Admin-E-Mail angeben: npm run totp-secret -- "deine@email.de"');
  process.exit(1);
}

const secret = generateTotpSecret();
const url = buildOtpauthUrl("SØUL Berlin", account, secret);

(async () => {
  console.log("\n1) Diesen QR-Code mit der Authenticator-App scannen");
  console.log("   (Google Authenticator, Apple Passwörter, Authy, 1Password …):\n");
  console.log(await QRCode.toString(url, { type: "terminal", small: true }));
  console.log("   Falls Scannen nicht geht — Schlüssel von Hand eintippen:");
  console.log(`   ${secret.match(/.{1,4}/g)?.join(" ")}\n`);

  console.log("2) Bei Vercel als Umgebungsvariable ADMIN_TOTP_SECRET eintragen");
  console.log("   (OHNE Anführungszeichen — nur der Teil zwischen >>> und <<<), dann Redeploy:\n");
  console.log(`>>>${secret}<<<\n`);

  console.log("3) Zur Kontrolle — die App sollte jetzt gerade diesen Code anzeigen:");
  console.log(`   ${totpNow(secret)}\n`);

  console.log("Für lokale .env-Datei (dort MIT Anführungszeichen):\n");
  console.log(`ADMIN_TOTP_SECRET="${secret}"\n`);
  console.log("Wichtig: Der Code gilt für ALLE Admin-Konten. Geheimnis nur einmal anzeigen,");
  console.log("nicht per Chat verschicken; bei Verlust des Handys neu erzeugen und in Vercel ersetzen.\n");
})();
