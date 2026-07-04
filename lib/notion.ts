import { Client } from "@notionhq/client";
import type {
  PageObjectResponse,
  PartialPageObjectResponse,
  QueryDataSourceParameters,
} from "@notionhq/client/build/src/api-endpoints";
import { getCached, setCached, invalidateCache } from "./cache";

export const notion = new Client({ auth: process.env.NOTION_TOKEN });

// Durée de vie du cache en mémoire pour les lectures Notion. Réduit le nombre
// d'appels à l'API Notion (limitée à ~3 req/s) quand plusieurs pages sont
// rendues coup sur coup. Ce cache vit dans le processus du serveur : il aide
// sur une instance "chaude" mais n'est pas partagé entre plusieurs instances
// (pas de problème de cohérence grave ici, les données ne sont pas critiques
// à la seconde près, et chaque écriture invalide sa base explicitement).
const CACHE_TTL_MS = Number(process.env.CACHE_TTL_MS ?? 20_000);

export const DS = {
  clients: required("NOTION_DS_CLIENTS"),
  transporteurs: required("NOTION_DS_TRANSPORTEURS"),
  entrepots: required("NOTION_DS_ENTREPOTS"),
  vehicules: required("NOTION_DS_VEHICULES"),
  articles: required("NOTION_DS_ARTICLES"),
  chauffeurs: required("NOTION_DS_CHAUFFEURS"),
  dossiers: required("NOTION_DS_DOSSIERS"),
  documents: required("NOTION_DS_DOCUMENTS"),
  mouvements: required("NOTION_DS_MOUVEMENTS"),
  etapes: required("NOTION_DS_ETAPES"),
  fournisseurs: required("NOTION_DS_FOURNISSEURS"),
  utilisateurs: required("NOTION_DS_UTILISATEURS"),
  audit: required("NOTION_DS_AUDIT"),
};

function required(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Variable d'environnement manquante: ${key}`);
  }
  return value;
}

export type Page = PageObjectResponse;

async function queryAllFresh(
  dataSourceId: string,
  filter?: QueryDataSourceParameters["filter"]
): Promise<Page[]> {
  const pages: Page[] = [];
  let cursor: string | undefined;
  do {
    const res = await notion.dataSources.query({
      data_source_id: dataSourceId,
      start_cursor: cursor,
      page_size: 100,
      ...(filter ? { filter } : {}),
    });
    for (const r of res.results as (PageObjectResponse | PartialPageObjectResponse)[]) {
      if ("properties" in r) pages.push(r as PageObjectResponse);
    }
    cursor = res.has_more ? (res.next_cursor ?? undefined) : undefined;
  } while (cursor);
  return pages;
}

/** Lit toutes les pages d'une data source, avec un cache en mémoire de courte durée. */
export async function queryAll(dataSourceId: string): Promise<Page[]> {
  const cacheKey = `ds:${dataSourceId}`;
  const cached = getCached<Page[]>(cacheKey);
  if (cached) return cached;
  const pages = await queryAllFresh(dataSourceId);
  setCached(cacheKey, pages, CACHE_TTL_MS);
  return pages;
}

/**
 * Variante filtrée côté API Notion (utilisée pour les portails client/fournisseur) :
 * évite de rapatrier l'intégralité de la base Dossiers quand elle grossit. Non mise
 * en cache car le filtre varie par utilisateur — l'intérêt est déjà dans la réduction
 * du volume transféré et le respect du taux de requêtes Notion.
 */
export async function queryFiltered(
  dataSourceId: string,
  filter: NonNullable<QueryDataSourceParameters["filter"]>
): Promise<Page[]> {
  return queryAllFresh(dataSourceId, filter);
}

export function invalidateDataSource(dataSourceId: string): void {
  invalidateCache(`ds:${dataSourceId}`);
}

// --- Property extraction helpers -------------------------------------------------

function prop(page: Page, name: string) {
  return page.properties[name];
}

export function getTitle(page: Page, name: string): string {
  const p = prop(page, name);
  if (p?.type !== "title") return "";
  return p.title.map((t) => t.plain_text).join("");
}

export function getText(page: Page, name: string): string {
  const p = prop(page, name);
  if (p?.type !== "rich_text") return "";
  return p.rich_text.map((t) => t.plain_text).join("");
}

export function getSelect(page: Page, name: string): string {
  const p = prop(page, name);
  if (p?.type !== "select") return "";
  return p.select?.name ?? "";
}

export function getNumber(page: Page, name: string): number | null {
  const p = prop(page, name);
  if (p?.type !== "number") return null;
  return p.number;
}

export function getDate(page: Page, name: string): string | null {
  const p = prop(page, name);
  if (p?.type !== "date") return null;
  return p.date?.start ?? null;
}

export function getEmail(page: Page, name: string): string {
  const p = prop(page, name);
  if (p?.type !== "email") return "";
  return p.email ?? "";
}

export function getPhone(page: Page, name: string): string {
  const p = prop(page, name);
  if (p?.type !== "phone_number") return "";
  return p.phone_number ?? "";
}

export function getRelationIds(page: Page, name: string): string[] {
  const p = prop(page, name);
  if (p?.type !== "relation") return [];
  return p.relation.map((r) => r.id);
}

export function getFileUrls(page: Page, name: string): string[] {
  const p = prop(page, name);
  if (p?.type !== "files") return [];
  return p.files.map((f) => (f.type === "external" ? f.external.url : f.file.url));
}

/** Build a lookup map from page id -> display name (title property), for resolving relations. */
export function nameMap(pages: Page[], titleProp: string): Map<string, string> {
  const map = new Map<string, string>();
  for (const p of pages) map.set(p.id, getTitle(p, titleProp));
  return map;
}

export function resolveNames(ids: string[], map: Map<string, string>): string[] {
  return ids.map((id) => map.get(id) ?? "—");
}
