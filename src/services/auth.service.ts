import { httpClient } from './httpClient'
import { tokenService } from './token.service'

export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  access_token: string
  token_type: string
}

export interface User {
  id: string
  email: string
  full_name?: string
  avatar_url?: string
}

export interface SignUpRequest {
  email: string
  full_name: string
  password: string
}

export interface AuthProvider {
  name: string
  display_name: string
}

export interface SocialLoginResponse {
  access_token: string
  token_type: string
  user: User
}

export const authService = {
  /**
   * Performs user signup via the API.
   */
  async signup(data: SignUpRequest) {
    return httpClient.post<User>('/users/signup', data)
  },

  /**
   * Performs user login via the API.
   */
  async login(credentials: LoginRequest) {
    return httpClient.post<LoginResponse>('/users/login', credentials)
  },

  /**
   * Fetches the current user profile.
   */
  async getMe() {
    return httpClient.get<User>('/users/me')
  },

  /**
   * Fetches available social auth providers from the backend.
   */
  async getAuthProviders() {
    return httpClient.get<{ providers: AuthProvider[] }>('/auth/providers')
  },

  /**
   * Initiates social login by redirecting the browser to the provider's OAuth URL.
   * The backend at /auth/social/{provider} will redirect to the WorkOS authorization URL.
   */
  initiateSocialLogin(provider: string) {
    const baseUrl = import.meta.env.VITE_API_BASE_URL || ''
    window.location.href = `${baseUrl}/auth/social/${provider}`
  },

  /**
   * Handles the social login callback by exchanging the authorization code for tokens.
   */
  async handleSocialLogin(provider: string, code: string) {
    return httpClient.post<SocialLoginResponse>('/auth/social', {
      provider,
      code,
    })
  },

  /**
   * Performs server-side logout to clear HttpOnly cookies, then clears local state.
   */
  async logout() {
    await tokenService.clearToken()
  },

  /**
   * Simple check if the user is logged in. Delegates to tokenService.
   * Used by the router context for authentication guards.
   */
  isAuthenticated() {
    return tokenService.isAuthenticated()
  },
}
