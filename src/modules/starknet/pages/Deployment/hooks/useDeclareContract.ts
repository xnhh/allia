import { useState } from "react"
import {
  useAccount,
  useDeclareContract as useDeclareContractHook,
} from "@starknet-react/core"
import { hash } from "starknet"
import { contractsService } from "@/services/contracts"

type JsonValue = unknown

/**
 * CONTRACT_CLASS 类型定义（来自 @starknet-io/types-js）
 * 上传的 JSON 文件应该包含以下字段：
 * - sierra_program: string[] (FELT 数组)
 * - contract_class_version: string (例如 "0.1.0")
 * - entry_points_by_type: {
 *     CONSTRUCTOR: Array<{ selector: string, function_idx: number }>
 *     EXTERNAL: Array<{ selector: string, function_idx: number }>
 *     L1_HANDLER: Array<{ selector: string, function_idx: number }>
 *   }
 * - abi: string (JSON 字符串)
 */
interface ContractClass {
  sierra_program: string[]
  contract_class_version: string
  entry_points_by_type: {
    CONSTRUCTOR: Array<{ selector: string; function_idx: number }>
    EXTERNAL: Array<{ selector: string; function_idx: number }>
    L1_HANDLER: Array<{ selector: string; function_idx: number }>
  }
  abi: string
}

/**
 * 验证 JSON 是否包含 CONTRACT_CLASS 必需的字段
 */
function isValidContractClass(json: JsonValue): json is ContractClass {
  if (!json || typeof json !== "object") {
    return false
  }

  const obj = json as Record<string, unknown>

  return (
    Array.isArray(obj.sierra_program) &&
    obj.entry_points_by_type !== undefined &&
    obj.entry_points_by_type !== null
  )
}

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

    // 验证 contract class JSON 格式
    if (!isValidContractClass(contractClassJson)) {
      setError(
        "Invalid contract class JSON. Required fields: sierra_program, contract_class_version, entry_points_by_type, abi",
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

      // Compute class_hash from contract class JSON
      const classHashValue = hash.computeContractClassHash(
        contractClassJson as unknown as Parameters<
          typeof hash.computeContractClassHash
        >[0],
      )

      // Extract the contract_class type from declareAsync parameters
      type DeclareParams = Parameters<typeof declareAsync>[0]
      type ContractClassParam = DeclareParams extends {
        contract_class: infer T
      }
        ? T
        : never

      console.log({
        contract_class: contractClassJson as unknown as ContractClassParam,
        compiled_class_hash: compiledClassHashValue,
        class_hash: classHashValue,
      })

      const { class_hash, transaction_hash } = await declareAsync({
        contract_class: contractClassJson as unknown as ContractClassParam,
        compiled_class_hash: compiledClassHashValue,
        class_hash: classHashValue,
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
