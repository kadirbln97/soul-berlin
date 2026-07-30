"use client";

import { useCallback, useRef, useState } from "react";
import { Scanner } from "@/components/Scanner";

type Result = {
  result: "VALID" | "ALREADY_USED" | "REFUNDED" | "INVALID";
  message: string;
  guestName?: string;
  eventTitle?: string;
};

const RESULT_STYLE: Record<Result["result"], string> = {
  VALID: "border-green-500 bg-green-500/10 text-green-400",
  ALREADY_USED: "border-yellow-500 bg-yellow-500/10 text-yellow-400",
  REFUNDED: "border-red-500 bg-red-500/10 text-red-400",
  INVALID: "border-red-500 bg-red-500/10 text-red-400"
};

const RESULT_TITLE: Record<Result["result"], string> = {
  VALID: "Einlass gewährt ✅",
  ALREADY_USED: "Bereits eingecheckt ⚠️",
  REFUNDED: "Storniert / erstattet ❌",
  INVALID: "Ungültiger Code ❌"
};

export default function ScannerPage() {
  const [active, setActive] = useState(true);
  const [result, setResult] = useState<Result | null>(null);
  const busyRef = useRef(false);

  const handleScan = useCallback(async (decodedText: string) => {
    if (busyRef.current) return;
    busyRef.current = true;
    setActive(false);

    try {
      const res = await fetch("/api/tickets/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: decodedText })
      });
      const data = await res.json();
      setResult(data);
    } catch {
      setResult({ result: "INVALID", message: "Verbindung zum Server fehlgeschlagen." });
    } finally {
      busyRef.current = false;
    }
  }, []);

  function scanNext() {
    setResult(null);
    setActive(true);
  }

  return (
    <div className="mx-auto max-w-md">
      <h1 className="text-display mb-6 text-3xl uppercase text-paper">Einlass-Scanner</h1>

      <Scanner active={active} onScan={handleScan} />

      {result && (
        <div
          role="status"
          aria-live="assertive"
          className={`mt-6 rounded-2xl border p-6 text-center ${RESULT_STYLE[result.result]}`}
        >
          <p className="text-display text-xl uppercase">{RESULT_TITLE[result.result]}</p>
          {result.guestName && <p className="mt-2 text-paper">{result.guestName}</p>}
          {result.eventTitle && <p className="text-sm text-paper/60">{result.eventTitle}</p>}
          <p className="mt-2 text-sm opacity-80">{result.message}</p>
          <button onClick={scanNext} className="btn-primary mt-5">
            Weiter scannen
          </button>
        </div>
      )}

      {!result && (
        <p className="mt-4 text-center text-xs uppercase tracking-widest text-paper/40">
          QR-Code des Gastes vor die Kamera halten
        </p>
      )}
    </div>
  );
}
