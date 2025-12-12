import { Abi } from "@starknet-react/core"

const erc20BalanceAbi = [
  {
    type: "function",
    name: "balanceOf",
    state_mutability: "view",
    inputs: [
      {
        name: "account",
        type: "core::starknet::contract_address::ContractAddress",
      },
    ],
    outputs: [
      {
        type: "core::integer::u256",
      },
    ],
  },
] as const satisfies Abi

export { erc20BalanceAbi }

