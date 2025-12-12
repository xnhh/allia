import { useEffect, useState } from "react"
import { rpcService } from "@/services/rpc"
import { useAccount } from "@starknet-react/core"
import { useChainContext } from "@/contexts/ChainContext"

interface Balance {
  value: string
  formatted: string
}

interface UseBalanceOptions {
  contractAddress?: string
  chainId?: string
  network?: string
}

export function useBalance(address?: string, options?: UseBalanceOptions) {
  const { address: accountAddress } = useAccount()
  const chainContext = useChainContext()
  const targetAddress = address || accountAddress
  const [balance, setBalance] = useState<Balance | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!targetAddress) {
      setBalance(null)
      return
    }

    setIsLoading(true)
    setError(null)

    // Use context values as defaults, but allow options to override
    rpcService
      .getBalance(targetAddress, {
        contractAddress:
          options?.contractAddress ||
          chainContext.defaultContractAddress ||
          undefined,
        chainId: options?.chainId || chainContext.chainId,
        network: options?.network || chainContext.network,
      })
      .then((result) => {
        setBalance(result as Balance)
      })
      .catch((err) => {
        setError(err)
        setBalance(null)
      })
      .finally(() => {
        setIsLoading(false)
      })
  }, [
    targetAddress,
    options?.contractAddress,
    options?.chainId,
    options?.network,
    chainContext.defaultContractAddress,
    chainContext.chainId,
    chainContext.network,
  ])

  return {
    data: balance,
    isLoading,
    error,
  }
}
