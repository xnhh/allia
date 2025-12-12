export interface RpcRequest {
  id: string
  method: string
  chainId?: string // Optional chain identifier
  params?: Record<string, any>
}

export interface RpcResponse {
  id: string
  result?: any
  error?: {
    code: number
    message: string
    data?: any
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
  chainId?: string
}

