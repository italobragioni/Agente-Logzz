// Rate limit básico em memória (por instância serverless).
// Suficiente como proteção simples no MVP. Para produção pesada, trocar
// futuramente por Upstash/Redis.

const hits = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(
  key: string,
  limit = 30,
  windowMs = 60_000
): { allowed: boolean } {
  const now = Date.now();
  const entry = hits.get(key);

  if (!entry || now > entry.resetAt) {
    hits.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true };
  }

  entry.count += 1;
  if (entry.count > limit) {
    return { allowed: false };
  }
  return { allowed: true };
}
