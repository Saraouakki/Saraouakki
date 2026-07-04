"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { DOCUMENT_TYPES } from "@/lib/types";

export default function DocumentUploader({ dossierId }: { dossierId: string }) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [type, setType] = useState<string>(DOCUMENT_TYPES[0]);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const file = fileRef.current?.files?.[0];
    if (!file) {
      setError("Choisissez un fichier.");
      return;
    }

    setPending(true);
    const formData = new FormData();
    formData.set("dossierId", dossierId);
    formData.set("type", type);
    formData.set("file", file);

    try {
      const res = await fetch("/api/documents/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Échec de l'envoi.");
        return;
      }
      if (fileRef.current) fileRef.current.value = "";
      router.refresh();
    } catch {
      setError("Erreur réseau, réessayez.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="uploader-form">
      <select value={type} onChange={(e) => setType(e.target.value)} disabled={pending}>
        {DOCUMENT_TYPES.map((t) => (
          <option key={t} value={t}>
            {t}
          </option>
        ))}
      </select>
      <input ref={fileRef} type="file" disabled={pending} />
      <button type="submit" disabled={pending}>
        {pending ? "Envoi..." : "Ajouter le document"}
      </button>
      {error && <div className="login-error">{error}</div>}
    </form>
  );
}
