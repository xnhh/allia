import { useState } from "react"
import {
  useAccount,
  useDeclareContract as useDeclareContractHook,
} from "@starknet-react/core"
import { hash } from "starknet"
import { contractsService } from "@/services/contracts"
import {
  convertToCompiledSierraCasm,
  convertToContractClass,
} from "../utils/converter"

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

      // Convert JSON to ContractClass using converter (validates and converts)
      const contractClass = convertToContractClass(contractClassJson)

      // Convert JSON to CompiledSierraCasm using converter (validates and converts)
      const compiledSierraCasm = convertToCompiledSierraCasm(
        compiledContractClassJson,
      )
      const compiledClassHashValue =
        hash.computeCompiledClassHash(compiledSierraCasm)

      const { class_hash, transaction_hash } = await declareAsync({
        contract_class: contractClass,
        compiled_class_hash: compiledClassHashValue,
      })

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
