"use client"

import { connectors } from "@/connectors"
import { mainnet, sepolia } from "@starknet-react/chains"
import {
  publicProvider,
  StarknetConfig,
  useAccount,
} from "@starknet-react/core"
import { ChainProvider } from "@/contexts/ChainContext"
import { toHexChainid, isMainnet } from "@/helpers/chainId"
import { ETHTokenAddress } from "@/constants"
import { renderRoute } from "./StarknetRoute"

interface StarknetAppProps {
  subSection?: string
}

function StarknetDappWithChainProvider({
  subSection,
}: {
  subSection?: string
}) {
  const { chainId } = useAccount()
  const hexChainId = toHexChainid(chainId)
  const network = isMainnet(hexChainId) ? "mainnet" : "sepolia"
  const rpcChainId = "starknet"

  return (
    <ChainProvider
      chainId={rpcChainId}
      network={network}
      defaultContractAddress={ETHTokenAddress}
    >
      {renderRoute(subSection)}
    </ChainProvider>
  )
}

export function StarknetApp({ subSection }: StarknetAppProps) {
  const chains = [mainnet, sepolia]
  const providers = publicProvider()

  return (
    <StarknetConfig
      chains={chains}
      provider={providers}
      connectors={connectors}
    >
      <StarknetDappWithChainProvider subSection={subSection} />
    </StarknetConfig>
  )
}
