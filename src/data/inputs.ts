import type {
  AssetCategory,
  AssetStatus,
  DisposalReason,
  MovementType,
  PrinterType,
  Settings,
  SupplyKind,
} from '../domain/types'

export type AssetInput = {
  id?: string
  description: string
  brand: string
  model: string
  serial: string
  tombo: string
  category: AssetCategory
  sectorId: string
  location: string
  responsible: string
  origin: string
  acquiredAt: string
  warrantyUntil: string
  status: AssetStatus
}

export type PrinterInput = {
  id?: string
  name: string
  code: string
  manufacturer: string
  model: string
  serial: string
  ip: string
  location: string
  sectorId: string
  type: PrinterType
}

export type TonerInput = {
  id: string
  model: string
  code: string
  minimum: number
}

export type PartInput = {
  id?: string
  printerId: string
  name: string
  minimum: number
  notes: string
}

export type MoveInput = {
  supplyKind: SupplyKind
  supplyId: string
  type: MovementType
  quantity: number
  user: string
  notes: string
}

export type DisposalInput = {
  id?: string
  date: string
  sectorId: string
  printerId: string
  supplyType: string
  quantity: number
  reason: DisposalReason
  responsible: string
  notes: string
  deductStock: boolean
  supplyKind?: SupplyKind
  supplyId?: string
}

export type ExtensionInput = {
  id?: string
  number: string
  externalLine: string
  assetId: string
  ip: string
  model: string
  sectorId: string
  nameLocation: string
  active: boolean
}

export type ComputerInput = {
  id?: string
  assetId?: string
  description: string
  brand: string
  model: string
  serial: string
  tombo: string
  sectorId: string
  location: string
  responsible: string
  origin: string
  acquiredAt: string
  warrantyUntil: string
  hostname: string
  userName: string
  ip: string
  os: string
  status: AssetStatus
}

export type SettingsPatch = Partial<Settings>
