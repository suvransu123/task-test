import React from 'react'

interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string
}

export const Checkbox: React.FC<CheckboxProps> = ({
  label,
  id,
  className = '',
  ...props
}) => {
  const checkboxId =
    id || `checkbox-${label.toLowerCase().replace(/\s+/g, '-')}`

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <input
        type="checkbox"
        id={checkboxId}
        className="h-4 w-4 rounded border-border-default text-accent focus:ring-accent/30 cursor-pointer bg-surface"
        {...props}
      />
      <label
        htmlFor={checkboxId}
        className="text-sm text-text-secondary cursor-pointer select-none"
      >
        {label}
      </label>
    </div>
  )
}
