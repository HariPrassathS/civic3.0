// =============================================================================
// CivicConnect TN — Media Upload API Route (/api/upload)
// =============================================================================
// Secure, validated media upload handler with extension whitelisting,
// SVG XSS rejection, rate limiting, and UUID-based storage key generation.

import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { GlobalRateLimiter, getClientIp } from '@/lib/security/rate-limiter';
import crypto from 'crypto';

const ALLOWED_IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp']);
const ALLOWED_VIDEO_EXTENSIONS = new Set(['.mp4', '.webm', '.mov']);

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'video/mp4',
  'video/webm',
  'video/quicktime',
]);

const MAX_IMAGE_BYTES = 10 * 1024 * 1024; // 10MB
const MAX_VIDEO_BYTES = 50 * 1024 * 1024; // 50MB

export async function POST(request: Request) {
  try {
    // 1. Rate Limiting: 15 uploads / min per IP
    const clientIp = getClientIp(request);
    const rateLimit = GlobalRateLimiter.check(`upload:${clientIp}`, {
      windowMs: 60 * 1000,
      maxRequests: 15,
    });

    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: `Upload rate limit exceeded. Please retry in ${rateLimit.retryAfterSeconds} seconds.`,
        },
        { status: 429, headers: { 'Retry-After': String(rateLimit.retryAfterSeconds) } }
      );
    }

    // 2. Parse Form Data
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file || typeof file.name !== 'string') {
      return NextResponse.json(
        { success: false, error: 'No valid file provided in upload payload' },
        { status: 400 }
      );
    }

    // 3. Extract and Validate Extension
    const originalName = file.name.trim();
    const lastDotIndex = originalName.lastIndexOf('.');
    if (lastDotIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'File must have a valid extension (.jpg, .png, .webp, .mp4, etc.)' },
        { status: 400 }
      );
    }

    const extension = originalName.substring(lastDotIndex).toLowerCase();
    const isImageExt = ALLOWED_IMAGE_EXTENSIONS.has(extension);
    const isVideoExt = ALLOWED_VIDEO_EXTENSIONS.has(extension);

    if (!isImageExt && !isVideoExt) {
      return NextResponse.json(
        {
          success: false,
          error: `Unsupported file extension '${extension}'. Allowed: .jpg, .jpeg, .png, .webp, .mp4, .webm, .mov`,
        },
        { status: 400 }
      );
    }

    // 4. Validate MIME Type (Reject SVG, HTML, Executables)
    const mimeType = (file.type || '').toLowerCase();
    if (mimeType === 'image/svg+xml' || !ALLOWED_MIME_TYPES.has(mimeType)) {
      return NextResponse.json(
        {
          success: false,
          error: `Unsupported or prohibited MIME type '${file.type}'. SVG and executable scripts are blocked for security.`,
        },
        { status: 400 }
      );
    }

    // 5. Size Validation
    const isVideo = isVideoExt || mimeType.startsWith('video/');
    const maxSizeBytes = isVideo ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES;
    if (file.size > maxSizeBytes || file.size <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: `File size (${(file.size / (1024 * 1024)).toFixed(1)}MB) exceeds allowable limit of ${
            isVideo ? '50MB' : '10MB'
          }`,
        },
        { status: 400 }
      );
    }

    // 6. Generate Cryptographic Secure Random Key (Prevent Path Traversal & Collision)
    const secureId = crypto.randomUUID();
    const timestamp = Date.now();
    const storagePath = `complaints/${timestamp}_${secureId}${extension}`;

    let publicUrl: string;
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    try {
      const supabase = createAdminClient();
      const BUCKET_NAME = 'complaint-evidence';

      const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(storagePath, buffer, {
          contentType: mimeType,
          upsert: true,
        });

      if (!error && data) {
        // Generate a signed URL for secure immediate preview (valid for 24 hours)
        const { data: signedData, error: signError } = await supabase.storage
          .from(BUCKET_NAME)
          .createSignedUrl(storagePath, 86400);

        if (!signError && signedData?.signedUrl) {
          publicUrl = signedData.signedUrl;
        } else {
          const { data: publicData } = supabase.storage
            .from(BUCKET_NAME)
            .getPublicUrl(storagePath);
          publicUrl = publicData.publicUrl;
        }
      } else {
        console.warn('[Upload Supabase Storage Warning]:', error?.message);
        publicUrl = `data:${mimeType};base64,${buffer.toString('base64')}`;
      }
    } catch (uploadErr) {
      console.warn('[Upload Supabase Exception]:', uploadErr);
      // Offline / Dev fallback
      publicUrl = `data:${mimeType};base64,${buffer.toString('base64')}`;
    }

    return NextResponse.json({
      success: true,
      data: {
        url: publicUrl,
        storage_path: storagePath,
        media_type: isVideo ? 'video' : 'image',
        file_name: originalName,
        size_bytes: file.size,
      },
    });
  } catch (error) {
    console.error('[/api/upload error]:', error);
    return NextResponse.json(
      { success: false, error: 'File upload processing failed' },
      { status: 500 }
    );
  }
}
