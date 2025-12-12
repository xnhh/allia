import { useEffect, useState } from "react"
import { rpcService } from "@/services/rpc"
import { useAccount } from "@starknet-react/core"

export function useStarkName(address?: string) {
  const { address: accountAddress } = useAccount()
  const targetAddress = address || accountAddress
  const [starkName, setStarkName] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!targetAddress) {
      setStarkName(null)
      return
    }

    setIsLoading(true)
    setError(null)

    rpcService
      .getStarkName(targetAddress)
      .then((result) => {
        setStarkName(result as string | null)
      })
      .catch((err) => {
        setError(err)
        setStarkName(null)
      })
      .finally(() => {
        setIsLoading(false)
      })
  }, [targetAddress])

  return {
    data: starkName,
    isLoading,
    error,
  }
}

