import { wsClient } from "./websocket"

// JSON 类型定义
type JsonValue = unknown

// 合约状态类型
export type ContractStatus = "draft" | "declared" | "deployed"
export type InstanceStatus = "pending" | "deployed" | "failed"

// 合约类型
export interface Contract {
  id: string
  name: string
  description?: string
  network: string
  sierra_json?: JsonValue
  casm_json?: JsonValue
  class_hash?: string
  compiled_class_hash?: string
  status: ContractStatus
  owner_address?: string
  declare_tx_hash?: string
  created_at: string
  updated_at: string
  instances?: ContractInstance[]
}

// 合约实例类型
export interface ContractInstance {
  id: string
  contract_id: string
  instance_address: string
  constructor_calldata?: JsonValue
  deploy_tx_hash?: string
  deployer_address?: string
  salt?: string
  status: InstanceStatus
  created_at: string
  updated_at: string
}

// 合约服务
export const contractsService = {
  // 获取所有合约
  async list(ownerAddress?: string, network?: string): Promise<Contract[]> {
    const result = await wsClient.request<Contract[]>("contracts.list", {
      ownerAddress,
      network,
    })
    return result || []
  },

  // 获取单个合约
  async get(id: string): Promise<Contract | null> {
    try {
      const result = await wsClient.request<Contract>("contracts.get", { id })
      return result
    } catch {
      return null
    }
  },

  // 创建合约
  async create(params: {
    name: string
    description?: string
    network?: string
    sierraJson?: JsonValue
    casmJson?: JsonValue
    ownerAddress?: string
  }): Promise<Contract> {
    const result = await wsClient.request<Contract>("contracts.create", params)
    return result
  },

  // 更新合约
  async update(
    id: string,
    params: {
      name?: string
      description?: string
      sierraJson?: JsonValue
      casmJson?: JsonValue
      classHash?: string
      compiledClassHash?: string
      status?: ContractStatus
      declareTxHash?: string
    },
  ): Promise<Contract> {
    const result = await wsClient.request<Contract>("contracts.update", {
      id,
      ...params,
    })
    return result
  },

  // 删除合约
  async delete(id: string): Promise<void> {
    await wsClient.request<void>("contracts.delete", { id })
  },

  // 创建合约实例
  async createInstance(params: {
    contractId: string
    instanceAddress: string
    constructorCalldata?: JsonValue
    deployTxHash?: string
    deployerAddress?: string
    salt?: string
    status?: InstanceStatus
  }): Promise<ContractInstance> {
    const result = await wsClient.request<ContractInstance>(
      "contracts.instances.create",
      params,
    )
    return result
  },

  // 更新实例状态
  async updateInstanceStatus(
    id: string,
    status: InstanceStatus,
    deployTxHash?: string,
  ): Promise<ContractInstance> {
    const result = await wsClient.request<ContractInstance>(
      "contracts.instances.updateStatus",
      {
        id,
        status,
        deployTxHash,
      },
    )
    return result
  },

  // 删除实例
  async deleteInstance(id: string): Promise<void> {
    await wsClient.request<void>("contracts.instances.delete", { id })
  },
}
