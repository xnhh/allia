import { useEffect, useState } from "react"
import { wsClient } from "@/services/websocket"

export function useWebSocket() {
  const [isConnected, setIsConnected] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)

  useEffect(() => {
    setIsConnecting(true)
    wsClient
      .connect()
      .then(() => {
        setIsConnected(true)
        setIsConnecting(false)
      })
      .catch((error) => {
        console.error("Failed to connect to WebSocket:", error)
        setIsConnected(false)
        setIsConnecting(false)
      })

    const unsubscribe = wsClient.onConnectionChange((connected) => {
      setIsConnected(connected)
    })

    return () => {
      unsubscribe()
      // Don't disconnect on unmount to keep connection alive
      // wsClient.disconnect()
    }
  }, [])

  return {
    isConnected,
    isConnecting,
    reconnect: () => {
      setIsConnecting(true)
      wsClient
        .connect()
        .then(() => {
          setIsConnected(true)
          setIsConnecting(false)
        })
        .catch((error) => {
          console.error("Failed to reconnect:", error)
          setIsConnected(false)
          setIsConnecting(false)
        })
    },
  }
}

