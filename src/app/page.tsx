"use client"

import { useState, useEffect } from "react"

import { SidebarNav } from "@/components/SidebarNav"
import { StarknetApp } from "@/modules/starknet/StarknetApp"
import { wsClient } from "@/services/websocket"

export default function Home() {
  const [selectedNav, setSelectedNav] = useState("starknet")
  const [selectedSubNav, setSelectedSubNav] = useState<string | undefined>(
    "deployment",
  )

  // Initialize WebSocket connection at page level
  useEffect(() => {
    wsClient.connect().catch((error) => {
      console.error("Failed to connect to WebSocket server:", error)
    })

    return () => {
      // Keep connection alive, don't disconnect on unmount
      // wsClient.disconnect()
    }
  }, [])

  const handleNavSelect = (id: string, subId?: string) => {
    setSelectedNav(id)
    setSelectedSubNav(subId)
  }

  return (
    <div className="flex min-h-screen flex-row bg-black">
      <SidebarNav
        selectedId={selectedNav}
        selectedSubId={selectedSubNav}
        onSelect={handleNavSelect}
      />

      <main className="flex flex-1 flex-col">
        <StarknetApp subSection={selectedSubNav} />
      </main>
    </div>
  )
}
