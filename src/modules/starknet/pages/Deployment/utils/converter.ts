type JsonValue = unknown

/**
 * CairoAssembly type definition (from starknet)
 * CompiledSierraCasm = CairoAssembly
 */
type CairoAssembly = {
  prime: string
  compiler_version: string
  bytecode: string[]
  hints: unknown[]
  pythonic_hints?: [number, string[]][]
  bytecode_segment_lengths?: number[]
  entry_points_by_type: EntryPointsByType
}

/**
 * CompiledSierraCasm is an alias for CairoAssembly
 */
type CompiledSierraCasm = CairoAssembly

type EntryPointsByType = {
  CONSTRUCTOR: ContractEntryPointFields[]
  EXTERNAL: ContractEntryPointFields[]
  L1_HANDLER: ContractEntryPointFields[]
}

type ContractEntryPointFields = {
  selector: string
  offset: string | number
  builtins?: string[]
}

/**
 * Validates if the JSON value is a valid ContractEntryPointFields
 */
function isValidContractEntryPointFields(
  value: unknown,
): value is ContractEntryPointFields {
  if (!value || typeof value !== "object") {
    return false
  }

  const obj = value as Record<string, unknown>

  return (
    typeof obj.selector === "string" &&
    (typeof obj.offset === "string" || typeof obj.offset === "number")
  )
}

/**
 * Validates if the JSON value is a valid EntryPointsByType
 */
function isValidEntryPointsByType(value: unknown): value is EntryPointsByType {
  if (!value || typeof value !== "object") {
    return false
  }

  const obj = value as Record<string, unknown>

  return (
    Array.isArray(obj.CONSTRUCTOR) &&
    Array.isArray(obj.EXTERNAL) &&
    Array.isArray(obj.L1_HANDLER) &&
    obj.CONSTRUCTOR.every(isValidContractEntryPointFields) &&
    obj.EXTERNAL.every(isValidContractEntryPointFields) &&
    obj.L1_HANDLER.every(isValidContractEntryPointFields)
  )
}

/**
 * Validates if the JSON value is a valid PythonicHints array
 */
function isValidPythonicHints(value: unknown): value is [number, string[]][] {
  if (!Array.isArray(value)) {
    return false
  }

  return value.every(
    (item) =>
      Array.isArray(item) &&
      item.length === 2 &&
      typeof item[0] === "number" &&
      Array.isArray(item[1]) &&
      item[1].every((hint) => typeof hint === "string"),
  )
}

/**
 * Converts JSON value to CompiledSierraCasm (CairoAssembly)
 * @param json - The JSON value to convert
 * @returns CompiledSierraCasm instance
 * @throws Error if the JSON is not a valid CairoAssembly
 */
export function convertToCompiledSierraCasm(
  json: JsonValue,
): CompiledSierraCasm {
  if (!json || typeof json !== "object") {
    throw new Error("Invalid compiled contract class JSON: must be an object")
  }

  const obj = json as Record<string, unknown>

  // Validate required fields
  if (typeof obj.prime !== "string") {
    throw new Error(
      "Invalid compiled contract class JSON: missing or invalid 'prime' field",
    )
  }

  if (typeof obj.compiler_version !== "string") {
    throw new Error(
      "Invalid compiled contract class JSON: missing or invalid 'compiler_version' field",
    )
  }

  if (!Array.isArray(obj.bytecode)) {
    throw new Error(
      "Invalid compiled contract class JSON: missing or invalid 'bytecode' field",
    )
  }

  // Validate bytecode is an array of strings
  if (!obj.bytecode.every((item) => typeof item === "string")) {
    throw new Error(
      "Invalid compiled contract class JSON: 'bytecode' must be an array of strings",
    )
  }

  if (!Array.isArray(obj.hints)) {
    throw new Error(
      "Invalid compiled contract class JSON: missing or invalid 'hints' field",
    )
  }

  if (!isValidEntryPointsByType(obj.entry_points_by_type)) {
    throw new Error(
      "Invalid compiled contract class JSON: missing or invalid 'entry_points_by_type' field",
    )
  }

  // Build the CairoAssembly object
  const cairoAssembly: CairoAssembly = {
    prime: obj.prime,
    compiler_version: obj.compiler_version,
    bytecode: obj.bytecode as string[],
    hints: obj.hints,
    entry_points_by_type: obj.entry_points_by_type,
  }

  // Add optional fields if present
  if (obj.pythonic_hints !== undefined) {
    if (!isValidPythonicHints(obj.pythonic_hints)) {
      throw new Error(
        "Invalid compiled contract class JSON: 'pythonic_hints' must be an array of [number, string[]] tuples",
      )
    }
    cairoAssembly.pythonic_hints = obj.pythonic_hints
  }

  if (obj.bytecode_segment_lengths !== undefined) {
    if (
      !Array.isArray(obj.bytecode_segment_lengths) ||
      !obj.bytecode_segment_lengths.every((item) => typeof item === "number")
    ) {
      throw new Error(
        "Invalid compiled contract class JSON: 'bytecode_segment_lengths' must be an array of numbers",
      )
    }
    cairoAssembly.bytecode_segment_lengths =
      obj.bytecode_segment_lengths as number[]
  }

  return cairoAssembly as CompiledSierraCasm
}

/**
 * CONTRACT_CLASS type definition (from @starknet-io/types-js)
 * This matches the CONTRACT_CLASS type used in AddDeclareTransactionParameters
 */
