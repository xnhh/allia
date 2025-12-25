import { useState } from "react"
import { useAccount } from "@starknet-react/core"
import { CallData } from "starknet"
import { contractsService } from "@/services/contracts"

interface UseDeployContractOptions {
  contractId: string
  classHash: string
  compiledClassHash?: string
  constructorCalldata?: unknown[]
  onSuccess?: () => void
}

export function useDeployContract() {
  const { account, address } = useAccount()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const deploy = async ({
    contractId,
    classHash,
    compiledClassHash,
    constructorCalldata = [],
    onSuccess,
  }: UseDeployContractOptions) => {
    if (!account) {
      setError("Please connect your wallet")
      return
    }

    if (!classHash) {
      setError("Class hash is required for deployment")
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      // Generate random salt
      const salt = "0x" + Math.random().toString(16).slice(2)

      // Deploy contract
      const deployResult = await account.deployContract({
        classHash,
        constructorCalldata: CallData.compile(constructorCalldata),
        salt,
      })

      // Create instance record
      await contractsService.createInstance({
        contractId,
        instanceAddress: deployResult.contract_address,
        deployTxHash: deployResult.transaction_hash,
        deployerAddress: address,
        salt,
        status: "deployed",
      })

      // Update contract status
      await contractsService.update(contractId, {
        status: "deployed",
        classHash,
        compiledClassHash,
      })

      onSuccess?.()
    } catch (e) {
      setError((e as Error).message)
      throw e
    } finally {
      setIsLoading(false)
    }
  }

  return {
    deploy,
    isLoading,
    error,
  }
}
