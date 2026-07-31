"use client";

import { useEffect, useRef } from "react";

const READER_ID = "soul-qr-reader";

export function Scanner({
  active,
  onScan
}: {
  active: boolean;
  onScan: (decodedText: string) => void;
}) {
  const scannerRef = useRef<import("html5-qrcode").Html5Qrcode | null>(null);
  const onScanRef = useRef(onScan);
  onScanRef.current = onScan;

  useEffect(() => {
    let cancelled = false;

    async function start() {
      const { Html5Qrcode } = await import("html5-qrcode");
      if (cancelled) return;

      const instance = new Html5Qrcode(READER_ID);
      scannerRef.current = instance;

      try {
        await instance.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 260, height: 260 } },
          (decodedText) => {
            onScanRef.current(decodedText);
          },
          () => {
            // ignoriere einzelne Frame-Decode-Fehler (normal, solange kein QR im Bild ist)
          }
        );
      } catch (err) {
        console.error("[scanner] Kamera konnte nicht gestartet werden:", err);
      }
    }

    start();

    return () => {
      cancelled = true;
      const instance = scannerRef.current;
      if (instance) {
        instance
          .stop()
          .then(() => instance.clear())
          .catch(() => {});
      }
    };
  }, []);

  useEffect(() => {
    const instance = scannerRef.current;
    if (!instance) return;
    try {
      if (active) {
        instance.resume();
      } else {
        // false = nur die Erkennung pausieren, das Kamerabild läuft weiter
        // (kein eingefrorenes Standbild). true würde das Videobild einfrieren,
        // was wie ein Hänger wirkt — genau das soll hier nicht passieren.
        instance.pause(false);
      }
    } catch {
      // Kamera evtl. noch nicht bereit — kein Problem, nächster Effekt-Lauf greift.
    }
  }, [active]);

  return (
    <div className="overflow-hidden rounded-2xl border border-paper/15">
      <div id={READER_ID} role="img" aria-label="Kamerabild zum QR-Code-Scannen" className="w-full" />
    </div>
  );
}
