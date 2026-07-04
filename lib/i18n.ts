export type Locale = "fr" | "en";
export const LOCALE_COOKIE = "ltp_locale";
export const DEFAULT_LOCALE: Locale = "fr";

export const dictionaries = {
  fr: {
    nav_overview: "Vue d'ensemble",
    nav_dossiers: "Dossiers",
    nav_flotte: "Flotte",
    nav_entrepot: "Entrepôt",
    nav_clients: "Clients",
    nav_fournisseurs: "Fournisseurs",
    nav_comptes: "Comptes",
    nav_audit: "Journal d'audit",
    nav_mon_espace: "Mon espace",
    role_interne: "Équipe interne",
    role_client: "Client",
    role_fournisseur: "Fournisseur",
    logout: "Déconnexion",

    login_title: "Logistique & Transit",
    login_subtitle: "Connectez-vous à votre espace (interne, client ou fournisseur).",
    login_email: "Email",
    login_password: "Mot de passe",
    login_submit: "Se connecter",
    login_submit_pending: "Connexion...",
    login_forgot: "Mot de passe oublié ?",
    login_signup: "Créer un compte",

    overview_title: "Vue d'ensemble",
    overview_subtitle: "Suivi en temps réel des opérations de transit, transport et entreposage.",
    stat_active_dossiers: "Dossiers actifs",
    stat_customs: "En dédouanement",
    stat_urgent: "Priorité urgente",
    stat_value_in_transit: "Valeur en transit",
    stat_vehicles_available: "Véhicules disponibles",
    stat_stock_alerts: "Alertes stock",
    stat_clients: "Clients",
    stat_fournisseurs: "Fournisseurs",

    lang_switch: "Langue",
  },
  en: {
    nav_overview: "Overview",
    nav_dossiers: "Shipments",
    nav_flotte: "Fleet",
    nav_entrepot: "Warehouse",
    nav_clients: "Clients",
    nav_fournisseurs: "Suppliers",
    nav_comptes: "Accounts",
    nav_audit: "Audit log",
    nav_mon_espace: "My space",
    role_interne: "Staff",
    role_client: "Client",
    role_fournisseur: "Supplier",
    logout: "Log out",

    login_title: "Logistics & Transit",
    login_subtitle: "Sign in to your space (staff, client or supplier).",
    login_email: "Email",
    login_password: "Password",
    login_submit: "Sign in",
    login_submit_pending: "Signing in...",
    login_forgot: "Forgot your password?",
    login_signup: "Create an account",

    overview_title: "Overview",
    overview_subtitle: "Real-time tracking of transit, transport and warehousing operations.",
    stat_active_dossiers: "Active shipments",
    stat_customs: "In customs clearance",
    stat_urgent: "Urgent priority",
    stat_value_in_transit: "Value in transit",
    stat_vehicles_available: "Vehicles available",
    stat_stock_alerts: "Stock alerts",
    stat_clients: "Clients",
    stat_fournisseurs: "Suppliers",

    lang_switch: "Language",
  },
} as const;

export type TranslationKey = keyof (typeof dictionaries)["fr"];

export function t(locale: Locale, key: TranslationKey): string {
  return dictionaries[locale][key] ?? dictionaries[DEFAULT_LOCALE][key] ?? key;
}

export function isLocale(value: string | undefined): value is Locale {
  return value === "fr" || value === "en";
}
