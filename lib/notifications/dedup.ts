// =============================================================================
// CivicConnect TN — Notification Deduplication Engine
// =============================================================================
// Prevents duplicate notification spam within a sliding cooldown window (default 10m).
// Uses composite fingerprinting across user, complaint, event type, and status.

import { DispatchNotificationOptions } from './types';

// In-memory sliding window cache: fingerprint -> timestampMs
const DEDUP_CACHE = new Map<string, number>();

const DEFAULT_COOLDOWN_MS = 10 * 60 * 1000; // 10 minutes

/**
 * Generates an idempotent fingerprint for a notification.
 */
export function generateNotificationFingerprint(
  options: DispatchNotificationOptions,
  windowMinutes: number = 10
): string {
  if (options.idempotencyKey) {
    return `key:${options.idempotencyKey}`;
  }

  const userId = options.userId;
  const complaintId = options.complaintId || 'no_complaint';
  const eventType = options.type;
  const status = (options.metadata?.new_status as string) || '';
  const timeBucket = Math.floor(Date.now() / (windowMinutes * 60 * 1000));

  return `auto:${userId}:${complaintId}:${eventType}:${status}:${timeBucket}`;
}

/**
 * Checks if a notification fingerprint is currently in cooldown.
 */
export function isNotificationDuplicate(
  fingerprint: string,
  cooldownMs: number = DEFAULT_COOLDOWN_MS
): boolean {
  const now = Date.now();
  const lastSeen = DEDUP_CACHE.get(fingerprint);

  if (!lastSeen) return false;

  if (now - lastSeen < cooldownMs) {
    return true;
  }

  // Cooldown expired, cleanup
  DEDUP_CACHE.delete(fingerprint);
  return false;
}

/**
 * Records a notification fingerprint in the sliding window cache.
 */
export function recordNotificationSent(fingerprint: string): void {
  DEDUP_CACHE.set(fingerprint, Date.now());

  // Memory cleanup: remove expired entries if cache grows
  if (DEDUP_CACHE.size > 5000) {
    const now = Date.now();
    DEDUP_CACHE.forEach((ts, key) => {
      if (now - ts > DEFAULT_COOLDOWN_MS * 2) {
        DEDUP_CACHE.delete(key);
      }
    });
  }
}

/**
 * Clears deduplication cache (useful for automated testing).
 */
export function clearDedupCache(): void {
  DEDUP_CACHE.clear();
}
