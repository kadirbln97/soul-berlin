"use client";

import { Suspense, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function AdminLoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/admin";

  const [step, setStep] = useState<"password" | "2fa">("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handlePasswordSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Login fehlgeschlagen");
      return;
    }

    setStep("2fa");
  }

  async function handleCodeSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await fetch("/api/admin/login/verify-2fa", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code })
    });
    const data = await res.json();

    if (!res.ok) {
      setError(data.error ?? "Code ungültig");
      setLoading(false);
      return;
    }

    router.push(next);
    router.refresh();
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-ink px-5">
      <div className="w-full max-w-sm rounded-2xl card-border bg-white/[0.02] p-8">
        <p className="text-display mb-1 text-2xl uppercase text-paper">SØUL Admin</p>
        <p className="mb-6 text-xs uppercase tracking-widest text-paper/40">
          Dashboard & Einlass-Scanner
        </p>

        {step === "password" ? (
          <form onSubmit={handlePasswordSubmit}>
            <label className="label-field">E-Mail</label>
            <input
              type="email"
              required
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-field mb-4"
            />

            <label className="label-field">Passwort</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field mb-6"
            />

            {error && (
              <p role="alert" className="mb-4 text-sm text-red-400">
                {error}
              </p>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? "Einen Moment …" : "Weiter"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleCodeSubmit}>
            <p className="mb-4 text-sm text-paper/60">
              Öffne deine Authenticator-App und gib den aktuellen 6-stelligen Code ein.
            </p>

            <label className="label-field">Code</label>
            <input
              type="text"
              inputMode="numeric"
              pattern="\d{6}"
              maxLength={6}
              required
              autoFocus
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              className="input-field mb-6 text-center text-2xl tracking-[0.4em]"
              placeholder="000000"
            />

            {error && (
              <p role="alert" className="mb-4 text-sm text-red-400">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading || code.length !== 6}
              className="btn-primary w-full"
            >
              {loading ? "Einen Moment …" : "Einloggen"}
            </button>
            <button
              type="button"
              onClick={() => {
                setStep("password");
                setCode("");
                setError(null);
              }}
              className="mt-4 w-full text-center text-xs uppercase tracking-widest text-paper/40 hover:text-paper"
            >
              ← Zurück
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
