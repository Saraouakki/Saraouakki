function toCsvCell(value: string | number | null | undefined): string {
  const s = value == null ? "" : String(value);
  if (/[",\n;]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export function arrayToCsv(headers: string[], rows: Array<Array<string | number | null>>): string {
  const lines = [headers.map(toCsvCell).join(",")];
  for (const row of rows) {
    lines.push(row.map(toCsvCell).join(","));
  }
  // BOM UTF-8 pour qu'Excel (très répandu chez les transitaires) détecte les accents correctement.
  return "﻿" + lines.join("\r\n");
}

/**
 * Parseur CSV tolérant (virgules ou points-virgules, champs entre guillemets, \r\n ou \n) —
 * pensé pour accepter tel quel un export Excel classique d'un transitaire marocain.
 */
export function parseCsv(text: string): string[][] {
  const cleaned = text.replace(/^﻿/, "");
  const delimiter = (cleaned.split("\n")[0]?.split(";").length ?? 0) > (cleaned.split("\n")[0]?.split(",").length ?? 0)
    ? ";"
    : ",";

  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < cleaned.length; i++) {
    const char = cleaned[i];
    const next = cleaned[i + 1];

    if (inQuotes) {
      if (char === '"' && next === '"') {
        field += '"';
        i++;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
    } else if (char === delimiter) {
      row.push(field);
      field = "";
    } else if (char === "\n" || char === "\r") {
      if (char === "\r" && next === "\n") i++;
      row.push(field);
      field = "";
      if (row.some((cell) => cell !== "")) rows.push(row);
      row = [];
    } else {
      field += char;
    }
  }
  if (field !== "" || row.length > 0) {
    row.push(field);
    if (row.some((cell) => cell !== "")) rows.push(row);
  }

  return rows;
}

/** Déclenche le téléchargement d'un CSV côté navigateur. À appeler uniquement côté client. */
export function downloadCsv(filename: string, csv: string): void {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
