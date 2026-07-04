let initialized = false;

async function getSentry() {
  const dsn = process.env.SENTRY_DSN;
  if (!dsn) return null;

  if (!initialized) {
    const Sentry = await import("@sentry/node");
    Sentry.init({
      dsn,
      environment: process.env.NODE_ENV,
      tracesSampleRate: 0.1,
    });
    initialized = true;
  }
  return import("@sentry/node");
}

/**
 * Capture une erreur serveur pour investigation (Sentry si SENTRY_DSN est configuré,
 * sinon simple `console.error`). Ne doit jamais elle-même faire planter l'appelant :
 * la surveillance ne doit jamais devenir une source de panne.
 */
export async function captureException(error: unknown, context?: Record<string, unknown>): Promise<void> {
  console.error(context ? `[monitoring] ${JSON.stringify(context)}` : "[monitoring]", error);
  try {
    const Sentry = await getSentry();
    Sentry?.captureException(error, context ? { extra: context } : undefined);
  } catch {
    // La surveillance elle-même ne doit jamais lever d'exception.
  }
}
