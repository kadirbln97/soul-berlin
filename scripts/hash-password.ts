// Erzeugt einen bcrypt-Hash für ADMIN_PASSWORD_HASH in .env
// Nutzung: npm run hash-password -- "DeinPasswort123"
import bcrypt from "bcryptjs";

const password = process.argv[2];

if (!password) {
  console.error('Bitte ein Passwort angeben: npm run hash-password -- "DeinPasswort123"');
  process.exit(1);
}

const hash = bcrypt.hashSync(password, 10);
console.log("\nFüge das in deine .env ein:\n");
console.log(`ADMIN_PASSWORD_HASH="${hash}"\n`);
