import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/server-session";
import { getDossier, getDocuments, getEtapes } from "@/lib/data";
import { canAccessDossier } from "@/lib/access";
import { generateDossierPdf } from "@/lib/pdf";
import { captureException } from "@/lib/monitoring";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  const { id } = await params;

  try {
    const [dossier, documents, etapes] = await Promise.all([
      getDossier(id),
      getDocuments(),
      getEtapes(),
    ]);

    if (!dossier || !canAccessDossier(session, dossier)) {
      return NextResponse.json({ error: "Dossier introuvable." }, { status: 404 });
    }

    const bytes = await generateDossierPdf(
      dossier,
      documents.filter((d) => d.dossierIds.includes(id)),
      etapes.filter((e) => e.dossierIds.includes(id))
    );

    return new NextResponse(Buffer.from(bytes), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${dossier.reference}.pdf"`,
      },
    });
  } catch (error) {
    await captureException(error, { scope: "dossiers.pdf", dossierId: id });
    return NextResponse.json({ error: "Impossible de générer le PDF." }, { status: 500 });
  }
}
