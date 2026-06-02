import React from 'react'
import { Search } from 'lucide-react'

interface SearchInputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export const SearchInput: React.FC<SearchInputProps> = ({
  className = '',
  ...props
}) => {
  return (
    <div className={`relative flex-1 ${className}`}>
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted group-focus-within:text-accent transition-colors" />
      <input
        type="text"
        className="w-full h-full pl-12 pr-6 bg-surface-muted text-text-primary border border-border-default rounded-2xl text-[14px] font-medium outline-hidden focus:ring-2 focus:ring-accent/10 focus:border-accent/30 transition-all placeholder:text-text-muted placeholder:font-medium"
        {...props}
      />
    </div>
  )
}