type ContractClass = {
  sierra_program: string[]
  contract_class_version: string
  entry_points_by_type: {
    CONSTRUCTOR: SierraEntryPoint[]
    EXTERNAL: SierraEntryPoint[]
    L1_HANDLER: SierraEntryPoint[]
  }
  abi: string
}

type SierraEntryPoint = {
  selector: string
  function_idx: number
}

/**
 * Validates if the JSON value is a valid SierraEntryPoint
 */
function isValidSierraEntryPoint(value: unknown): value is SierraEntryPoint {
  if (!value || typeof value !== "object") {
    return false
  }

  const obj = value as Record<string, unknown>

  return (
    typeof obj.selector === "string" && typeof obj.function_idx === "number"
  )
}

/**
 * Validates if the JSON value is a valid ContractClass entry_points_by_type
 */
function isValidContractClassEntryPoints(
  value: unknown,
): value is ContractClass["entry_points_by_type"] {
  if (!value || typeof value !== "object") {
    return false
  }

  const obj = value as Record<string, unknown>

  return (
    Array.isArray(obj.CONSTRUCTOR) &&
    Array.isArray(obj.EXTERNAL) &&
    Array.isArray(obj.L1_HANDLER) &&
    obj.CONSTRUCTOR.every(isValidSierraEntryPoint) &&
    obj.EXTERNAL.every(isValidSierraEntryPoint) &&
    obj.L1_HANDLER.every(isValidSierraEntryPoint)
  )
}

/**
 * Finds a field in an object by trying multiple key variations (case-insensitive)
 * @param obj - The object to search
 * @param possibleKeys - Array of possible key names to try
 * @returns The value if found, undefined otherwise
 */
function findFieldByKeys(
  obj: Record<string, unknown>,
  possibleKeys: string[],
): { key: string; value: unknown } | undefined {
  const lowerKeys = new Map<string, string>()
  for (const key of Object.keys(obj)) {
    lowerKeys.set(key.toLowerCase(), key)
  }

  for (const possibleKey of possibleKeys) {
    const actualKey = lowerKeys.get(possibleKey.toLowerCase())
    if (actualKey && obj[actualKey] !== undefined) {
      return { key: actualKey, value: obj[actualKey] }
    }
  }

  return undefined
}

/**
 * Converts abi value to string (handles both string and object)
 * @param abiValue - The abi value (string or object)
 * @returns string representation of abi
 */
function normalizeAbi(abiValue: unknown): string {
  if (typeof abiValue === "string") {
    return abiValue
  }

  if (abiValue && typeof abiValue === "object") {
    try {
      return JSON.stringify(abiValue)
    } catch (e) {
      throw new Error(
        `Invalid contract class JSON: 'abi' field cannot be serialized: ${e}`,
      )
    }
  }

  throw new Error(
    "Invalid contract class JSON: 'abi' field must be a string or object",
  )
}

/**
 * Converts JSON value to ContractClass (CONTRACT_CLASS)
 * @param json - The JSON value to convert
 * @returns ContractClass instance
 * @throws Error if the JSON is not a valid ContractClass
 */
export function convertToContractClass(json: JsonValue): ContractClass {
  if (!json || typeof json !== "object") {
    throw new Error("Invalid contract class JSON: must be an object")
  }

  const obj = json as Record<string, unknown>

  // Get available keys for better error messages
  const availableKeys = Object.keys(obj).join(", ")

  // Validate required fields with flexible key lookup
  const sierraProgramField = findFieldByKeys(obj, [
    "sierra_program",
    "sierraProgram",
    "sierra-program",
  ])
  if (!sierraProgramField || !Array.isArray(sierraProgramField.value)) {
    throw new Error(
      `Invalid contract class JSON: missing or invalid 'sierra_program' field. Available keys: ${availableKeys}`,
    )
  }

  // Validate sierra_program is an array of strings
  if (!sierraProgramField.value.every((item) => typeof item === "string")) {
    throw new Error(
      "Invalid contract class JSON: 'sierra_program' must be an array of strings",
    )
  }

  const contractClassVersionField = findFieldByKeys(obj, [
    "contract_class_version",
    "contractClassVersion",
    "contract-class-version",
    "version",
  ])
  if (
    !contractClassVersionField ||
    typeof contractClassVersionField.value !== "string"
  ) {
    throw new Error(
      `Invalid contract class JSON: missing or invalid 'contract_class_version' field. Available keys: ${availableKeys}`,
    )
  }

  const entryPointsField = findFieldByKeys(obj, [
    "entry_points_by_type",
    "entryPointsByType",
    "entry-points-by-type",
  ])
  if (
    !entryPointsField ||
    !isValidContractClassEntryPoints(entryPointsField.value)
  ) {
    throw new Error(
      `Invalid contract class JSON: missing or invalid 'entry_points_by_type' field. Available keys: ${availableKeys}`,
    )
  }

  // Find abi field with flexible lookup
  const abiField = findFieldByKeys(obj, ["abi", "ABI", "Abi"])
  if (!abiField) {
    throw new Error(
      `Invalid contract class JSON: missing 'abi' field. Available keys: ${availableKeys}`,
    )
  }

  // Normalize abi (convert object to string if needed)
  const abiString = normalizeAbi(abiField.value)

  // Build the ContractClass object
  const contractClass: ContractClass = {
    sierra_program: sierraProgramField.value as string[],
    contract_class_version: contractClassVersionField.value as string,
    entry_points_by_type:
      entryPointsField.value as ContractClass["entry_points_by_type"],
    abi: abiString,
  }

  return contractClass
}
