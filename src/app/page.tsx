"use client"

import { useState } from "react"

import { SidebarNav } from "@/components/SidebarNav"
import { StarknetApp } from "@/modules/StarknetApp"

export default function Home() {
  const [selectedNav, setSelectedNav] = useState("starknet-app")

  return (
    <div className="flex min-h-screen flex-row bg-black">
      <SidebarNav selectedId={selectedNav} onSelect={setSelectedNav} />

      <main className="flex flex-1 flex-col">
        <StarknetApp />
      </main>
    </div>
  )
}
