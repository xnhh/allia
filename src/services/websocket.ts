import { RpcRequest, RpcResponse } from "./websocket.types"

const WS_URL = process.env.NEXT_PUBLIC_WS_SERVER_URL || "ws://localhost:8081"

class WebSocketClient {
  private ws: WebSocket | null = null
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 1000
  private pendingRequests: Map<string, {
    resolve: (value: any) => void
    reject: (error: Error) => void
    timeout: NodeJS.Timeout
  }> = new Map()
  private listeners: Set<(connected: boolean) => void> = new Set()
  private connectPromise: Promise<void> | null = null // Track ongoing connection
  private isConnecting = false
  private shouldReconnect = true

  connect(): Promise<void> {
    // If already connected, return immediately
    if (this.isConnected()) {
      return Promise.resolve()
    }

    // If already connecting, return the existing promise
    if (this.connectPromise) {
      return this.connectPromise
    }

    // Create new connection promise
    this.isConnecting = true
    this.connectPromise = new Promise((resolve, reject) => {
      try {
        // Close existing connection if any (in case of stale connection)
        if (this.ws) {
          this.ws.close()
          this.ws = null
        }

        this.ws = new WebSocket(WS_URL)

        this.ws.onopen = () => {
          console.log("WebSocket connected")
          this.reconnectAttempts = 0
          this.isConnecting = false
          this.connectPromise = null
          this.notifyListeners(true)
          resolve()
        }

        this.ws.onmessage = (event) => {
          try {
            const response: RpcResponse = JSON.parse(event.data)
            
            // Handle welcome message
            if (response.id === "welcome") {
              return
            }

            const pending = this.pendingRequests.get(response.id)
            if (pending) {
              clearTimeout(pending.timeout)
              this.pendingRequests.delete(response.id)

              if (response.error) {
                pending.reject(
                  new Error(response.error.message || "RPC error")
                )
              } else {
                pending.resolve(response.result)
              }
            }
          } catch (error) {
            console.error("Error parsing WebSocket message:", error)
          }
        }

        this.ws.onerror = (error) => {
          console.error("WebSocket error:", error)
          this.isConnecting = false
          this.connectPromise = null
          this.notifyListeners(false)
          reject(error)
        }

        this.ws.onclose = () => {
          console.log("WebSocket disconnected")
          this.isConnecting = false
          this.connectPromise = null
          this.ws = null
          this.notifyListeners(false)
          this.pendingRequests.forEach((pending) => {
            clearTimeout(pending.timeout)
            pending.reject(new Error("WebSocket disconnected"))
          })
          this.pendingRequests.clear()

          // Attempt to reconnect only if shouldReconnect is true
          if (this.shouldReconnect && this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++
            setTimeout(() => {
              console.log(`Reconnecting... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`)
              this.connect().catch(console.error)
            }, this.reconnectDelay * this.reconnectAttempts)
          }
        }
      } catch (error) {
        this.isConnecting = false
        this.connectPromise = null
        reject(error)
      }
    })

    return this.connectPromise
  }

  disconnect() {
    this.shouldReconnect = false // Prevent auto-reconnect
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
    this.connectPromise = null
    this.isConnecting = false
    this.pendingRequests.forEach((pending) => {
      clearTimeout(pending.timeout)
      pending.reject(new Error("Client disconnected"))
    })
    this.pendingRequests.clear()
  }

  async request<T = any>(
    method: string,
    params?: Record<string, any>,
    chainId?: string
  ): Promise<T> {
    // Ensure connection is established (will reuse existing connection if available)
    if (!this.isConnected()) {
      await this.connect()
    }

    // Double check after connection attempt
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error("WebSocket is not connected")
    }

    const ws = this.ws // Store reference to avoid null check issues

    return new Promise<T>((resolve, reject) => {
      const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      const request: RpcRequest = {
        id,
        method,
        chainId,
        params,
      }

      const timeout = setTimeout(() => {
        this.pendingRequests.delete(id)
        reject(new Error("Request timeout"))
      }, 30000) // 30 second timeout

      this.pendingRequests.set(id, {
        resolve,
        reject,
        timeout,
      })

      try {
        ws.send(JSON.stringify(request))
      } catch (error) {
        clearTimeout(timeout)
        this.pendingRequests.delete(id)
        reject(error)
      }
    })
  }

  onConnectionChange(callback: (connected: boolean) => void) {
    this.listeners.add(callback)
    return () => {
      this.listeners.delete(callback)
    }
  }

  private notifyListeners(connected: boolean) {
    this.listeners.forEach((listener) => listener(connected))
  }

  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN
  }
}

export const wsClient = new WebSocketClient()

