import { useState } from "react"
import {
  useAccount,
  useDeclareContract as useDeclareContractHook,
} from "@starknet-react/core"
import { hash } from "starknet"
import { contractsService } from "@/services/contracts"

type JsonValue = unknown

interface UseDeclareContractOptions {
  contractId: string
  contractClassJson?: JsonValue
  compiledContractClassJson?: JsonValue
  onSuccess?: (result: { classHash: string; compiledClassHash: string }) => void
}

export function useDeclareContract() {
  const { account } = useAccount()
  const { declareAsync } = useDeclareContractHook({})
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const declare = async ({
    contractId,
    contractClassJson,
    compiledContractClassJson,
    onSuccess,
  }: UseDeclareContractOptions) => {
    if (!account) {
      setError("Please connect your wallet")
      return
    }

    if (!contractClassJson || !compiledContractClassJson) {
      setError(
        "Contract class JSON and compiled class JSON are required for declaration",
      )
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      // Type assertion: JSON data from files needs to be cast to expected types
      // Using unknown as intermediate type for safe type assertion
      const compiledClassHashValue = hash.computeCompiledClassHash(
        compiledContractClassJson as unknown as Parameters<
          typeof hash.computeCompiledClassHash
        >[0],
      )

      // Extract the contract_class type from declareAsync parameters
      type DeclareParams = Parameters<typeof declareAsync>[0]
      type ContractClassParam = DeclareParams extends {
        contract_class: infer T
      }
        ? T
        : never

      const { class_hash, transaction_hash } = await declareAsync({
        contract_class: contractClassJson as unknown as ContractClassParam,
        compiled_class_hash: compiledClassHashValue,
      } as DeclareParams)

      // Update contract with declared hash and status
      await contractsService.update(contractId, {
        classHash: class_hash,
        compiledClassHash: compiledClassHashValue,
        status: "declared",
        declareTxHash: transaction_hash,
      })

      onSuccess?.({
        classHash: class_hash,
        compiledClassHash: compiledClassHashValue,
      })
    } catch (e) {
      setError((e as Error).message)
      throw e
    } finally {
      setIsLoading(false)
    }
  }

  return {
    declare,
    isLoading,
    error,
  }
}
