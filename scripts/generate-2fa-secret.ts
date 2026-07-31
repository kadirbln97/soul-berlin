// Erzeugt ein neues TOTP-Secret für die Admin-2FA + einen QR-Code zum Scannen
// mit einer Authenticator-App (Google Authenticator, Authy, 1Password, ...).
//
// WICHTIG: Dieses Script läuft nur lokal bei dir. Das Secret wird NIRGENDS
// im Quellcode/Repo gespeichert — es kommt ausschließlich in die Umgebungs-
// variable ADMIN_TOTP_SECRET (lokal in .env, live in den Vercel-Projekt-
// einstellungen). Die erzeugte QR-Datei (2fa-qr.png) NICHT committen und nach
// dem Einscannen am besten löschen.
//
// Nutzung: npm run generate-2fa-secret -- deine@email.de
import QRCode from "qrcode";
import { generateTotpSecret, buildOtpAuthUri } from "../src/lib/totp";

async function main() {
  const email = process.argv[2];

  if (!email) {
    console.error("Bitte deine Admin-E-Mail angeben: npm run generate-2fa-secret -- deine@email.de");
    process.exit(1);
  }

  const secret = generateTotpSecret();
  const otpauthUri = buildOtpAuthUri(secret, email);
  const qrPath = "2fa-qr.png";

  await QRCode.toFile(qrPath, otpauthUri, { width: 320, margin: 2 });

  console.log("\n1) Füge das in deine .env (lokal) bzw. bei Vercel unter Environment Variables ein:\n");
  console.log(`ADMIN_TOTP_SECRET="${secret}"\n`);
  console.log(`2) Scanne die eben erzeugte Datei "${qrPath}" mit deiner Authenticator-App`);
  console.log("   (Google Authenticator, Authy, 1Password, Microsoft Authenticator, ...).\n");
  console.log("3) Lösche die Datei danach wieder (enthält das Secret als Bild):");
  console.log(`   rm ${qrPath}\n`);
  console.log(
    "Ab jetzt fragt /admin/login nach Passwort UND dem 6-stelligen Code aus der App."
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
