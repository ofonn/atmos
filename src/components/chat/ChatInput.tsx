'use client'

import { useState } from 'react'
import { Send } from 'lucide-react'

interface ChatInputProps {
  onSend: (message: string) => void
  disabled?: boolean
}

export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [input, setInput] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (input.trim() && !disabled) {
      onSend(input.trim())
      setInput('')
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="px-4 py-3 border-t border-outline-variant/20 bg-surface-container"
    >
      <div className="flex items-center gap-2 bg-surface-container-high rounded-2xl px-4 py-2.5">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about the weather..."
          className="flex-1 bg-transparent outline-none text-sm text-on-surface placeholder:text-on-surface-variant/40 font-body"
          disabled={disabled}
        />
        <button
          type="submit"
          disabled={!input.trim() || disabled}
          className="w-8 h-8 rounded-full bg-hero-gradient flex items-center justify-center disabled:opacity-30 transition"
        >
          <Send className="w-4 h-4 text-white" />
        </button>
      </div>
    </form>
  )
}
