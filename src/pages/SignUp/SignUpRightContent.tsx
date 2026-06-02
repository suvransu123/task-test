import React, { useState } from 'react'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { SocialButton } from '../../components/ui/SocialButton'
import {
  Github,
  Globe,
  Building2,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react'
import { authService } from '../../services/auth.service'
import { useNavigate, Link } from '@tanstack/react-router'

export const SignUpRightContent: React.FC = () => {
  const navigate = useNavigate()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setFieldErrors({})

    try {
      const {
        data,
        error: apiError,
        validationErrors,
      } = await authService.signup({
        email,
        full_name: fullName,
        password,
      })

      if (validationErrors && Object.keys(validationErrors).length > 0) {
        setFieldErrors(validationErrors)
        // Set a general error message as well
        setError(Object.values(validationErrors)[0])
      } else if (apiError) {
        setError(apiError)
      } else if (data) {
        setSuccess(true)
        // Automatically log in after signup or redirect to login
        setTimeout(() => {
          navigate({ to: '/public/signin' })
        }, 2000)
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full max-w-sm flex flex-col h-full">
      {/* Top Navigation */}

      <div className="flex-1 flex flex-col justify-center">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-black text-text-primary tracking-tight font-display">
            Create an account
          </h2>
          <p className="text-[15px] text-text-secondary mt-2 font-medium">
            Join EngineerOS and start building today
          </p>
        </div>

        {/* Success Message */}
        {success && (
          <div className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-2xl flex gap-3 text-sm text-green-500 animate-in fade-in slide-in-from-top-2 text-center items-center">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <p className="font-semibold text-left leading-relaxed">
              Account created successfully! Redirecting to sign in...
            </p>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex gap-3 text-sm text-red-500 animate-in fade-in slide-in-from-top-2 items-center">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p className="font-semibold text-left leading-relaxed">{error}</p>
          </div>
        )}

        {/* Social Buttons */}
        <div className="flex gap-4 mb-8">
          <SocialButton
            icon={<Globe className="w-5 h-5 text-text-secondary" />}
            className="rounded-2xl border-border-default hover:border-accent hover:bg-surface-muted"
          />
          <SocialButton
            icon={<Github className="w-5 h-5 text-text-secondary" />}
            className="rounded-2xl border-border-default hover:border-accent hover:bg-surface-muted"
          />
          <SocialButton
            icon={<Building2 className="w-5 h-5 text-text-secondary" />}
            className="rounded-2xl border-border-default hover:border-accent hover:bg-surface-muted"
          />
        </div>

        <div className="relative mb-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border-default"></div>
          </div>
          <div className="relative flex justify-center text-[10px] font-black uppercase tracking-widest">
            <span className="bg-surface px-4 text-text-muted">
              Or sign up with email
            </span>
          </div>
        </div>

        {/* Signup Form */}
        {!success && (
          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              label="Full name"
              type="text"
              placeholder="John Doe"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              disabled={isLoading}
              error={fieldErrors.full_name}
              className="rounded-2xl h-14 border-border-default focus:border-[#7C3AED] focus:ring-[#7C3AED]/20 transition-all"
            />
            <Input
              label="Work email"
              type="email"
              placeholder="name@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
              error={fieldErrors.email}
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
              error={fieldErrors.password}
              className="rounded-2xl h-14 border-border-default focus:border-[#7C3AED] focus:ring-[#7C3AED]/20 transition-all"
            />

            <Button
              type="submit"
              fullWidth
              isLoading={isLoading}
              className="h-14 bg-accent hover:bg-accent/90 text-accent-foreground rounded-2xl mt-8 text-[15px] font-black shadow-lg"
            >
              Sign up
            </Button>
          </form>
        )}

        <p className="text-[14px] text-text-secondary text-center mt-10 font-medium">
          Already have an account?{' '}
          <Link
            to="/public/signin"
            className="font-bold text-accent hover:underline"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
