// =============================================================================
// CivicConnect TN — API Types
// =============================================================================

/** Standard API success response */
export interface ApiResponse<T = unknown> {
  success: true;
  data: T;
}

/** Standard API error response */
export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

/** Paginated list response */
export interface PaginatedResponse<T> {
  success: true;
  data: T[];
  pagination: {
    page: number;
    per_page: number;
    total: number;
    total_pages: number;
  };
}

/** Type union for all API responses */
export type ApiResult<T = unknown> = ApiResponse<T> | ApiError;
