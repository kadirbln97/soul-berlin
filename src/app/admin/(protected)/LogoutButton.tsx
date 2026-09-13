"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function LogoutButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  // Alle Sitzungen auf allen Geräten entwerten — bei verlorenem Handy oder
  // wenn ein Cookie in falsche Hände geraten sein könnte.
  async function handleLogoutAll() {
    if (
      !window.confirm(
        "Alle Admin-Sitzungen auf allen Geräten abmelden? Auch du musst dich danach neu anmelden."
      )
    ) {
      return;
    }
    setBusy(true);
    await fetch("/api/admin/logout-all", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <span className="flex items-center gap-4">
      <button
        type="button"
        onClick={handleLogoutAll}
        disabled={busy}
        title="Alle Sitzungen auf allen Geräten beenden"
        className="text-paper/40 hover:text-red-400 disabled:opacity-50"
      >
        Überall abmelden
      </button>
      <button type="button" onClick={handleLogout} className="hover:text-soul-orange">
        Logout
      </button>
    </span>
  );
}
