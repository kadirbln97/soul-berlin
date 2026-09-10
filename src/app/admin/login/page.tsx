import { Suspense } from "react";
import { LoginForm } from "./LoginForm";

export const metadata = { title: "Admin-Login", robots: { index: false, follow: false } };

export default function AdminLoginPage() {
  // Ob ein zweiter Faktor verlangt wird, entscheidet allein die
  // Umgebungsvariable — das Formular zeigt das Code-Feld dann mit an.
  const totpEnabled = Boolean(process.env.ADMIN_TOTP_SECRET?.trim());

  return (
    <Suspense fallback={null}>
      <LoginForm totpEnabled={totpEnabled} />
    </Suspense>
  );
}
