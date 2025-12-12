"use client"
import { WBTCTokenAddress } from "@/constants"
import { useAccount } from "@starknet-react/core"
import { useEffect, useState } from "react"
import { CallData } from "starknet"
import { rpcService } from "@/services/rpc"
import { Spinner } from "../../../components/ui/Spinner"

interface WBTCBalanceModalProps {
  isOpen: boolean
  onClose: () => void
}

const WBTCBalanceModal = ({ isOpen, onClose }: WBTCBalanceModalProps) => {
  const { address } = useAccount()
  const [balance, setBalance] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen && address) {
      fetchWBTCBalance()
    }
  }, [isOpen, address])

  const fetchWBTCBalance = async () => {
    if (!address) return

    setIsLoading(true)
    setError(null)
    try {
      const result = await rpcService.callContract({
        contractAddress: WBTCTokenAddress,
        entrypoint: "balanceOf",
        calldata: CallData.compile([address]),
      })
      
      // balanceOf returns a u256, which is represented as [low, high]
      // The result might be an array directly or wrapped in a result object
      const resultArray = Array.isArray(result) ? result : (result as any).result || []
      const [low, high] = resultArray as [string, string]
      
      // Convert hex to decimal
      const lowBigInt = BigInt(low || "0x0")
      const highBigInt = BigInt(high || "0x0")
      const totalBalance = highBigInt * BigInt(2 ** 128) + lowBigInt
      
      // WBTC has 8 decimals
      const formattedBalance = (Number(totalBalance) / Math.pow(10, 8)).toFixed(8)
      setBalance(formattedBalance)
    } catch (err) {
      setError((err as Error).message || "Failed to fetch WBTC balance")
      setBalance(null)
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-raisin-black border border-charcoal rounded-lg p-6 max-w-md w-full mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-white">WBTC Balance</h2>
          <button
            onClick={onClose}
            className="text-medium-grey hover:text-white transition-colors"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <div className="flex flex-col gap-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Spinner />
            </div>
          ) : error ? (
            <div className="text-red-500 text-center py-4">{error}</div>
          ) : (
            <div className="text-center py-4">
              <div className="text-3xl font-bold text-white mb-2">
                {balance || "0.00000000"}
              </div>
              <div className="text-medium-grey">WBTC</div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export { WBTCBalanceModal }

