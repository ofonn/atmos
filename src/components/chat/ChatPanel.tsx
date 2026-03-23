'use client'

import { useEffect, useRef } from 'react'
import { X, Trash2, Sparkles } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChatMessage } from './ChatMessage'
import { ChatInput } from './ChatInput'
import { QuickPrompts } from './QuickPrompts'
import { useChat } from '@/hooks/useChat'
import type { WeatherContextData } from '@/types/weather'

interface ChatPanelProps {
  open: boolean
  onClose: () => void
  weatherContext: WeatherContextData
}

export function ChatPanel({ open, onClose, weatherContext }: ChatPanelProps) {
  const { messages, loading, sendMessage, clearChat } = useChat(weatherContext)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          />

          {/* Panel */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 bg-surface-container rounded-t-3xl z-50 flex flex-col"
            style={{ maxHeight: '85vh', height: '85vh' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-outline-variant/20">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                <h3 className="font-semibold font-headline text-on-surface">Atmos AI</h3>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={clearChat}
                  className="p-2 rounded-xl hover:bg-surface-container-high transition"
                >
                  <Trash2 className="w-4 h-4 text-on-surface-variant/50" />
                </button>
                <button
                  onClick={onClose}
                  className="p-2 rounded-xl hover:bg-surface-container-high transition"
                >
                  <X className="w-4 h-4 text-on-surface-variant/50" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-center px-4">
                  <Sparkles className="w-10 h-10 text-primary mb-3" />
                  <h4 className="font-semibold text-lg mb-1 font-headline text-on-surface">
                    Ask me anything about the weather
                  </h4>
                  <p className="text-on-surface-variant/60 text-sm mb-6 font-body">
                    I can help you decide what to wear, plan your day, or warn
                    you about weather changes.
                  </p>
                  <QuickPrompts onSelect={sendMessage} />
                </div>
              )}

              {messages.map((msg) => (
                <ChatMessage key={msg.id} message={msg} />
              ))}

              {loading && (
                <div className="flex gap-1.5 px-4 py-3">
                  <div className="w-2 h-2 rounded-full bg-primary animate-bounce" />
                  <div className="w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:0.15s]" />
                  <div className="w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:0.3s]" />
                </div>
              )}
            </div>

            {/* Quick prompts when there are messages */}
            {messages.length > 0 && (
              <div className="px-4 pb-2">
                <QuickPrompts onSelect={sendMessage} compact />
              </div>
            )}

            {/* Input */}
            <ChatInput onSend={sendMessage} disabled={loading} />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
