export default function NotionErrorPanel({ error }: { error: unknown }) {
  const message = error instanceof Error ? error.message : String(error);
  return (
    <div className="error-box">
      <strong>Impossible de charger les données Notion.</strong>
      <p style={{ margin: "8px 0 0" }}>{message}</p>
      <p style={{ margin: "10px 0 0" }}>
        Vérifiez que <code>NOTION_TOKEN</code> est défini dans <code>.env.local</code> et que
        la page « Logistique &amp; Transit — Plateforme » est bien partagée avec votre intégration
        Notion. Voir le <code>README.md</code> pour la procédure complète.
      </p>
    </div>
  );
}
