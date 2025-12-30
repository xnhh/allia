import { hash } from "starknet"

type JsonValue = unknown

/**
 * 从文件名中提取合约名称
 * 例如: friendly_lamp_aBTC.compiled_contract_class.json -> friendly_lamp_aBTC
 */
export function extractContractNameFromFileName(fileName: string): string {
  // 去掉扩展名
  let name = fileName.replace(/\.(json|txt)$/i, "")

  // 去掉常见的后缀
  const suffixes = [
    ".compiled_contract_class",
    ".contract_class",
    ".compiled_class",
    ".sierra",
    ".casm",
    ".compiled",
  ]

  for (const suffix of suffixes) {
    if (name.endsWith(suffix)) {
      name = name.slice(0, -suffix.length)
      break
    }
  }

  return name || fileName
}

/**
 * 从合约类 JSON 中提取 class_hash
 */
export function extractClassHash(json: JsonValue): string | null {
  if (!json || typeof json !== "object") return null

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return hash.computeContractClassHash(json as any)
  } catch (e) {
    console.warn("Failed to compute contract class hash:", e)
    return null
  }
}

/**
 * 从编译后的合约类 JSON 中提取 compiled_class_hash
 */
export function extractCompiledClassHash(json: JsonValue): string | null {
  if (!json || typeof json !== "object") return null

  const obj = json as Record<string, unknown>
  const hashValue = obj.compiled_class_hash || obj.compiledClassHash || obj.hash

  if (typeof hashValue === "string" && hashValue.startsWith("0x")) {
    return hashValue
  }

  // 如果没有直接的 hash，尝试计算（对于 CASM 格式）
  try {
    // 类型断言：假设 JSON 符合 CairoAssembly 格式
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return hash.computeCompiledClassHash(json as any)
  } catch (e) {
    console.warn("Failed to compute compiled class hash:", e)
    return null
  }
}

/**
 * 根据合约状态返回对应的颜色样式类名
 */
export function getStatusColor(status: string): string {
  switch (status) {
    case "draft":
      return "text-yellow-400 bg-yellow-400/10"
    case "declared":
      return "text-blue-400 bg-blue-400/10"
    case "deployed":
      return "text-green-400 bg-green-400/10"
    case "failed":
      return "text-red-400 bg-red-400/10"
    default:
      return "text-gray-400 bg-gray-400/10"
  }
}
