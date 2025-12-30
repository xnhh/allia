import { Button } from "@/components/ui/Button"
import { Contract, contractsService } from "@/services/contracts"
import { useAccount } from "@starknet-react/core"
import { useState, useRef } from "react"
import { isMainnet, toHexChainid } from "@/helpers/chainId"
import { useDeclareContract } from "./hooks/useDeclareContract"
import { useDeployContract } from "./hooks/useDeployContract"
import {
  extractContractNameFromFileName,
  extractClassHash,
  extractCompiledClassHash,
  getStatusColor,
} from "./utils/contractUtils"

interface ContractCardProps {
  contract: Contract
  onUpdate: () => void
  onDelete: (id: string) => void
}

type CardMode = "view" | "edit"
type JsonValue = unknown

export function ContractCard({
  contract,
  onUpdate,
  onDelete,
}: ContractCardProps) {
  const { account, chainId } = useAccount()
  const {
    declare,
    isLoading: isDeclaring,
    error: declareError,
  } = useDeclareContract()
  const {
    deploy,
    isLoading: isDeploying,
    error: deployError,
  } = useDeployContract()

  // 新创建的合约（名称为 "New Contract" 且没有 class_hash）默认进入编辑模式
  const [mode, setMode] = useState<CardMode>(
    contract.name === "New Contract" && !contract.class_hash ? "edit" : "view",
  )
  const [name, setName] = useState(contract.name)
  const [description, setDescription] = useState(contract.description || "")
  const [classFile, setClassFile] = useState<File | null>(null)
  const [compiledClassFile, setCompiledClassFile] = useState<File | null>(null)
  const [classJson, setClassJson] = useState<JsonValue>(
    contract.contract_class_json,
  )
  const [compiledClassJson, setCompiledClassJson] = useState<JsonValue>(
    contract.compiled_contract_class_json,
  )
  const [classHash, setClassHash] = useState(contract.class_hash || "")
  const [compiledClassHash, setCompiledClassHash] = useState(
    contract.compiled_class_hash || "",
  )
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  // 合并错误状态
  const error = declareError || deployError || saveError
  const isLoading = isDeclaring || isDeploying || isSaving

  const classFileInputRef = useRef<HTMLInputElement>(null)
  const compiledClassFileInputRef = useRef<HTMLInputElement>(null)

  const hexChainId = toHexChainid(chainId)
  const isMainnetNetwork = isMainnet(hexChainId)

  const handleClassFileRead = (file: File) => {
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const content = reader.result as string
        const json = JSON.parse(content) as JsonValue
        setClassJson(json)

        // 提取 class_hash
        const extractedHash = extractClassHash(json)

        if (extractedHash) {
          setClassHash(extractedHash)
        } else {
          setSaveError("Could not extract class_hash from contract class JSON")
        }
      } catch (e) {
        setSaveError("Failed to parse contract class JSON file")
        console.error(e)
      }
    }
    reader.readAsText(file)
  }

  const handleCompiledClassFileRead = (file: File) => {
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const content = reader.result as string
        const json = JSON.parse(content) as JsonValue
        setCompiledClassJson(json)

        // 提取 compiled_class_hash
        const extractedHash = extractCompiledClassHash(json)
        if (extractedHash) {
          setCompiledClassHash(extractedHash)
        } else {
          setSaveError(
            "Could not extract compiled_class_hash from compiled contract class JSON",
          )
        }
      } catch (e) {
        setSaveError("Failed to parse compiled contract class JSON file")
        console.error(e)
      }
    }
    reader.readAsText(file)
  }

  const handleClassFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setClassFile(file)
      // 从文件名自动提取合约名称
      const extractedName = extractContractNameFromFileName(file.name)
      setName(extractedName)
      handleClassFileRead(file)
    }
  }

  const handleCompiledClassFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0]
    if (file) {
      setCompiledClassFile(file)
      // 从文件名自动提取合约名称（优先使用 compiled class 文件名）
      const extractedName = extractContractNameFromFileName(file.name)
      setName(extractedName)
      handleCompiledClassFileRead(file)
    }
  }

  const handleSave = async () => {
    try {
      setIsSaving(true)
      setSaveError(null)

      // 保存基本信息，状态保持为 draft（除非已经有 declare_tx_hash）
      await contractsService.update(contract.id, {
        name,
        description,
        contractClassJson: classJson || undefined,
        compiledContractClassJson: compiledClassJson || undefined,
        classHash: classHash || undefined,
        compiledClassHash: compiledClassHash || undefined,
        // 只有在已经有 declare_tx_hash 的情况下才设置为 declared
        status: contract.declare_tx_hash ? "declared" : "draft",
      })

      setMode("view")
      onUpdate()
    } catch (e) {
      setSaveError((e as Error).message)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeclare = async () => {
    const contractClassToUse = classJson || contract.contract_class_json
    const compiledClassToUse =
      compiledClassJson || contract.compiled_contract_class_json

    try {
      await declare({
        contractId: contract.id,
        contractClassJson: contractClassToUse,
        compiledContractClassJson: compiledClassToUse,
        onSuccess: ({
          classHash: declaredClassHash,
          compiledClassHash: declaredCompiledHash,
        }) => {
          // Update local state with declared hashes
          setClassHash(declaredClassHash)
          setCompiledClassHash(declaredCompiledHash)
          onUpdate()
        },
      })
    } catch (e) {
      // Error is handled by the hook
      console.error("Declare failed:", e)
    }
  }

  const handleDeploy = async () => {
    const hashToUse = classHash || contract.class_hash
    if (!hashToUse) {
      return
    }

    try {
      await deploy({
        contractId: contract.id,
        classHash: hashToUse,
        compiledClassHash: compiledClassHash || contract.compiled_class_hash,
        constructorCalldata: [],
        onSuccess: () => {
          onUpdate()
        },
      })
    } catch (e) {
      // Error is handled by the hook
      console.error("Deploy failed:", e)
    }
  }

  const openOnVoyager = (type: "tx" | "class" | "contract", hash: string) => {
    const baseUrl = isMainnetNetwork
      ? "https://voyager.online"
      : "https://sepolia.voyager.online"
    const path = type === "tx" ? "tx" : type === "class" ? "class" : "contract"
    window.open(`${baseUrl}/${path}/${hash}`, "_blank")
  }

  const currentClassHash = classHash || contract.class_hash
  const currentCompiledClassHash =
    compiledClassHash || contract.compiled_class_hash

  return (
    <div className="border border-neutral-700 rounded-lg p-4 bg-neutral-900/50 hover:border-neutral-600 transition-colors">
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          {mode === "edit" ? (
            <div>
              <input
                type="text"
                value={name}
                readOnly
                className="w-full bg-neutral-800 border border-neutral-600 rounded px-3 py-1 text-white text-lg font-semibold cursor-default"
                placeholder="Contract name (auto-extracted from file)"
                title="Contract name is automatically extracted from the uploaded file name"
              />
              <p className="text-xs text-neutral-500 mt-1">
                Name extracted from file:{" "}
                {classFile?.name || compiledClassFile?.name || "No file"}
              </p>
            </div>
          ) : (
            <h3 className="text-lg font-semibold text-white">
              {contract.name}
            </h3>
          )}
        </div>
        <div className="flex items-center gap-2 ml-4">
          <span
            className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(contract.status)}`}
          >
            {contract.status.toUpperCase()}
          </span>
          <button
            onClick={() => onDelete(contract.id)}
            className="text-red-400 hover:text-red-300 p-1"
            title="Delete contract"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Description */}
      {mode === "edit" ? (
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full bg-neutral-800 border border-neutral-600 rounded px-3 py-2 text-neutral-300 text-sm mb-4 min-h-[60px]"
          placeholder="Contract description (optional)"
        />
      ) : (
        contract.description && (
          <p className="text-neutral-400 text-sm mb-4">
            {contract.description}
          </p>
        )
      )}

      {/* File uploads (edit mode) */}
      {mode === "edit" && (
        <div className="space-y-3 mb-4">
          <div>
            <label className="block text-sm text-neutral-400 mb-1">
              Contract Class File (.sierra.json)
            </label>
            <div className="flex items-center gap-2">
              <input
                ref={classFileInputRef}
                type="file"
                accept=".json"
                onChange={handleClassFileChange}
                className="hidden"
              />
              <button
                onClick={() => classFileInputRef.current?.click()}
                className="px-3 py-1.5 bg-neutral-800 border border-neutral-600 rounded text-sm text-neutral-300 hover:bg-neutral-700"
              >
                {classFile?.name ||
                  (classJson ? "File uploaded ✓" : "Choose file")}
              </button>
              {classHash && (
                <span
                  className="text-xs text-green-400 font-mono truncate max-w-[200px]"
                  title={classHash}
                >
                  Hash: {classHash.slice(0, 10)}...{classHash.slice(-6)}
                </span>
              )}
            </div>
            <p className="text-xs text-neutral-500 mt-1">
              Upload the contract class JSON file (Sierra format)
            </p>
          </div>
          <div>
            <label className="block text-sm text-neutral-400 mb-1">
              Compiled Contract Class File (.casm.json)
            </label>
            <div className="flex items-center gap-2">
              <input
                ref={compiledClassFileInputRef}
                type="file"
                accept=".json"
                onChange={handleCompiledClassFileChange}
                className="hidden"
              />
              <button
                onClick={() => compiledClassFileInputRef.current?.click()}
                className="px-3 py-1.5 bg-neutral-800 border border-neutral-600 rounded text-sm text-neutral-300 hover:bg-neutral-700"
              >
                {compiledClassFile?.name ||
                  (compiledClassJson ? "File uploaded ✓" : "Choose file")}
              </button>
              {compiledClassHash && (
                <span
                  className="text-xs text-green-400 font-mono truncate max-w-[200px]"
                  title={compiledClassHash}
                >
                  Hash: {compiledClassHash.slice(0, 10)}...
                  {compiledClassHash.slice(-6)}
                </span>
              )}
            </div>
            <p className="text-xs text-neutral-500 mt-1">
              Upload the compiled contract class JSON file (CASM format)
            </p>
          </div>
        </div>
      )}

      {/* Contract Info (view mode) */}
      {mode === "view" && currentClassHash && (
        <div className="mb-4 p-3 bg-neutral-800/50 rounded space-y-3">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-neutral-500">Class Hash</span>
              {/* 只有在 declared 或 deployed 状态下才显示 Voyager 链接 */}
              {contract.status !== "draft" && (
                <button
                  onClick={() => openOnVoyager("class", currentClassHash)}
                  className="text-lavander-sky hover:underline text-xs"
                >
                  View on Voyager →
                </button>
              )}
            </div>
            <p className="text-neutral-300 text-xs font-mono break-all">
              {currentClassHash}
            </p>
          </div>
          {currentCompiledClassHash && (
            <div>
              <span className="text-xs text-neutral-500">
                Compiled Class Hash
              </span>
              <p className="text-neutral-300 text-xs font-mono break-all mt-1">
                {currentCompiledClassHash}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Instances */}
      {contract.instances && contract.instances.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-neutral-400 mb-2">
            Deployed Instances
          </h4>
          <div className="space-y-2">
            {contract.instances.map((instance) => (
              <div
                key={instance.id}
                className="p-2 bg-neutral-800/50 rounded text-xs"
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`px-1.5 py-0.5 rounded ${getStatusColor(instance.status)}`}
                  >
                    {instance.status}
                  </span>
                  <button
                    onClick={() =>
                      openOnVoyager("contract", instance.instance_address)
                    }
                    className="text-lavander-sky hover:underline"
                  >
                    View →
                  </button>
                </div>
                <p className="text-neutral-300 font-mono mt-1 break-all">
                  {instance.instance_address}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <p className="text-red-400 text-sm mb-4 p-2 bg-red-400/10 rounded">
          {error}
        </p>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-2">
        {mode === "view" ? (
          <>
            <Button
              onClick={() => setMode("edit")}
              className="flex-1 text-sm py-2"
              hideChevron
            >
              Edit
            </Button>
            {/* Draft 状态下显示 Declare 按钮 */}
            {contract.status === "draft" &&
              (classJson || contract.contract_class_json) &&
              (compiledClassJson || contract.compiled_contract_class_json) && (
                <Button
                  onClick={handleDeclare}
                  disabled={isLoading || !account}
                  className="flex-1 text-sm py-2"
                  hideChevron
                >
                  {isLoading ? "Declaring..." : "Declare"}
                </Button>
              )}
            {/* Declared/Deployed 状态下显示 Deploy 按钮 */}
            {contract.status !== "draft" && currentClassHash && (
              <Button
                onClick={handleDeploy}
                disabled={isLoading || !account}
                className="flex-1 text-sm py-2"
                hideChevron
              >
                {isLoading ? "Deploying..." : "Deploy New Instance"}
              </Button>
            )}
          </>
        ) : (
          <>
            <Button
              onClick={handleSave}
              disabled={isLoading}
              className="flex-1 text-sm py-2"
              hideChevron
            >
              {isLoading ? "Saving..." : "Save"}
            </Button>
            <Button
              onClick={() => {
                setMode("view")
                setName(contract.name)
                setDescription(contract.description || "")
                setClassJson(contract.contract_class_json)
                setCompiledClassJson(contract.compiled_contract_class_json)
                setClassHash(contract.class_hash || "")
                setCompiledClassHash(contract.compiled_class_hash || "")
                setClassFile(null)
                setCompiledClassFile(null)
                setSaveError(null)
              }}
              className="flex-1 text-sm py-2 bg-neutral-700 hover:bg-neutral-600"
              hideChevron
            >
              Cancel
            </Button>
          </>
        )}
      </div>
    </div>
  )
}
