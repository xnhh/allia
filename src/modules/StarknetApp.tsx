"use client"

import { StarknetDapp } from "@/components/StarknetDapp"
import { connectors } from "@/connectors"
import { mainnet, sepolia } from "@starknet-react/chains"
import { publicProvider, StarknetConfig } from "@starknet-react/core"

export function StarknetApp() {
  const chains = [mainnet, sepolia]
  const providers = publicProvider()

  return (
    <StarknetConfig chains={chains} provider={providers} connectors={connectors}>
      <StarknetDapp />
    </StarknetConfig>
  )
}


