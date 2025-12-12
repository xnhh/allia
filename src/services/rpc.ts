import { wsClient } from "./websocket"
import { constants } from "starknet"

export interface RpcRequestOptions {
  chainId?: string // Optional chain identifier (defaults to "starknet")
  network?: string // Optional network name (e.g., "mainnet", "sepolia")
}

export class RpcService {
  private getDefaultChainId(): string {
    // Default to starknet for now
    return "starknet"
  }

  private getDefaultNetwork(): string {
    const chainId =
      process.env.NEXT_PUBLIC_CHAIN_ID || constants.NetworkName.SN_SEPOLIA
    return chainId === constants.NetworkName.SN_MAIN ? "mainnet" : "sepolia"
  }

  async callContract(
    params: {
      contractAddress: string
      entrypoint: string
      calldata: string[]
    },
    options?: RpcRequestOptions,
  ) {
    return wsClient.request(
      "callContract",
      {
        contractAddress: params.contractAddress,
        entrypoint: params.entrypoint,
        calldata: params.calldata,
        network: options?.network || this.getDefaultNetwork(),
      },
      options?.chainId || this.getDefaultChainId(),
    )
  }

  async getBalance(
    address: string,
    options?: RpcRequestOptions & { contractAddress?: string },
  ) {
    return wsClient.request(
      "getBalance",
      {
        address,
        contractAddress: options?.contractAddress,
        network: options?.network || this.getDefaultNetwork(),
      },
      options?.chainId || this.getDefaultChainId(),
    )
  }

  async getStarkName(address: string, options?: RpcRequestOptions) {
    return wsClient.request(
      "getStarkName",
      {
        address,
        network: options?.network || this.getDefaultNetwork(),
      },
      options?.chainId || this.getDefaultChainId(),
    )
  }

  async getStarkProfile(address: string, options?: RpcRequestOptions) {
    return wsClient.request(
      "getStarkProfile",
      {
        address,
        network: options?.network || this.getDefaultNetwork(),
      },
      options?.chainId || this.getDefaultChainId(),
    )
  }

  async getBlock(
    blockNumber?: number | string,
    blockHash?: string,
    options?: RpcRequestOptions,
  ) {
    return wsClient.request(
      "getBlock",
      {
        blockNumber,
        blockHash,
        network: options?.network || this.getDefaultNetwork(),
      },
      options?.chainId || this.getDefaultChainId(),
    )
  }

  async getTransaction(transactionHash: string, options?: RpcRequestOptions) {
    return wsClient.request(
      "getTransaction",
      {
        transactionHash,
        network: options?.network || this.getDefaultNetwork(),
      },
      options?.chainId || this.getDefaultChainId(),
    )
  }

  /**
   * List all available chains
   */
  async listChains() {
    return wsClient.request("listChains", {})
  }

  /**
   * Get chain information
   */
  async getChainInfo(chainId?: string) {
    return wsClient.request("getChainInfo", {}, chainId)
  }
}

export const rpcService = new RpcService()
