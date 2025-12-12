import { useEffect, useState } from "react"
import { rpcService } from "@/services/rpc"
import { useAccount } from "@starknet-react/core"

interface Balance {
  value: string
  formatted: string
}

export function useBalance(address?: string) {
  const { address: accountAddress } = useAccount()
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

    rpcService
      .getBalance(targetAddress)
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
  }, [targetAddress])

  return {
    data: balance,
    isLoading,
    error,
  }
}

