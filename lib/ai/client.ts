// =============================================================================
// CivicConnect TN — Safe Groq AI Client & PII Masking Utilities
// =============================================================================

import Groq from 'groq-sdk';

let groqClientInstance: Groq | null = null;

// Primary, fast, fallback, and vision Groq model identifiers
export const GROQ_MODELS = {
  PRIMARY: process.env.GROQ_PRIMARY_MODEL || 'openai/gpt-oss-120b',
  FAST: process.env.GROQ_FAST_MODEL || 'openai/gpt-oss-20b',
  FALLBACK: process.env.GROQ_FALLBACK_MODEL || 'qwen/qwen3.6-27b',
  VISION: process.env.GROQ_VISION_MODEL || 'openai/gpt-oss-120b',
  WHISPER: process.env.GROQ_WHISPER_MODEL || 'whisper-large-v3-turbo',
};

/**
 * Returns an initialized Groq SDK client instance.
 * Returns null if GROQ_API_KEY is not configured or in test environments without credentials.
 */
export function getGroqClient(): Groq | null {
  if (groqClientInstance) return groqClientInstance;

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey || apiKey.trim() === '' || apiKey.includes('placeholder')) {
    return null;
  }

  try {
    groqClientInstance = new Groq({ apiKey });
    return groqClientInstance;
  } catch (err) {
    console.warn('[AI Client] Failed to initialize Groq SDK client:', err);
    return null;
  }
}

/**
 * Redacts Personally Identifiable Information (PII) like 10-digit Indian phone numbers,
 * email addresses, and Aadhaar-style 12-digit numbers to safeguard citizen privacy.
 */
export function maskPii(text: string): string {
  if (!text) return '';

  return (
    text
      // Redact email addresses: e.g. citizen@example.com -> c***n@example.com
      .replace(/([a-zA-Z0-9_\-.]+)@([a-zA-Z0-9_\-.]+)\.([a-zA-Z]{2,5})/gi, (match, user, domain, tld) => {
        if (user.length <= 2) return `***@${domain}.${tld}`;
        return `${user[0]}***${user[user.length - 1]}@${domain}.${tld}`;
      })
      // Redact 10-digit phone numbers (with optional +91 or 0 prefix)
      .replace(/(?:\+91[\s-]?)?[6789]\d{9}/g, '[PHONE_REDACTED]')
      // Redact 12-digit Aadhaar / ID numbers
      .replace(/\b\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g, '[ID_REDACTED]')
  );
}

/**
 * Structured server-side logger that automatically sanitizes inputs to prevent PII leakage into cloud loggers.
 */
export function safeLog(
  level: 'info' | 'warn' | 'error',
  message: string,
  meta?: Record<string, unknown>
): void {
  const sanitizedMeta: Record<string, unknown> = {};

  if (meta) {
    for (const [key, value] of Object.entries(meta)) {
      if (typeof value === 'string') {
        sanitizedMeta[key] = maskPii(value);
      } else if (value && typeof value === 'object') {
        try {
          sanitizedMeta[key] = JSON.parse(maskPii(JSON.stringify(value)));
        } catch {
          sanitizedMeta[key] = '[COMPLEX_OBJECT]';
        }
      } else {
        sanitizedMeta[key] = value;
      }
    }
  }

  const logPayload = {
    timestamp: new Date().toISOString(),
    level,
    message: maskPii(message),
    ...sanitizedMeta,
  };

  if (level === 'error') {
    console.error('[CivicConnect AI Error]', JSON.stringify(logPayload));
  } else if (level === 'warn') {
    console.warn('[CivicConnect AI Warning]', JSON.stringify(logPayload));
  } else {
    console.log('[CivicConnect AI Info]', JSON.stringify(logPayload));
  }
}
