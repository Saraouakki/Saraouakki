import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { notion, DS, invalidateDataSource } from "@/lib/notion";
import { getUserByEmail } from "@/lib/data";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { logAudit } from "@/lib/audit";
import { sendEmail } from "@/lib/mailer";
import { captureException } from "@/lib/monitoring";

const CLIENT_TYPES = ["Importateur", "Exportateur", "Les deux"];
const FOURNISSEUR_CATEGORIES = [
  "Matières premières",
  "Pièces détachées",
  "Équipement",
  "Emballage",
  "Services",
];

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const nom = typeof body?.nom === "string" ? body.nom.trim() : "";
  const email = typeof body?.email === "string" ? body.email.trim() : "";
  const password = typeof body?.password === "string" ? body.password : "";
  const role = body?.role === "Fournisseur" ? "Fournisseur" : body?.role === "Client" ? "Client" : "";
  const societe = typeof body?.societe === "string" ? body.societe.trim() : "";
  const telephone = typeof body?.telephone === "string" ? body.telephone.trim() : "";
  const pays = typeof body?.pays === "string" ? body.pays.trim() : "";
  const categorie = typeof body?.categorie === "string" ? body.categorie : "";

  if (!nom || !email || !password || !role || !societe) {
    return NextResponse.json({ error: "Tous les champs obligatoires ne sont pas remplis." }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: "Le mot de passe doit contenir au moins 8 caractères." }, { status: 400 });
  }
  if (role === "Client" && !CLIENT_TYPES.includes(categorie)) {
    return NextResponse.json({ error: "Type de client invalide." }, { status: 400 });
  }
  if (role === "Fournisseur" && !FOURNISSEUR_CATEGORIES.includes(categorie)) {
    return NextResponse.json({ error: "Catégorie de fournisseur invalide." }, { status: 400 });
  }

  const ip = clientIp(request);
  const limit = await rateLimit(`signup:${ip}`, { limit: 5, windowMs: 60 * 60_000 });
  if (!limit.success) {
    return NextResponse.json({ error: "Trop de tentatives. Réessayez plus tard." }, { status: 429 });
  }

  try {
    const existing = await getUserByEmail(email);
    if (existing) {
      return NextResponse.json({ error: "Un compte existe déjà avec cet e-mail." }, { status: 409 });
    }

    let companyPageId: string;
    if (role === "Client") {
      const page = await notion.pages.create({
        parent: { data_source_id: DS.clients },
        properties: {
          Nom: { title: [{ text: { content: societe } }] },
          Société: { rich_text: [{ text: { content: societe } }] },
          Email: { email },
          Téléphone: { phone_number: telephone || null },
          Pays: { rich_text: [{ text: { content: pays } }] },
          Type: { select: { name: categorie } },
        },
      });
      companyPageId = page.id;
    } else {
      const page = await notion.pages.create({
        parent: { data_source_id: DS.fournisseurs },
        properties: {
          Nom: { title: [{ text: { content: societe } }] },
          Contact: { rich_text: [{ text: { content: nom } }] },
          Email: { email },
          Téléphone: { phone_number: telephone || null },
          Pays: { rich_text: [{ text: { content: pays } }] },
          Catégorie: { select: { name: categorie } },
        },
      });
      companyPageId = page.id;
    }

    const passwordHash = await bcrypt.hash(password, 10);

    await notion.pages.create({
      parent: { data_source_id: DS.utilisateurs },
      properties: {
        Nom: { title: [{ text: { content: nom } }] },
        Email: { email },
        Rôle: { select: { name: role } },
        [role]: { relation: [{ id: companyPageId }] },
        "Mot de passe (hash)": { rich_text: [{ text: { content: passwordHash } }] },
        Statut: { select: { name: "En attente" } },
      },
    });

    invalidateDataSource(DS.utilisateurs);
    invalidateDataSource(role === "Client" ? DS.clients : DS.fournisseurs);

    logAudit({ action: "Compte créé", utilisateur: email, detail: `Rôle demandé : ${role} (${societe})` });

    const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL;
    if (adminEmail) {
      const appUrl = process.env.APP_URL || "http://localhost:3000";
      await sendEmail({
        to: adminEmail,
        subject: `Nouvelle demande de compte : ${nom} (${societe})`,
        html: `<p>${nom} (${email}) demande un accès ${role} pour ${societe}.</p><p><a href="${appUrl}/comptes">Valider dans l'application</a></p>`,
        text: `${nom} (${email}) demande un accès ${role} pour ${societe}. Validez sur ${appUrl}/comptes`,
      });
    }

    return NextResponse.json({
      message: "Votre compte a été créé et est en attente de validation par notre équipe.",
    });
  } catch (error) {
    await captureException(error, { scope: "auth.signup", email });
    const message = error instanceof Error ? error.message : "Erreur inconnue";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
