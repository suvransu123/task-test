import React, { useState, useEffect } from 'react'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Checkbox } from '../../components/ui/Checkbox'
import { SocialButton } from '../../components/ui/SocialButton'
import { Github, Globe, Building2, AlertCircle } from 'lucide-react'
import { authService } from '../../services/auth.service'
import { tokenService } from '../../services/token.service'
import type { AuthProvider } from '../../services/auth.service'
import { useNavigate, useSearch, Link } from '@tanstack/react-router'

// Map provider names to icons and labels
const PROVIDER_CONFIG: Record<
  string,
  { icon: React.ReactNode; label: string }
> = {
  google: {
    icon: <Globe className="w-5 h-5 text-text-muted" />,
    label: 'Google',
  },
  github: {
    icon: <Github className="w-5 h-5 text-text-muted" />,
    label: 'GitHub',
  },
  microsoft: {
    icon: <Building2 className="w-5 h-5 text-text-muted" />,
    label: 'Microsoft',
  },
}

// Default providers to show when the backend doesn't return any
const DEFAULT_PROVIDERS: AuthProvider[] = [
  { name: 'google', display_name: 'Google' },
  { name: 'github', display_name: 'GitHub' },
  { name: 'microsoft', display_name: 'Microsoft' },
]

export const LoginRightContent: React.FC = () => {
  const navigate = useNavigate()
  const search = useSearch({ strict: false }) as { workspaceId?: string; error?: string } | null
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(search?.error ?? null)
  const [providers, setProviders] = useState<AuthProvider[]>(DEFAULT_PROVIDERS)
  const [socialLoadingProvider, setSocialLoadingProvider] = useState<
    string | null
  >(null)

  // Fetch available auth providers on mount
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const { data } = await authService.getAuthProviders()
        if (!cancelled && data?.providers && data.providers.length > 0) {
          setProviders(data.providers)
        }
      } catch {
        // Backend may not have /auth/providers yet — use defaults
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const { data, error: apiError } = await authService.login({
        email,
        password,
      })

      if (apiError) {
        setError(apiError)
      } else if (data) {
        tokenService.setToken(data.access_token)
        navigate({ to: '/dashboard' })
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSocialLogin = (providerName: string) => {
    setSocialLoadingProvider(providerName)
    try {
      authService.initiateSocialLogin(providerName)
    } catch {
      setError('Unable to start social login. Please try again.')
      setSocialLoadingProvider(null)
    }
  }

  return (
    <div className="w-full max-w-sm flex flex-col h-full">
      {/* Top Navigation */}
      <nav className="absolute top-8 right-8 flex items-center gap-6"></nav>

      <div className="flex-1 flex flex-col justify-center">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-black text-text-primary tracking-tight font-display">
            Welcome back
          </h2>
          <p className="text-[15px] text-text-secondary mt-2 font-medium">
            Sign in to your EngineerOS workspace
          </p>
        </div>

        {/* Error Alert */}
        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex gap-3 text-sm text-red-500 animate-in fade-in slide-in-from-top-2 items-center">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p className="font-semibold text-left leading-relaxed">{error}</p>
          </div>
        )}
        {/* Social Buttons */}
        <div className="flex gap-4 mb-8">
          {providers.map((provider) => {
            const config = PROVIDER_CONFIG[provider.name] ?? {
              icon: <Globe className="w-5 h-5 text-text-muted" />,
              label: provider.display_name,
            }
            return (
              <SocialButton
                key={provider.name}
                icon={config.icon}
                label={config.label}
                onClick={() => handleSocialLogin(provider.name)}
                isLoading={socialLoadingProvider === provider.name}
                className="rounded-2xl border-border-default hover:border-accent hover:bg-surface-muted"
              />
            )
          })}
        </div>

        <div className="relative mb-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border-default"></div>
          </div>
          <div className="relative flex justify-center text-[10px] font-black uppercase tracking-widest">
            <span className="bg-surface px-4 text-text-muted">
              Or continue with email
            </span>
          </div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <Input
            label="Work email"
            type="email"
            placeholder="finance@celllabs.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={isLoading}
            className="rounded-2xl h-14 border-border-default focus:border-[#7C3AED] focus:ring-[#7C3AED]/20 transition-all"
          />
          <Input
            label="Password"
            type="password"
            placeholder="••••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={isLoading}
            className="rounded-2xl h-14 border-border-default focus:border-[#7C3AED] focus:ring-[#7C3AED]/20 transition-all"
          />

          <div className="flex items-center justify-between pt-2">
            <Checkbox
              label="Remember me"
              disabled={isLoading}
              className="rounded-md border-border-default"
            />
            <a
              href="#"
              className="text-xs font-bold text-text-muted hover:text-accent transition-colors underline underline-offset-4"
            >
              Forgot password?
            </a>
          </div>

          <Button
            type="submit"
            fullWidth
            isLoading={isLoading}
            className="h-14 bg-accent hover:bg-accent/90 text-accent-foreground rounded-2xl mt-8 text-[15px] font-black shadow-lg"
          >
            Sign in
          </Button>
        </form>

        <p className="text-[14px] text-text-secondary text-center mt-10 font-medium">
          Don't have an account?{' '}
          <Link
            to="/public/signup"
            className="font-bold text-accent hover:underline"
          >
            Start for free
          </Link>
        </p>
      </div>
    </div>
  )
}
