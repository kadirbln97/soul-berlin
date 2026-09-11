// Erzeugt einen bcrypt-Hash für ADMIN_PASSWORD_HASH in .env
// Nutzung: npm run hash-password -- "DeinPasswort123"
import bcrypt from "bcryptjs";

const password = process.argv[2];

if (!password) {
  console.error('Bitte ein Passwort angeben: npm run hash-password -- "DeinPasswort123"');
  process.exit(1);
}

// Kostenfaktor 12: ~250 ms pro Prüfung — für einen Login unmerklich, für
// einen Angreifer mit gestohlenem Hash 4x teurer als der Standard 10.
const hash = bcrypt.hashSync(password, 12);
console.log("\nNur diese Zeile bei Vercel als Wert für ADMIN_PASSWORD_HASH eintragen");
console.log("(OHNE Anführungszeichen, OHNE 'ADMIN_PASSWORD_HASH=' davor — nur der Teil zwischen >>> und <<<):\n");
console.log(`>>>${hash}<<<\n`);
console.log("Für lokale .env-Datei (dort MIT Anführungszeichen):\n");
console.log(`ADMIN_PASSWORD_HASH="${hash}"\n`);
