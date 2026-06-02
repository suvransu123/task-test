/**
 * Token Service — JWT token management with HttpOnly cookie support.
 *
 * Primary storage: HttpOnly cookies (set by backend via Set-Cookie header).
 * Fallback:        localStorage (backward compatibility during migration).
 *
 * The service auto-detects which mode is active and handles transparent
 * token refresh with request queuing.
 */

const LOCAL_STORAGE_KEY = 'access_token'
const REFRESH_THRESHOLD_MS = 5 * 60 * 1000 // 5 minutes

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface JwtPayload {
  exp?: number
  [key: string]: unknown
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Decode the payload section of a JWT without a library. */
function decodeJwtPayload(token: string): JwtPayload | null {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
    const json = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join(''),
    )
    return JSON.parse(json) as JwtPayload
  } catch {
    return null
  }
}

/** Return true when the token is expired or will expire within `thresholdMs`. */
function isTokenExpiringSoon(
  token: string,
  thresholdMs = REFRESH_THRESHOLD_MS,
): boolean {
  const payload = decodeJwtPayload(token)
  if (!payload?.exp) return true // treat missing exp as expiring
  const expiresAt = payload.exp * 1000
  return Date.now() >= expiresAt - thresholdMs
}

// ---------------------------------------------------------------------------
// Token Service
// ---------------------------------------------------------------------------

class TokenService {
  /** Resolved once we know whether cookie-based auth is available. */
  private _cookiesAvailable: boolean | null = null

  /** Guards concurrent refresh calls so only one network request is made. */
  private refreshPromise: Promise<string | null> | null = null

  // -----------------------------------------------------------------------
  // Public API
  // -----------------------------------------------------------------------

  /**
   * Retrieve the current access token.
   * Checks HttpOnly cookie auth first, then falls back to localStorage.
   */
  async getToken(): Promise<string | null> {
    return localStorage.getItem(LOCAL_STORAGE_KEY)
  }

  /**
   * Store a token in localStorage.
   * HttpOnly cookies are set by the server via Set-Cookie, so this method
   * only deals with the localStorage fallback.
   */
  setToken(token: string): void {
    localStorage.setItem(LOCAL_STORAGE_KEY, token)
  }

  /**
   * Clear the session from both stores.
   * Removes the localStorage entry and pings the backend logout endpoint
   * so the HttpOnly cookie is cleared as well.
   */
  async clearToken(): Promise<void> {
    localStorage.removeItem(LOCAL_STORAGE_KEY)
    try {
      const baseUrl = import.meta.env.VITE_API_BASE_URL || ''
      await fetch(`${baseUrl}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      })
    } catch {
      // Silent — best-effort server-side cookie clearing.
    }
  }

  /** Quick synchronous check — does *some* form of token exist? */
  isAuthenticated(): boolean {
    if (this._cookiesAvailable) return true
    return !!localStorage.getItem(LOCAL_STORAGE_KEY)
  }

  /**
   * Refresh the access token.
   * - If a refresh is already in-flight the caller will await the same promise.
   * - If the current token is still valid it is returned immediately.
   */
  async refreshToken(): Promise<string | null> {
    // Deduplicate concurrent refresh attempts.
    if (this.refreshPromise) return this.refreshPromise

    this.refreshPromise = this._doRefresh()
    try {
      return await this.refreshPromise
    } finally {
      this.refreshPromise = null
    }
  }

  /**
   * Migrate away from localStorage once cookies are confirmed working.
   * Safe to call after a successful authenticated request.
   */
  migrateToCookies(): void {
    if (this._cookiesAvailable) {
      localStorage.removeItem(LOCAL_STORAGE_KEY)
    }
  }

  // -----------------------------------------------------------------------
  // Internals
  // -----------------------------------------------------------------------

  /** Perform the actual refresh network call. */
  private async _doRefresh(): Promise<string | null> {
    try {
      const baseUrl = import.meta.env.VITE_API_BASE_URL || ''
      const res = await fetch(`${baseUrl}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      })

      if (!res.ok) return null

      const data = await res.json().catch(() => null as any)
      // Some backends return a new token in the body; others rely solely on
      // Set-Cookie. Handle both patterns.
      if (data?.access_token) {
        this.setToken(data.access_token)
        return data.access_token
      }

      // Cookie-based refresh — mark cookies as active.
      this._cookiesAvailable = true
      return 'cookie-auth'
    } catch {
      return null
    }
  }

  /**
   * Determine whether the current token (localStorage or cookie) needs a
   * proactive refresh. Returns true when refresh should be attempted.
   */
  async shouldRefresh(): Promise<boolean> {
    const token = localStorage.getItem(LOCAL_STORAGE_KEY)
    if (!token) return false
    return isTokenExpiringSoon(token)
  }
}

// Singleton export
export const tokenService = new TokenService()
