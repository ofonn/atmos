'use client'

import { useState, useEffect, useCallback } from 'react'

export function useNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [supported, setSupported] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setSupported(true)
      setPermission(Notification.permission)
    }
  }, [])

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        // Service worker registration failed silently
      })
    }
  }, [])

  const requestPermission = useCallback(async () => {
    if (!supported) return false
    const result = await Notification.requestPermission()
    setPermission(result)
    return result === 'granted'
  }, [supported])

  const sendLocalNotification = useCallback(
    (title: string, body: string) => {
      if (permission !== 'granted') return
      new Notification(title, {
        body,
        icon: '/icons/icon-192.png',
      })
    },
    [permission]
  )

  return {
    permission,
    supported,
    requestPermission,
    sendLocalNotification,
  }
}
