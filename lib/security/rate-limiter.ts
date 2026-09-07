// =============================================================================
// CivicConnect TN — Sliding-Window Rate Limiter Engine
// =============================================================================
// High-performance, in-memory sliding window rate limiter for Next.js Route Handlers.
// Prevents brute-force attacks, DDoS, API spamming, and AI endpoint token abuse.

export interface RateLimiterOptions {
  windowMs: number;
  maxRequests: number;
  errorMessage?: string;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  retryAfterSeconds?: number;
}

class InMemoryRateLimiter {
  private store = new Map<string, { count: number; resetAt: number }>();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Run cleanup every 2 minutes
    if (typeof setInterval !== 'undefined') {
      this.cleanupInterval = setInterval(() => {
        const now = Date.now();
        for (const [key, record] of this.store.entries()) {
          if (now > record.resetAt) {
            this.store.delete(key);
          }
        }
      }, 2 * 60 * 1000);

      // Unref interval so it does not block Node process exit
      if (this.cleanupInterval && typeof this.cleanupInterval.unref === 'function') {
        this.cleanupInterval.unref();
      }
    }
  }

  /**
   * Checks if a request key exceeds the specified rate limits.
   */
  public check(key: string, options: RateLimiterOptions): RateLimitResult {
    const now = Date.now();
    const { windowMs, maxRequests } = options;

    const existing = this.store.get(key);

    if (!existing || now > existing.resetAt) {
      const resetAt = now + windowMs;
      this.store.set(key, { count: 1, resetAt });
      return {
        allowed: true,
        remaining: maxRequests - 1,
        resetAt,
      };
    }

    if (existing.count >= maxRequests) {
      const retryAfterSeconds = Math.max(1, Math.ceil((existing.resetAt - now) / 1000));
      return {
        allowed: false,
        remaining: 0,
        resetAt: existing.resetAt,
        retryAfterSeconds,
      };
    }

    existing.count += 1;
    return {
      allowed: true,
      remaining: maxRequests - existing.count,
      resetAt: existing.resetAt,
    };
  }

  /**
   * Resets rate limit for a specific key (useful for tests).
   */
  public reset(key: string): void {
    this.store.delete(key);
  }

  /**
   * Clears the entire store.
   */
  public clear(): void {
    this.store.clear();
  }
}

export const GlobalRateLimiter = new InMemoryRateLimiter();

/**
 * Helper to extract client IP from request headers.
 */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return request.headers.get('x-real-ip') || '127.0.0.1';
}
