import { constants } from "starknet"

// Token Contract Addresses
export const ETHTokenAddress =
  process.env.NEXT_PUBLIC_ETH_TOKEN_ADDRESS ||
  "0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7"

export const STRKTokenAddress =
  process.env.NEXT_PUBLIC_STRK_TOKEN_ADDRESS ||
  "0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d"

export const DAITokenAddress =
  process.env.NEXT_PUBLIC_DAI_TOKEN_ADDRESS ||
  "0x00da114221cb83fa859dbdb4c44beeaa0bb37c7537ad5ae66fe5e0efd20e6eb3"

export const WBTCTokenAddress =
  process.env.NEXT_PUBLIC_WBTC_TOKEN_ADDRESS ||
  "0x00c6164dA852d230360333D6adE3551eE3e48124C815704f51fA7F12D8287Dcc"

// Argent Dummy Contract Addresses
export const ARGENT_DUMMY_CONTRACT_MAINNET_ADDRESS =
  process.env.NEXT_PUBLIC_ARGENT_DUMMY_CONTRACT_MAINNET_ADDRESS ||
  "0x001c515f991f706039696a54f6f33730e9b0e8cc5d04187b13c2c714401acfd4"

export const ARGENT_DUMMY_CONTRACT_SEPOLIA_ADDRESS =
  process.env.NEXT_PUBLIC_ARGENT_DUMMY_CONTRACT_SEPOLIA_ADDRESS ||
  "0x88d3cc4377a6cdfd27545a11548bd070c4e2e1e3df3d402922dbc4350b416"

// Chain Configuration
export const CHAIN_ID =
  process.env.NEXT_PUBLIC_CHAIN_ID === constants.NetworkName.SN_MAIN
    ? constants.NetworkName.SN_MAIN
    : constants.NetworkName.SN_SEPOLIA

// RPC Node URLs
const MAINNET_RPC_URL =
  process.env.NEXT_PUBLIC_STARKNET_MAINNET_RPC_URL ||
  "https://starknet-mainnet.public.blastapi.io/rpc/v0_9"

const SEPOLIA_RPC_URL =
  process.env.NEXT_PUBLIC_STARKNET_SEPOLIA_RPC_URL ||
  "https://starknet-sepolia.public.blastapi.io/rpc/v0_9"

const NODE_URL =
  process.env.NEXT_PUBLIC_CHAIN_ID === constants.NetworkName.SN_MAIN
    ? MAINNET_RPC_URL
    : SEPOLIA_RPC_URL

const STARKNET_CHAIN_ID =
  process.env.NEXT_PUBLIC_CHAIN_ID === constants.NetworkName.SN_MAIN
    ? constants.StarknetChainId.SN_MAIN
    : constants.StarknetChainId.SN_SEPOLIA

// Provider is no longer exported as we use WebSocket RPC service instead
// If you need direct provider access for wallet operations, create it locally
// export const provider = new RpcProvider({
//   nodeUrl: NODE_URL,
//   chainId: STARKNET_CHAIN_ID,
// })

// Argent Services
export const ARGENT_SESSION_SERVICE_BASE_URL =
  process.env.NEXT_PUBLIC_ARGENT_SESSION_SERVICE_BASE_URL ||
  "https://cloud.argent-api.com/v1"

export const ARGENT_WEBWALLET_URL =
  process.env.NEXT_PUBLIC_ARGENT_WEBWALLET_URL ||
  "https://sepolia-web.argent.xyz"

// Feature Flags
export const USE_SEPOLIA_DUMMY_CONTRACT =
  process.env.NEXT_PUBLIC_USE_SEPOLIA_DUMMY_CONTRACT === "true"

// Dynamic Contract Address based on Chain ID
export const ARGENT_DUMMY_CONTRACT_ADDRESS =
  CHAIN_ID === constants.NetworkName.SN_SEPOLIA
    ? ARGENT_DUMMY_CONTRACT_SEPOLIA_ADDRESS
    : ARGENT_DUMMY_CONTRACT_MAINNET_ADDRESS

// API Keys
export const AVNU_PAYMASTER_API_KEY =
  process.env.NEXT_PUBLIC_AVNU_API_KEY || undefined
