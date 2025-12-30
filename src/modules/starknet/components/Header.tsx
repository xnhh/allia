import { formatTruncatedAddress } from "@/helpers/formatAddress"
import { useAccount, useDisconnect } from "@starknet-react/core"
import { LogoIcon } from "../../../components/icons/LogoIcon"
import { WalletIcon } from "../../../components/icons/WalletIcon"
import { ExternalIcon } from "../../../components/icons/ExternalIcon"
import { DisconnectIcon } from "../../../components/icons/DisconnectIcon"
import { HeaderConnectButton } from "@/modules/starknet/components/HeaderConnectButton"
import { useBalance } from "@/hooks/useBalance"
import { useChainContext } from "@/contexts/ChainContext"
import { STRKTokenAddress } from "@/constants"

const Header = () => {
  const { address, isConnected } = useAccount()
  const { disconnect } = useDisconnect()
  const { network } = useChainContext()

  const { data: balance } = useBalance(address, {
    contractAddress: STRKTokenAddress,
  })

  // const { data } = useStarkProfile({ address })

  return (
    <>
      <div className="flex p-5 md:pt-[32px] md:px-[116px] md:pb-[16px] bg-black">
        <div className="flex w-full lg:max-w-[1180px] lg:mx-auto">
          <div className="flex items-center w-full">
            <div className="flex items-center gap-1">
              <div className="w-10 h-10">
                <LogoIcon />
              </div>
              <h1 className="font-normal text-md md:text-xl leading-6 mt-0.5 text-nowrap">
                Demo dapp
              </h1>
            </div>
            <div className="flex flex-1 w-full" />

            {isConnected && (
              <div className="flex border-col rounded-md md:rounded-lg gap-3 p-2 md:p-3 border border-solid border-charcoal font-medium text-sm md:text-base text-nowrap hover:bg-raisin-black hover:border-raisin-black">
                <div className="hidden md:flex items-center gap-2">
                  <WalletIcon />
                  {balance
                    ? balance?.formatted.length > 7
                      ? `${balance.formatted.slice(0, 7)} STRK`
                      : `${balance?.formatted} STRK`
                    : "0 STRK"}
                </div>
                <div className="border-solid border-l-[1px] border-charcoal -my-1 mx-0  hidden md:flex" />
                <div
                  className="flex cursor-pointer items-center gap-2"
                  onClick={() =>
                    window.open(
                      network === "mainnet"
                        ? `https://voyager.online/contract/${address}`
                        : `https://sepolia.voyager.online/contract/${address}`,
                      "_blank",
                    )
                  }
                >
                  {/* {data?.profilePicture ? (
                    <Image
                      alt="generic_profile"
                      width={20}
                      height={20}
                      className="w-6 h-6"
                      src={data?.profilePicture}
                      priority
                      unoptimized
                    />
                  ) : (
                    <AvatarIcon />
                  )} */}
                  {formatTruncatedAddress(address || "")}
                  <ExternalIcon />
                </div>
                <div className="border-solid border-l-[1px] border-charcoal -my-1 mx-0" />
                <button
                  className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => disconnect()}
                  title="Disconnect wallet"
                >
                  <DisconnectIcon />
                </button>
              </div>
            )}
            {!isConnected && <HeaderConnectButton />}
          </div>
        </div>
      </div>
    </>
  )
}

export { Header }
