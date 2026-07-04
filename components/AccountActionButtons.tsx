"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function AccountActionButtons({ id }: { id: string }) {
  const router = useRouter();
  const [pending, setPending] = useState<"activer" | "refuser" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function act(action: "activer" | "refuser") {
    setError(null);
    setPending(action);
    try {
      const res = await fetch(`/api/comptes/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Échec de l'action.");
        setPending(null);
        return;
      }
      router.refresh();
    } catch {
      setError("Erreur réseau.");
      setPending(null);
    }
  }

  return (
    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
      <button className="uploader-form-btn-sm" disabled={!!pending} onClick={() => act("activer")}>
        {pending === "activer" ? "..." : "Activer"}
      </button>
      <button className="uploader-form-btn-sm danger" disabled={!!pending} onClick={() => act("refuser")}>
        {pending === "refuser" ? "..." : "Refuser"}
      </button>
      {error && <span style={{ color: "#c0261f", fontSize: 12 }}>{error}</span>}
    </div>
  );
}
