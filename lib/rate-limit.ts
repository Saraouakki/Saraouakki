interface LimitOptions {
  limit: number;
  windowMs: number;
}

interface LimitResult {
  success: boolean;
  remaining: number;
  resetAt: number;
}

const memoryStore = new Map<string, { count: number; resetAt: number }>();

function sweepMemoryStore() {
  if (memoryStore.size < 5000) return;
  const now = Date.now();
  for (const [key, entry] of memoryStore) {
    if (entry.resetAt <= now) memoryStore.delete(key);
  }
}

function memoryLimit(key: string, { limit, windowMs }: LimitOptions): LimitResult {
  sweepMemoryStore();
  const now = Date.now();
  const entry = memoryStore.get(key);

  if (!entry || entry.resetAt <= now) {
    const resetAt = now + windowMs;
    memoryStore.set(key, { count: 1, resetAt });
    return { success: true, remaining: limit - 1, resetAt };
  }

  if (entry.count >= limit) {
    return { success: false, remaining: 0, resetAt: entry.resetAt };
  }

  entry.count += 1;
  return { success: true, remaining: limit - entry.count, resetAt: entry.resetAt };
}

// Backend distribué facultatif : si UPSTASH_REDIS_REST_URL/TOKEN sont définis, le
// rate-limiting devient valide sur plusieurs instances (recommandé en production).
// Sans ces variables, on retombe sur un compteur en mémoire (suffisant pour une seule
// instance / un pilote, mais réinitialisé à chaque redéploiement).
async function getUpstashLimiter(limit: number, windowMs: number) {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;

  const { Ratelimit } = await import("@upstash/ratelimit");
  const { Redis } = await import("@upstash/redis");

  return new Ratelimit({
    redis: new Redis({ url, token }),
    limiter: Ratelimit.slidingWindow(limit, `${windowMs} ms`),
    prefix: "ltp",
  });
}

export async function rateLimit(key: string, opts: LimitOptions): Promise<LimitResult> {
  try {
    const limiter = await getUpstashLimiter(opts.limit, opts.windowMs);
    if (limiter) {
      const res = await limiter.limit(key);
      return { success: res.success, remaining: res.remaining, resetAt: res.reset };
    }
  } catch {
    // Upstash indisponible (identifiants invalides, réseau...) : on ne bloque pas
    // l'utilisateur, on retombe sur le compteur en mémoire.
  }
  return memoryLimit(key, opts);
}

export function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}
