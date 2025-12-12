"use client"

import { createContext, useContext, ReactNode } from "react"

interface ChainContextValue {
  chainId: string // RPC chainId for server calls (e.g., "starknet", "ethereum")
  network: string // Network name (e.g., "mainnet", "sepolia")
  defaultContractAddress?: string // Default token contract address
}

const ChainContext = createContext<ChainContextValue | undefined>(undefined)

interface ChainProviderProps {
  children: ReactNode
  chainId: string
  network: string
  defaultContractAddress?: string
}

export function ChainProvider({
  children,
  chainId,
  network,
  defaultContractAddress,
}: ChainProviderProps) {
  const value: ChainContextValue = {
    chainId,
    network,
    defaultContractAddress,
  }

  return <ChainContext.Provider value={value}>{children}</ChainContext.Provider>
}

export function useChainContext() {
  const context = useContext(ChainContext)
  if (context === undefined) {
    throw new Error("useChainContext must be used within a ChainProvider")
  }
  return context
}
