import { useState, useRef, useEffect } from 'react'
import { ChevronDown, LogOut } from 'lucide-react'
import { useNavigate, Link, useLocation } from '@tanstack/react-router'
import { authService } from '../../services/auth.service'
import type { User } from '../../services/auth.service'
import { Logo } from '../ui/Logo'
import { Button } from '../ui/Button'
import { useHeader } from '../../context/HeaderContext'

interface DashboardHeaderProps {
  user: User
}

function getInitials(user: User): string {
  if (user.full_name) {
    return user.full_name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }
  return user.email[0].toUpperCase()
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({ user }) => {
  const displayName = user.full_name || user.email
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()
  const location = useLocation()
  const { title } = useHeader()

  const isProjectDetailPage = /^\/dashboard\/projects\/[^\/]+$/.test(
    location.pathname,
  )

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setIsDropdownOpen(false)
      }
    }
    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isDropdownOpen])

  const handleLogout = () => {
    authService.logout()
    navigate({ to: '/public/signin' })
  }

  const navItems = 
   [
        { label: 'Dashboard', to: '/dashboard' },
        { label: 'Projects', to: '/dashboard/projects' },
      ]

  return (
    <header className="h-14 border-b border-border-default bg-(--header-bg) backdrop-blur-md sticky top-0 z-40 flex items-center justify-between px-6 shrink-0 font-sans">
      <div className="flex items-center gap-4">
        <Link to="/dashboard" className="flex items-center">
          <Logo showText={true} />
        </Link>
        {isProjectDetailPage && title && (
          <>
            <div className="h-4 w-px bg-border-default" />
            <span className="text-sm font-semibold text-text-secondary">{title}</span>
          </>
        )}
      </div>

      <nav className="flex items-center gap-1">
        {navItems.map((item) => {
          const isActive =
            item.to === '/dashboard'
              ? location.pathname === '/dashboard' ||
                location.pathname.startsWith('/dashboard/projects/')
              : location.pathname === item.to
          return (
            <Link
              key={item.label}
              to={item.to}
              className={`px-5 py-1.5 text-[13px] font-semibold tracking-tight transition-all relative rounded-lg ${
                isActive
                  ? 'text-text-primary bg-surface-muted'
                  : 'text-text-secondary hover:text-text-primary hover:bg-surface-muted'
              }`}
            >
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="flex items-center gap-3">


        {/* User Avatar Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <Button
            variant="unstyled"
            onClick={() => setIsDropdownOpen((prev) => !prev)}
            className="flex items-center gap-1.5 group p-1 rounded-full hover:bg-surface-hover transition-colors"
          >
            <div className="relative">
              {user.avatar_url ? (
                <img
                  src={user.avatar_url}
                  alt="Profile"
                  className="w-8 h-8 rounded-full border border-border-default object-cover"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-accent-foreground text-[10px] font-black">
                  {getInitials(user)}
                </div>
              )}
            </div>
            <ChevronDown
              className={`w-3.5 h-3.5 text-text-secondary transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}
            />
          </Button>

          {isDropdownOpen && (
            <div className="absolute right-0 top-full mt-2 w-48 bg-surface border border-border-default rounded-xl shadow-xl py-2 z-50 animate-in fade-in zoom-in-95 duration-150 overflow-hidden">
              <div className="px-4 py-2 border-b border-border-default mb-1">
                <p className="text-xs font-bold text-text-primary truncate">
                  {displayName}
                </p>
                <p className="text-[10px] text-text-secondary truncate">
                  {user.email}
                </p>
              </div>
              {/* <div className="px-4 py-2 border-b border-border-default mb-1">
                <ThemeToggle />
              </div> */}
              <Button
                variant="unstyled"
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-4 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
