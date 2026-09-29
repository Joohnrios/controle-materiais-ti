export type Role = 'admin' | 'consulta'

export type AssetStatus = 'ativo' | 'manutencao' | 'baixado'

export type AssetCategory =
  | 'rede'
  | 'rack'
  | 'energia'
  | 'nobreak'
  | 'firewall'
  | 'computador'
  | 'outro'

export type PrinterType = 'colorida' | 'monocromatica'

export type TonerColor = 'preto' | 'ciano' | 'magenta' | 'amarelo'

export type MovementType = 'entrada' | 'saida'

export type SupplyKind = 'toner' | 'peca'

export type DisposalReason = 'insumo_esgotado' | 'danificado' | 'outro'

export type AuditAction =
  | 'criar'
  | 'editar'
  | 'excluir'
  | 'entrada'
  | 'saida'
  | 'descarte'
  | 'conferencia'
  | 'backup'

export interface Settings {
  organizationName: string
  operatorName: string
  role: Role
}

export interface Sector {
  id: string
  name: string
  createdAt: string
  updatedAt: string
}

export interface Asset {
  id: string
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
  lastCheckedAt: string | null
  createdAt: string
  updatedAt: string
}

export interface Printer {
  id: string
  name: string
  code: string
  manufacturer: string
  model: string
  serial: string
  ip: string
  location: string
  sectorId: string
  type: PrinterType
  createdAt: string
  updatedAt: string
}

export interface Toner {
  id: string
  printerId: string
  color: TonerColor
  model: string
  code: string
  stock: number
  minimum: number
  createdAt: string
  updatedAt: string
}

export interface Part {
  id: string
  printerId: string
  name: string
  stock: number
  minimum: number
  notes: string
  createdAt: string
  updatedAt: string
}

export interface SupplyMovement {
  id: string
  printerId: string
  supplyKind: SupplyKind
  supplyId: string
  supplyName: string
  type: MovementType
  quantity: number
  user: string
  notes: string
  createdAt: string
}

export interface Disposal {
  id: string
  date: string
  sectorId: string
  printerId: string
  printerName: string
  printerModel: string
  manufacturer: string
  supplyType: string
  quantity: number
  reason: DisposalReason
  responsible: string
  notes: string
  createdAt: string
  updatedAt: string
}

export interface Extension {
  id: string
  number: string
  externalLine: string
  assetId: string
  ip: string
  model: string
  sectorId: string
  nameLocation: string
  active: boolean
  createdAt: string
  updatedAt: string
}

export interface Computer {
  id: string
  assetId: string
  hostname: string
  userName: string
  sectorId: string
  ip: string
  os: string
  status: AssetStatus
  lastCheckedAt: string | null
  createdAt: string
  updatedAt: string
}

export interface AuditLog {
  id: string
  at: string
  operator: string
  action: AuditAction
  entity: string
  entityId: string
  summary: string
}

export interface Database {
  version: 1
  settings: Settings
  sectors: Sector[]
  assets: Asset[]
  printers: Printer[]
  toners: Toner[]
  parts: Part[]
  movements: SupplyMovement[]
  disposals: Disposal[]
  extensions: Extension[]
  computers: Computer[]
  audit: AuditLog[]
}
