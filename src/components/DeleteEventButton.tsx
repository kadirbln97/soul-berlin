"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function DeleteEventButton({ eventId }: { eventId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    const confirmed = window.confirm(
      "Event wirklich löschen? Alle zugehörigen Tickets/Anmeldungen werden ebenfalls gelöscht. Das kann nicht rückgängig gemacht werden."
    );
    if (!confirmed) return;

    setLoading(true);
    const res = await fetch(`/api/admin/events/${eventId}`, { method: "DELETE" });
    if (res.ok) {
      router.push("/admin");
      router.refresh();
    } else {
      setLoading(false);
      alert("Löschen fehlgeschlagen.");
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="text-xs font-semibold uppercase tracking-widest text-red-400 hover:underline disabled:opacity-40"
    >
      {loading ? "…" : "Event löschen"}
    </button>
  );
}
