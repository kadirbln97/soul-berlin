"use client";

import { useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export function LoginForm({ totpEnabled }: { totpEnabled: boolean }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/admin";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, code: totpEnabled ? code : undefined })
    });
    const data = await res.json();

    if (!res.ok) {
      setError(data.error ?? "Login fehlgeschlagen");
      setLoading(false);
      return;
    }

    router.push(next);
    router.refresh();
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-ink px-5">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-2xl card-border bg-white/[0.02] p-8"
      >
        <p className="text-display mb-1 text-2xl uppercase text-paper">SØUL Admin</p>
        <p className="mb-6 text-xs uppercase tracking-widest text-paper/40">
          Dashboard & Einlass-Scanner
        </p>

        <label htmlFor="login-email" className="label-field">
          E-Mail
        </label>
        <input
          id="login-email"
          type="email"
          required
          autoComplete="username"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="input-field mb-4"
        />

        <label htmlFor="login-password" className="label-field">
          Passwort
        </label>
        <input
          id="login-password"
          type="password"
          required
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={`input-field ${totpEnabled ? "mb-4" : "mb-6"}`}
        />

        {totpEnabled && (
          <>
            <label htmlFor="login-code" className="label-field">
              Einmalcode (Authenticator-App)
            </label>
            <input
              id="login-code"
              type="text"
              inputMode="numeric"
              pattern="[0-9 ]*"
              autoComplete="one-time-code"
              required
              maxLength={7}
              placeholder="123 456"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="input-field mb-6 tracking-[0.3em]"
            />
          </>
        )}

        {error && (
          <p role="alert" className="mb-4 text-sm text-red-400">
            {error}
          </p>
        )}

        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? "Einen Moment …" : "Login"}
        </button>
      </form>
    </main>
  );
}
