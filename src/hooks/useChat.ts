'use client'

import { useState, useCallback, useEffect } from 'react'
import type { WeatherContextData } from '@/types/weather'
import { useSettings } from '@/contexts/SettingsContext'

const CHAT_CACHE_KEY = 'atmos_chat_messages'

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
}

function getCachedMessages(): ChatMessage[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(CHAT_CACHE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveCachedMessages(messages: ChatMessage[]) {
  try {
    localStorage.setItem(CHAT_CACHE_KEY, JSON.stringify(messages))
  } catch {}
}

export function useChat(weatherContext: WeatherContextData) {
  const { aiEmojiUse, aiVerbosity } = useSettings()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [loading, setLoading] = useState(false)

  // Load cached messages on mount
  useEffect(() => {
    const cached = getCachedMessages()
    if (cached.length > 0) {
      setMessages(cached)
    }
  }, [])

  // Persist messages whenever they change
  useEffect(() => {
    if (messages.length > 0) {
      saveCachedMessages(messages)
    }
  }, [messages])

  const sendMessage = useCallback(
    async (content: string) => {
      const userMessage: ChatMessage = {
        id: Date.now().toString(),
        role: 'user',
        content,
        timestamp: Date.now(),
      }

      setMessages(prev => [...prev, userMessage])
      setLoading(true)

      try {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: content,
            history: messages.map(m => ({ role: m.role, content: m.content })),
            weather: weatherContext,
            localHour: new Date().getHours(),
            localMinute: new Date().getMinutes(),
            personality: { emojiUse: aiEmojiUse, verbosity: aiVerbosity },
          }),
        })

        const data = await res.json()

        if (res.status === 429) {
          const friendlyLimit: ChatMessage = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content:
              `You've hit today's free limit (${data.limit ?? '?'} ${data.endpoint ?? 'messages'}). ` +
              `Upgrade to Pro for higher caps, or try again tomorrow.`,
            timestamp: Date.now(),
          }
          setMessages(prev => [...prev, friendlyLimit])
        } else if (!res.ok) {
          throw new Error(data.error || 'Chat request failed')
        } else {
          const assistantMessage: ChatMessage = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: data.response,
            timestamp: Date.now(),
          }
          setMessages(prev => [...prev, assistantMessage])
        }
      } catch (e: any) {
        const errorMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: 'The AI is napping. Try again in a moment.',
          timestamp: Date.now(),
        }
        setMessages(prev => [...prev, errorMessage])
      }

      setLoading(false)
    },
    [messages, weatherContext, aiEmojiUse, aiVerbosity]
  )

  const clearChat = useCallback(() => {
    setMessages([])
    try { localStorage.removeItem(CHAT_CACHE_KEY) } catch {}
  }, [])

  return { messages, loading, sendMessage, clearChat }
}
