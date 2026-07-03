"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { DOSSIER_STATUTS } from "@/lib/types";

export default function StatusUpdater({ id, current }: { id: string; current: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  async function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const statut = e.target.value;
    setError(null);
    const res = await fetch(`/api/dossiers/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ statut }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Échec de la mise à jour");
      return;
    }
    startTransition(() => router.refresh());
  }

  return (
    <div>
      <select value={current} onChange={handleChange} disabled={pending}>
        {DOSSIER_STATUTS.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>
      {error && <div style={{ color: "#c0261f", fontSize: 12, marginTop: 6 }}>{error}</div>}
    </div>
  );
}
