import { useState, useEffect, useRef, useCallback } from 'react'
import { tokenService } from '../services/token.service'

export type ConnectionStatus =
  | 'connecting'
  | 'connected'
  | 'error'
  | 'disconnected'

interface UseWebSocketOptions {
  threadId: string | null
  onMessage: (data: unknown) => void
  onError?: (error: Event) => void
}

interface UseWebSocketReturn {
  connectionStatus: ConnectionStatus
  send: (data: unknown) => void
  reconnect: () => void
}

const MAX_BACKOFF_MS = 30_000
const INITIAL_BACKOFF_MS = 1_000

export const useWebSocket = ({
  threadId,
  onMessage,
  onError,
}: UseWebSocketOptions): UseWebSocketReturn => {
  const [connectionStatus, setConnectionStatus] =
    useState<ConnectionStatus>('disconnected')

  const socketRef = useRef<WebSocket | null>(null)
  const reconnectAttemptRef = useRef(0)
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const messageQueueRef = useRef<unknown[]>([])
  const isFirstMessageRef = useRef(true)
  const mountedRef = useRef(true)

  // Keep callbacks in refs so the effect closure always sees the latest version
  // without requiring the effect to re-run (which would tear down the socket).
  const onMessageRef = useRef(onMessage)
  onMessageRef.current = onMessage

  const onErrorRef = useRef(onError)
  onErrorRef.current = onError

  // ------------------------------------------------------------------
  // Helpers
  // ------------------------------------------------------------------

  function clearReconnectTimer() {
    if (reconnectTimerRef.current !== null) {
      clearTimeout(reconnectTimerRef.current)
      reconnectTimerRef.current = null
    }
  }

  function flushQueue() {
    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN)
      return

    while (messageQueueRef.current.length > 0) {
      const msg = messageQueueRef.current.shift()
      socketRef.current.send(JSON.stringify(msg))
    }
  }

  function buildWsUrl(id: string): string | null {
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL as string | undefined
    if (!apiBaseUrl) {
      console.error(
        '[useWebSocket] VITE_API_BASE_URL is not configured. Create a .env file from .env.example',
      )
      return null
    }

    const wsProtocol = apiBaseUrl.startsWith('https') ? 'wss' : 'ws'
    const wsHost = apiBaseUrl.replace(/^https?:\/\//, '')
    return `${wsProtocol}://${wsHost}/ws/${id}`
  }

  // ------------------------------------------------------------------
  // connect – creates the WebSocket, sends token as the first message
  // ------------------------------------------------------------------

  const connect = useCallback(() => {
    if (!threadId) return

    const wsUrl = buildWsUrl(threadId)
    if (!wsUrl) {
      setConnectionStatus('error')
      return
    }

    setConnectionStatus('connecting')

    const socket = new WebSocket(wsUrl)
    socketRef.current = socket

    socket.onopen = () => {
      if (!mountedRef.current) return

      // Send authentication token as the first message after connection.
      tokenService.getToken().then((token) => {
        if (token && mountedRef.current) {
          socket.send(JSON.stringify({ type: 'auth', token }))
        }
      })

      isFirstMessageRef.current = true
      reconnectAttemptRef.current = 0
      setConnectionStatus('connected')
      // Flush any messages that were queued while disconnected.
      flushQueue()
    }

    socket.onmessage = (event) => {
      if (!mountedRef.current) return

      try {
        const data = JSON.parse(event.data)
        onMessageRef.current(data)
      } catch (e) {
        console.error('[useWebSocket] Failed to parse message:', e)
      }
    }

    socket.onclose = () => {
      if (!mountedRef.current) return

      console.log('[useWebSocket] Disconnected')
      setConnectionStatus('disconnected')
      socketRef.current = null

      // Auto-reconnect with exponential backoff.
      const delay = Math.min(
        INITIAL_BACKOFF_MS * Math.pow(2, reconnectAttemptRef.current),
        MAX_BACKOFF_MS,
      )
      reconnectAttemptRef.current += 1

      reconnectTimerRef.current = setTimeout(() => {
        if (mountedRef.current && threadId) {
          connect()
        }
      }, delay)
    }

    socket.onerror = (error) => {
      if (!mountedRef.current) return

      console.error('[useWebSocket] Error:', error)
      setConnectionStatus('error')
      onErrorRef.current?.(error)
    }
  }, [threadId])

  // ------------------------------------------------------------------
  // Public API
  // ------------------------------------------------------------------

  const send = useCallback((data: unknown) => {
    const socket = socketRef.current

    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(data))
    } else {
      // Queue the message; it will be flushed once the connection opens.
      messageQueueRef.current.push(data)
    }
  }, [])

  const reconnect = useCallback(() => {
    // Tear down any existing connection / pending reconnect.
    if (socketRef.current) {
      socketRef.current.onclose = null // prevent the auto-reconnect logic
      socketRef.current.close()
      socketRef.current = null
    }
    clearReconnectTimer()
    reconnectAttemptRef.current = 0

    connect()
  }, [connect])

  // ------------------------------------------------------------------
  // Lifecycle – connect when threadId changes, clean up on unmount
  // ------------------------------------------------------------------

  useEffect(() => {
    mountedRef.current = true

    if (threadId) {
      connect()
    }

    return () => {
      mountedRef.current = false

      clearReconnectTimer()

      if (socketRef.current) {
        socketRef.current.onclose = null // silence the close handler
        socketRef.current.close()
        socketRef.current = null
      }

      messageQueueRef.current = []
      reconnectAttemptRef.current = 0
      setConnectionStatus('disconnected')
    }
  }, [threadId, connect])

  return { connectionStatus, send, reconnect }
}
