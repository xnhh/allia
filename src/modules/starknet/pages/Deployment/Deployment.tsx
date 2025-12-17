import { Button } from "@/components/ui/Button"
import { Spinner } from "@/components/ui/Spinner"
import { Contract, contractsService } from "@/services/contracts"
import { useAccount } from "@starknet-react/core"
import { useEffect, useState, useCallback } from "react"
import { isMainnet, toHexChainid } from "@/helpers/chainId"
import { SectionLayout } from "@/modules/starknet/components/sections/SectionLayout"
import { ContractCard } from "./ContractCard"

export function Deployment() {
  const { account, address, chainId } = useAccount()
  const [contracts, setContracts] = useState<Contract[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [newContractName, setNewContractName] = useState("")
  const [showCreateForm, setShowCreateForm] = useState(false)

  const hexChainId = toHexChainid(chainId)
  const network = isMainnet(hexChainId) ? "mainnet" : "sepolia"

  const loadContracts = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const data = await contractsService.list(address, network)
      setContracts(data)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setIsLoading(false)
    }
  }, [address, network])

  useEffect(() => {
    if (address) {
      loadContracts()
    }
  }, [address, loadContracts])

  const handleCreateContract = async () => {
    if (!newContractName.trim()) {
      setError("Contract name is required")
      return
    }

    try {
      setIsCreating(true)
      setError(null)
      await contractsService.create({
        name: newContractName.trim(),
        network,
        ownerAddress: address,
      })
      setNewContractName("")
      setShowCreateForm(false)
      await loadContracts()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setIsCreating(false)
    }
  }

  const handleDeleteContract = async (id: string) => {
    if (!confirm("Are you sure you want to delete this contract?")) {
      return
    }

    try {
      await contractsService.delete(id)
      await loadContracts()
    } catch (e) {
      setError((e as Error).message)
    }
  }

  if (!account || !address) {
    return (
      <SectionLayout sectionTitle="Contract Deployment">
        <div className="flex flex-col items-center justify-center py-12 text-neutral-400">
          <svg
            className="w-12 h-12 mb-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
          <p className="text-lg font-medium">Connect your wallet</p>
          <p className="text-sm text-neutral-500 mt-1">
            Please connect your wallet to manage contracts
          </p>
        </div>
      </SectionLayout>
    )
  }

  return (
    <SectionLayout sectionTitle="Contract Deployment">
      {/* Header with Create Button */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <p className="text-neutral-400 text-sm">
            Network:{" "}
            <span className="text-lavander-sky font-medium">{network}</span>
          </p>
        </div>
        <Button
          onClick={() => setShowCreateForm(true)}
          hideChevron
          className="px-4 py-2"
        >
          + New Contract
        </Button>
      </div>

      {/* Create Form */}
      {showCreateForm && (
        <div className="mb-6 p-4 border border-neutral-700 rounded-lg bg-neutral-900/50">
          <h3 className="text-lg font-semibold text-white mb-4">
            Create New Contract
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-neutral-400 mb-1">
                Contract Name *
              </label>
              <input
                type="text"
                value={newContractName}
                onChange={(e) => setNewContractName(e.target.value)}
                className="w-full bg-neutral-800 border border-neutral-600 rounded px-3 py-2 text-white"
                placeholder="e.g., MyToken"
                autoFocus
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleCreateContract}
                disabled={isCreating || !newContractName.trim()}
                hideChevron
                className="flex-1"
              >
                {isCreating ? "Creating..." : "Create"}
              </Button>
              <Button
                onClick={() => {
                  setShowCreateForm(false)
                  setNewContractName("")
                }}
                hideChevron
                className="flex-1 bg-neutral-700 hover:bg-neutral-600"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 bg-red-400/10 border border-red-400/30 rounded text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Loading State */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      ) : contracts.length === 0 ? (
        /* Empty State */
        <div className="flex flex-col items-center justify-center py-12 text-neutral-400 border border-dashed border-neutral-700 rounded-lg">
          <svg
            className="w-16 h-16 mb-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1}
              d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
            />
          </svg>
          <p className="text-lg font-medium">No contracts yet</p>
          <p className="text-sm text-neutral-500 mt-1 mb-4">
            Create your first contract to get started
          </p>
          <Button onClick={() => setShowCreateForm(true)} hideChevron>
            + Create Contract
          </Button>
        </div>
      ) : (
        /* Contract Cards Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {contracts.map((contract) => (
            <ContractCard
              key={contract.id}
              contract={contract}
              onUpdate={loadContracts}
              onDelete={handleDeleteContract}
            />
          ))}
        </div>
      )}
    </SectionLayout>
  )
}
