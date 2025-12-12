"use client"

import { StarknetDapp } from "@/modules/starknet/StarknetDapp"
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

function StarknetDappWithChainProvider() {
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
      <StarknetDapp />
    </ChainProvider>
  )
}

export function StarknetApp() {
  const chains = [mainnet, sepolia]
  const providers = publicProvider()

  return (
    <StarknetConfig
      chains={chains}
      provider={providers}
      connectors={connectors}
    >
      <StarknetDappWithChainProvider />
    </StarknetConfig>
  )
}
