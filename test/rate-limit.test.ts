import { describe, it, expect } from "vitest";
import { rateLimit } from "@/lib/rate-limit";

describe("rateLimit (mémoire, sans Upstash configuré)", () => {
  it("autorise jusqu'à la limite puis bloque", async () => {
    const key = `test:${Math.random()}`;
    const opts = { limit: 3, windowMs: 60_000 };

    expect((await rateLimit(key, opts)).success).toBe(true);
    expect((await rateLimit(key, opts)).success).toBe(true);
    expect((await rateLimit(key, opts)).success).toBe(true);
    const fourth = await rateLimit(key, opts);
    expect(fourth.success).toBe(false);
    expect(fourth.remaining).toBe(0);
  });

  it("isole les compteurs par clé", async () => {
    const opts = { limit: 1, windowMs: 60_000 };
    const a = `test-a:${Math.random()}`;
    const b = `test-b:${Math.random()}`;

    expect((await rateLimit(a, opts)).success).toBe(true);
    expect((await rateLimit(a, opts)).success).toBe(false);
    expect((await rateLimit(b, opts)).success).toBe(true);
  });

  it("réinitialise le compteur après la fenêtre", async () => {
    const key = `test-window:${Math.random()}`;
    const opts = { limit: 1, windowMs: 50 };

    expect((await rateLimit(key, opts)).success).toBe(true);
    expect((await rateLimit(key, opts)).success).toBe(false);

    await new Promise((resolve) => setTimeout(resolve, 60));

    expect((await rateLimit(key, opts)).success).toBe(true);
  });
});
