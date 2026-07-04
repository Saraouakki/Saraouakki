"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { arrayToCsv, downloadCsv } from "@/lib/csv";

const TEMPLATE_HEADERS = [
  "Référence",
  "Client",
  "Type",
  "Mode",
  "Statut",
  "Transporteur",
  "Fournisseur",
  "Origine",
  "Destination",
  "ETA",
  "Priorité",
  "Bureau de douane",
  "Régime douanier",
  "N° DUM (BADR)",
  "Poids (kg)",
  "Volume (m³)",
  "Valeur marchandise",
];

const TEMPLATE_EXAMPLE = [
  "DOS-2026-100",
  "Atlas Textiles SARL",
  "Export",
  "Route",
  "Créé",
  "Maroc Express Transit",
  "",
  "Casablanca, Maroc",
  "Marseille, France",
  "2026-08-01",
  "Normale",
  "Casablanca Port",
  "Exportation définitive",
  "",
  "10000",
  "30",
  "50000",
];

interface ImportResult {
  created: number;
  warnings: string[];
}

export default function DossierImportForm() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [csvText, setCsvText] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setCsvText(String(reader.result ?? ""));
    reader.readAsText(file, "utf-8");
  }

  function handleTemplate() {
    const csv = arrayToCsv(TEMPLATE_HEADERS, [TEMPLATE_EXAMPLE]);
    downloadCsv("modele-import-dossiers.csv", csv);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setResult(null);
    if (!csvText.trim()) {
      setError("Choisissez un fichier CSV ou collez son contenu.");
      return;
    }
    setPending(true);
    try {
      const res = await fetch("/api/dossiers/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csv: csvText }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Échec de l'import.");
        return;
      }
      setResult({ created: data.created, warnings: data.warnings ?? [] });
      setCsvText("");
      if (fileRef.current) fileRef.current.value = "";
      router.refresh();
    } catch {
      setError("Erreur réseau, réessayez.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="panel">
      <div className="panel-header">
        <h2>Fichier CSV</h2>
        <button type="button" className="uploader-form-btn-sm" onClick={handleTemplate}>
          Télécharger un modèle
        </button>
      </div>

      <form onSubmit={handleSubmit} style={{ padding: 20, display: "flex", flexDirection: "column", gap: 14 }}>
        <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 13, fontWeight: 600 }}>
          Fichier CSV (exporté depuis Excel)
          <input ref={fileRef} type="file" accept=".csv,text/csv" onChange={handleFile} />
        </label>

        <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 13, fontWeight: 600 }}>
          Ou collez le contenu CSV directement
          <textarea
            rows={8}
            value={csvText}
            onChange={(e) => setCsvText(e.target.value)}
            placeholder="Référence,Client,Type,Mode,Statut,..."
            style={{
              padding: 10,
              borderRadius: 8,
              border: "1px solid var(--border)",
              background: "var(--bg)",
              color: "var(--text)",
              fontFamily: "monospace",
              fontSize: 12.5,
            }}
          />
        </label>

        {error && <div className="login-error">{error}</div>}

        {result && (
          <div className="login-success">
            <strong>{result.created} dossier(s) importé(s).</strong>
            {result.warnings.length > 0 && (
              <ul style={{ margin: "8px 0 0", paddingLeft: 18 }}>
                {result.warnings.map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            )}
          </div>
        )}

        <div>
          <button type="submit" className="uploader-form-btn-sm" disabled={pending}>
            {pending ? "Import en cours..." : "Importer"}
          </button>
        </div>
      </form>
    </div>
  );
}
