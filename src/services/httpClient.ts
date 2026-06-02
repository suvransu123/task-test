/**
 * Industrial-standard HttpClient using fetch.
 * Provides a clean interface for API calls with built-in error handling,
 * HttpOnly cookie support, and automatic token refresh.
 */

import { tokenService } from './token.service'

export interface ApiResponse<T> {
  data: T | null
  error: string | null
  status: number
  validationErrors?: Record<string, string>
}

class HttpClient {
  private baseUrl: string

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl
  }

  private async request<T>(
    path: string,
    options: RequestInit = {},
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${path}`

    // Proactively refresh the token if it is about to expire.
    if (await tokenService.shouldRefresh()) {
      await tokenService.refreshToken()
    }

    const token = await tokenService.getToken()
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      accept: 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers as Record<string, string> | undefined),
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        credentials: 'include', // send / receive HttpOnly cookies
      })

      // -- 401 handling: attempt a single token refresh then retry ----------
      if (response.status === 401 && !path.startsWith('/auth/')) {
        const newToken = await tokenService.refreshToken()
        if (newToken) {
          const retryHeaders: Record<string, string> = {
            'Content-Type': 'application/json',
            accept: 'application/json',
            Authorization: `Bearer ${newToken}`,
            ...(options.headers as Record<string, string> | undefined),
          }

          const retryResponse = await fetch(url, {
            ...options,
            headers: retryHeaders,
            credentials: 'include',
          })

          return this._parseResponse<T>(retryResponse)
        }
      }

      return this._parseResponse<T>(response)
    } catch {
      return {
        data: null,
        error: 'Unknown network error',
        status: 0,
      }
    }
  }

  // -----------------------------------------------------------------------
  // Response parsing helper
  // -----------------------------------------------------------------------

  private async _parseResponse<T>(response: Response): Promise<ApiResponse<T>> {
    const status = response.status
    let data = null
    let error = null
    let validationErrors: Record<string, string> | undefined

    if (response.ok) {
      const text = await response.text()
      if (text) {
        data = JSON.parse(text) as T
      }
    } else {
      const errorData = await response.json().catch(() => null)

      // Handle validation errors (422 Unprocessable Entity)
      if (response.status === 422 && Array.isArray(errorData?.detail)) {
        validationErrors = {}
        for (const err of errorData.detail) {
          // Extract field name from location (e.g., ["body", "password"] -> "password")
          const field = Array.isArray(err.loc)
            ? err.loc[err.loc.length - 1]
            : null
          if (field && typeof field === 'string') {
            validationErrors[field] = err.msg
          }
        }
        // Set main error to first validation error message
        const firstError = errorData.detail[0]
        error = firstError?.msg || 'Validation failed'
      } else {
        error = errorData?.detail || errorData?.message || response.statusText
      }
    }

    return { data, error, status, validationErrors }
  }

  // -----------------------------------------------------------------------
  // Public convenience methods
  // -----------------------------------------------------------------------

  public get<T>(path: string, options?: RequestInit) {
    return this.request<T>(path, { ...options, method: 'GET' })
  }

  public post<T>(path: string, body: unknown, options?: RequestInit) {
    return this.request<T>(path, {
      ...options,
      method: 'POST',
      body: JSON.stringify(body),
    })
  }

  public put<T>(path: string, body: unknown, options?: RequestInit) {
    return this.request<T>(path, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(body),
    })
  }

  public patch<T>(path: string, body: unknown, options?: RequestInit) {
    return this.request<T>(path, {
      ...options,
      method: 'PATCH',
      body: JSON.stringify(body),
    })
  }

  public delete<T>(path: string, options?: RequestInit) {
    return this.request<T>(path, { ...options, method: 'DELETE' })
  }
}

export const httpClient = new HttpClient(import.meta.env.VITE_API_BASE_URL)
