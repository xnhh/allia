export interface RpcRequest {
  id: string
  method: string
  chainId?: string // Optional chain identifier
  params?: Record<string, unknown>
}

export interface RpcResponse {
  id: string
  result?: unknown
  error?: {
    code: number
    message: string
    data?: unknown
  }
}

export interface CallContractParams {
  contractAddress: string
  entrypoint: string
  calldata: string[]
  chainId?: string
}

export interface GetBalanceParams {
  address: string
  contractAddress?: string
  chainId?: string
  network?: string
}
