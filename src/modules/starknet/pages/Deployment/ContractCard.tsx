import { Button } from "@/components/ui/Button"
import { Contract, contractsService } from "@/services/contracts"
import { useAccount, useDeclareContract } from "@starknet-react/core"
import { useState, useRef } from "react"
import { hash, CallData } from "starknet"
import { isMainnet, toHexChainid } from "@/helpers/chainId"

// JSON 类型定义
type JsonValue = unknown

interface ContractCardProps {
  contract: Contract
  onUpdate: () => void
  onDelete: (id: string) => void
}

type CardMode = "view" | "edit"

export function ContractCard({
  contract,
  onUpdate,
  onDelete,
}: ContractCardProps) {
  const { account, address, chainId } = useAccount()
  const { declareAsync } = useDeclareContract({})

  const [mode, setMode] = useState<CardMode>("view")
  const [name, setName] = useState(contract.name)
  const [description, setDescription] = useState(contract.description || "")
  const [sierraFile, setSierraFile] = useState<File | null>(null)
  const [casmFile, setCasmFile] = useState<File | null>(null)
  const [sierraJson, setSierraJson] = useState<JsonValue>(contract.sierra_json)
  const [casmJson, setCasmJson] = useState<JsonValue>(contract.casm_json)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const sierraInputRef = useRef<HTMLInputElement>(null)
  const casmInputRef = useRef<HTMLInputElement>(null)

  const hexChainId = toHexChainid(chainId)
  const isMainnetNetwork = isMainnet(hexChainId)

  const handleFileRead = (file: File, setJson: (json: JsonValue) => void) => {
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const json = JSON.parse(reader.result as string) as JsonValue
        setJson(json)
      } catch {
        setError("Invalid JSON file")
      }
    }
    reader.readAsText(file)
  }

  const handleSierraChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSierraFile(file)
      handleFileRead(file, setSierraJson)
    }
  }

  const handleCasmChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setCasmFile(file)
      handleFileRead(file, setCasmJson)
    }
  }

  const handleSave = async () => {
    try {
      setIsLoading(true)
      setError(null)
      await contractsService.update(contract.id, {
        name,
        description,
        sierraJson,
        casmJson,
      })
      setMode("view")
      onUpdate()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeclare = async () => {
    if (!account || !sierraJson || !casmJson) {
      setError("Please upload both Sierra and Casm files")
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      // Type assertions for Starknet contract classes
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const casmClass = casmJson as any
      const compiledClassHash = hash.computeCompiledClassHash(casmClass)

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sierraClass = sierraJson as any
      const { class_hash, transaction_hash } = await declareAsync({
        contract_class: sierraClass,
        compiled_class_hash: compiledClassHash,
      })

      // 更新数据库
      await contractsService.update(contract.id, {
        classHash: class_hash,
        compiledClassHash: compiledClassHash,
        status: "declared",
        declareTxHash: transaction_hash,
      })

      onUpdate()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeploy = async () => {
    if (!account || !contract.class_hash) {
      setError("Contract must be declared first")
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      // 生成随机 salt
      const salt = "0x" + Math.random().toString(16).slice(2)

      // 部署合约（使用空的构造函数参数，可以根据需要修改）
      const deployResult = await account.deployContract({
        classHash: contract.class_hash,
        constructorCalldata: CallData.compile([]),
        salt,
      })

      // 创建实例记录
      await contractsService.createInstance({
        contractId: contract.id,
        instanceAddress: deployResult.contract_address,
        deployTxHash: deployResult.transaction_hash,
        deployerAddress: address,
        salt,
        status: "deployed",
      })

      // 更新合约状态
      await contractsService.update(contract.id, {
        status: "deployed",
      })

      onUpdate()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setIsLoading(false)
    }
  }

  const openOnVoyager = (type: "tx" | "class" | "contract", hash: string) => {
    const baseUrl = isMainnetNetwork
      ? "https://voyager.online"
      : "https://sepolia.voyager.online"
    const path = type === "tx" ? "tx" : type === "class" ? "class" : "contract"
    window.open(`${baseUrl}/${path}/${hash}`, "_blank")
  }

  const getStatusColor = (status: string) => {
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

  return (
    <div className="border border-neutral-700 rounded-lg p-4 bg-neutral-900/50 hover:border-neutral-600 transition-colors">
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          {mode === "edit" ? (
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-neutral-800 border border-neutral-600 rounded px-3 py-1 text-white text-lg font-semibold"
              placeholder="Contract name"
            />
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
              Sierra File (.sierra.json)
            </label>
            <div className="flex items-center gap-2">
              <input
                ref={sierraInputRef}
                type="file"
                accept=".json"
                onChange={handleSierraChange}
                className="hidden"
              />
              <button
                onClick={() => sierraInputRef.current?.click()}
                className="px-3 py-1.5 bg-neutral-800 border border-neutral-600 rounded text-sm text-neutral-300 hover:bg-neutral-700"
              >
                {sierraFile?.name ||
                  (sierraJson ? "File uploaded ✓" : "Choose file")}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm text-neutral-400 mb-1">
              Casm File (.casm.json)
            </label>
            <div className="flex items-center gap-2">
              <input
                ref={casmInputRef}
                type="file"
                accept=".json"
                onChange={handleCasmChange}
                className="hidden"
              />
              <button
                onClick={() => casmInputRef.current?.click()}
                className="px-3 py-1.5 bg-neutral-800 border border-neutral-600 rounded text-sm text-neutral-300 hover:bg-neutral-700"
              >
                {casmFile?.name ||
                  (casmJson ? "File uploaded ✓" : "Choose file")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Contract Info */}
      {contract.class_hash && (
        <div className="mb-4 p-3 bg-neutral-800/50 rounded">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-neutral-500">Class Hash</span>
            <button
              onClick={() => openOnVoyager("class", contract.class_hash!)}
              className="text-lavander-sky hover:underline text-xs"
            >
              View on Voyager →
            </button>
          </div>
          <p className="text-neutral-300 text-xs font-mono break-all">
            {contract.class_hash}
          </p>
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
            {contract.status === "draft" && sierraJson && casmJson && (
              <Button
                onClick={handleDeclare}
                disabled={isLoading || !account}
                className="flex-1 text-sm py-2"
                hideChevron
              >
                {isLoading ? "Declaring..." : "Declare"}
              </Button>
            )}
            {(contract.status === "declared" ||
              contract.status === "deployed") && (
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
                setError(null)
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
