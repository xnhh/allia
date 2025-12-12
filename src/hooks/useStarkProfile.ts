import { useEffect, useState } from "react"
import { rpcService } from "@/services/rpc"
import { useAccount } from "@starknet-react/core"

interface StarkProfile {
  profilePicture?: string
  name?: string
  [key: string]: any
}

export function useStarkProfile(
  address?: string,
  options?: { useDefaultPfp?: boolean; enabled?: boolean }
) {
  const { address: accountAddress } = useAccount()
  const targetAddress = address || accountAddress
  const enabled = options?.enabled !== false
  const [profile, setProfile] = useState<StarkProfile | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!targetAddress || !enabled) {
      setProfile(null)
      return
    }

    setIsLoading(true)
    setError(null)

    rpcService
      .getStarkProfile(targetAddress)
      .then((result) => {
        setProfile(result as StarkProfile | null)
      })
      .catch((err) => {
        setError(err)
        setProfile(null)
      })
      .finally(() => {
        setIsLoading(false)
      })
  }, [targetAddress, enabled])

  return {
    data: profile,
    isLoading,
    error,
  }
}

