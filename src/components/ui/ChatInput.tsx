import React, { useRef, useEffect, useState, useCallback } from 'react'
import { Send, Cpu } from 'lucide-react'
import { MentionDropdown } from './MentionDropdown'
import { Button } from './Button'
import { Dropdown } from './Dropdown'
import type { DropdownItem } from './Dropdown'

const MENTION_TRIGGER_RE = /(?:^|[\s])@([\w\s-]*)$/

interface ChatInputProps {
  value: string
  onChange: (value: string) => void
  onSend: () => void
  placeholder?: string
  disabled?: boolean
  models: string[]
  selectedModel: string
  onModelChange: (model: string) => void
  mentionKeys?: string[]
}

export const ChatInput: React.FC<ChatInputProps> = ({
  value,
  onChange,
  onSend,
  placeholder = 'Describe your requirements...',
  disabled = false,
  models,
  selectedModel,
  onModelChange,
  mentionKeys = [],
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)

  const [mentionQuery, setMentionQuery] = useState<string | null>(null)
  const [mentionOpen, setMentionOpen] = useState(false)
  const mentionStartRef = useRef<number>(-1)

  useEffect(() => {
    const textarea = textareaRef.current
    if (!textarea) return

    const cursorPos = textarea.selectionStart ?? value.length
    const textUpToCursor = value.slice(0, cursorPos)

    const match = MENTION_TRIGGER_RE.exec(textUpToCursor)
    if (match) {
      const query = match[1]
      const matchStart = textUpToCursor.lastIndexOf('@')
      mentionStartRef.current = matchStart
      setMentionQuery(query)
      setMentionOpen(true)
    } else {
      setMentionQuery(null)
      setMentionOpen(false)
      mentionStartRef.current = -1
    }
  }, [value])

  useEffect(() => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`
    }
  }, [value])

  const handleMentionSelect = useCallback(
    (item: string) => {
      const start = mentionStartRef.current
      if (start < 0) return

      const before = value.slice(0, start)
      const after = value.slice(start).replace(MENTION_TRIGGER_RE, '')
      const newValue = `${before}@${item}${after}`
      onChange(newValue)

      setMentionOpen(false)
      setMentionQuery(null)
      mentionStartRef.current = -1

      setTimeout(() => {
        const textarea = textareaRef.current
        if (textarea) {
          textarea.focus()
          const pos = before.length + 1 + item.length
          textarea.setSelectionRange(pos, pos)
        }
      }, 0)
    },
    [value, onChange],
  )

  const handleDismiss = useCallback(() => {
    setMentionOpen(false)
    setMentionQuery(null)
  }, [])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (
      mentionOpen &&
      (e.key === 'ArrowUp' ||
        e.key === 'ArrowDown' ||
        e.key === 'Tab' ||
        e.key === 'Enter' ||
        e.key === 'Escape')
    ) {
      return
    }

    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      onSend()
    }
  }

  const modelItems: DropdownItem[] = models.map((m) => ({
    id: m,
    label: m,
    icon: Cpu,
  }))

  return (
    <div className="p-0 bg-transparent group/input px-6 pb-6">
      <div
        ref={wrapperRef}
        className="relative flex flex-col bg-surface rounded-[28px] shadow-[0_24px_48px_rgba(0,0,0,0.08)] transition-all duration-500 overflow-visible group-focus-within/input:shadow-[0_32px_64px_rgba(94,67,251,0.12)] group-focus-within/input:-translate-y-1 select-none"
      >
        {/* Main Writing Area */}
        <div className="relative w-full px-8 pt-7 pb-2">
          {mentionOpen && mentionKeys.length > 0 && (
            <MentionDropdown
              items={mentionKeys}
              query={mentionQuery ?? ''}
              onSelect={handleMentionSelect}
              onDismiss={handleDismiss}
            />
          )}

          <textarea
            ref={textareaRef}
            rows={1}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            className="w-full bg-transparent border-0 ring-0 outline-none focus:ring-0 focus:outline-none text-[16px] leading-[1.6] text-text-primary font-medium placeholder:text-text-muted disabled:opacity-50 resize-none max-h-55 overflow-y-auto scrollbar-hide selection:bg-accent/10 p-0 appearance-none shadow-none"
            style={{ border: 'none', boxShadow: 'none', outline: 'none' }}
          />
        </div>

        {/* Executive Action Toolbar */}
        <div className="px-5 pb-5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-1.5 p-1 bg-surface-muted rounded-2xl border-0 ring-0 group-focus-within/input:bg-surface transition-colors duration-500">
            {/* Model Selector - Redesigned Ghost style */}
            <Dropdown
              items={modelItems}
              selectedId={selectedModel}
              onSelect={(id) => onModelChange(String(id))}
              disabled={disabled}
              icon={Cpu}
              variant="ghost"
              direction="up"
              className="hover:bg-surface/80 rounded-xl"
            />

            <div className="w-1" />
          </div>

          {/* High-Fidelity Send Button */}
          <Button
            variant="unstyled"
            type="button"
            disabled={disabled || !value.trim()}
            onClick={onSend}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all relative overflow-hidden group/send border-0 outline-none ${
              !disabled && value.trim()
                ? 'bg-accent text-white shadow-lg shadow-[#0F172A]/20 hover:shadow-[#5E43FB]/30 hover:scale-105 active:scale-90'
                : 'bg-surface-muted text-text-muted cursor-not-allowed opacity-60'
            }`}
          >
            {/* Animated Hover Background */}
            {!disabled && value.trim() && (
              <div className="absolute inset-0 bg-linear-to-tr from-[#5E43FB] to-[#4326DE] opacity-0 group-hover/send:opacity-100 transition-opacity duration-300" />
            )}

            <Send
              className={`w-5 h-5 relative z-10 transition-all ${!disabled && value.trim() ? 'translate-x-0.5 -translate-y-0.5 -rotate-12' : ''}`}
            />
          </Button>
        </div>
      </div>
    </div>
  )
}
