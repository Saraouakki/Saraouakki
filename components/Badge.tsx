import { STATUT_COLORS } from "@/lib/types";

export default function Badge({ label }: { label: string }) {
  if (!label) return <span className="badge badge-gray">—</span>;
  const color = STATUT_COLORS[label] ?? "gray";
  return <span className={`badge badge-${color}`}>{label}</span>;
}
