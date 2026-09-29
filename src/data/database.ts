import { ACTIONS, CATEGORIES, REASONS, STATUSES, TONER_COLORS } from '../domain/labels'
import type {
  Asset,
  AssetCategory,
  AssetStatus,
  AuditAction,
  AuditLog,
  Computer,
  Database,
  Disposal,
  DisposalReason,
  Extension,
  MovementType,
  Part,
  Printer,
  PrinterType,
  Role,
  Sector,
  Settings,
  SupplyKind,
  SupplyMovement,
  Toner,
  TonerColor,
} from '../domain/types'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function str(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback
}

function num(value: unknown, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value) ? Math.trunc(value) : fallback
}

function bool(value: unknown, fallback = false): boolean {
  return typeof value === 'boolean' ? value : fallback
}

function oneOf<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return typeof value === 'string' && (allowed as readonly string[]).includes(value) ? (value as T) : fallback
}

export function emptyDatabase(): Database {
  return {
    version: 1,
    settings: {
      organizationName: 'Controle de Materiais',
      operatorName: 'Administrador',
      role: 'admin',
    },
    sectors: [],
    assets: [],
    printers: [],
    toners: [],
    parts: [],
    movements: [],
    disposals: [],
    extensions: [],
    computers: [],
    audit: [],
  }
}

function rows(value: unknown): unknown[] {
  return Array.isArray(value) ? value : []
}

export function normalizeDatabase(raw: unknown): Database | null {
  if (!isRecord(raw) || raw.version !== 1 || !isRecord(raw.settings)) return null
  const settings: Settings = {
    organizationName: str(raw.settings.organizationName, 'Controle de Materiais').trim() || 'Controle de Materiais',
    operatorName: str(raw.settings.operatorName, 'Administrador').trim() || 'Administrador',
    role: oneOf<Role>(raw.settings.role, ['admin', 'consulta'], 'consulta'),
  }

  const sectors = rows(raw.sectors).flatMap((item) => {
    if (!isRecord(item) || !str(item.id)) return []
    const sector: Sector = {
      id: str(item.id),
      name: str(item.name, 'Setor').trim() || 'Setor',
      createdAt: str(item.createdAt, new Date().toISOString()),
      updatedAt: str(item.updatedAt, new Date().toISOString()),
    }
    return [sector]
  })

  const assets = rows(raw.assets).flatMap((item) => {
    if (!isRecord(item) || !str(item.id)) return []
    const asset: Asset = {
      id: str(item.id),
      description: str(item.description),
      brand: str(item.brand),
      model: str(item.model),
      serial: str(item.serial),
      tombo: str(item.tombo),
      category: oneOf<AssetCategory>(item.category, CATEGORIES, 'outro'),
      sectorId: str(item.sectorId),
      location: str(item.location),
      responsible: str(item.responsible),
      origin: str(item.origin),
      acquiredAt: str(item.acquiredAt),
      warrantyUntil: str(item.warrantyUntil),
      status: oneOf<AssetStatus>(item.status, STATUSES, 'ativo'),
      lastCheckedAt: item.lastCheckedAt == null ? null : str(item.lastCheckedAt),
      createdAt: str(item.createdAt, new Date().toISOString()),
      updatedAt: str(item.updatedAt, new Date().toISOString()),
    }
    return [asset]
  })

  const printers = rows(raw.printers).flatMap((item) => {
    if (!isRecord(item) || !str(item.id)) return []
    const printer: Printer = {
      id: str(item.id),
      name: str(item.name),
      code: str(item.code),
      manufacturer: str(item.manufacturer),
      model: str(item.model),
      serial: str(item.serial),
      ip: str(item.ip),
      location: str(item.location),
      sectorId: str(item.sectorId),
      type: oneOf<PrinterType>(item.type, ['colorida', 'monocromatica'], 'colorida'),
      createdAt: str(item.createdAt, new Date().toISOString()),
      updatedAt: str(item.updatedAt, new Date().toISOString()),
    }
    return [printer]
  })

  const toners = rows(raw.toners).flatMap((item) => {
    if (!isRecord(item) || !str(item.id) || !str(item.printerId)) return []
    const color = oneOf<TonerColor | ''>(item.color, TONER_COLORS, '')
    if (!color) return []
    const toner: Toner = {
      id: str(item.id),
      printerId: str(item.printerId),
      color,
      model: str(item.model),
      code: str(item.code),
      stock: Math.max(0, num(item.stock)),
      minimum: Math.max(0, num(item.minimum, 1)),
      createdAt: str(item.createdAt, new Date().toISOString()),
      updatedAt: str(item.updatedAt, new Date().toISOString()),
    }
    return [toner]
  })

  const parts = rows(raw.parts).flatMap((item) => {
    if (!isRecord(item) || !str(item.id) || !str(item.printerId)) return []
    const part: Part = {
      id: str(item.id),
      printerId: str(item.printerId),
      name: str(item.name, 'Peça'),
      stock: Math.max(0, num(item.stock)),
      minimum: Math.max(0, num(item.minimum)),
      notes: str(item.notes),
      createdAt: str(item.createdAt, new Date().toISOString()),
      updatedAt: str(item.updatedAt, new Date().toISOString()),
    }
    return [part]
  })

  const movements = rows(raw.movements).flatMap((item) => {
    if (!isRecord(item) || !str(item.id)) return []
    const movement: SupplyMovement = {
      id: str(item.id),
      printerId: str(item.printerId),
      supplyKind: oneOf<SupplyKind>(item.supplyKind, ['toner', 'peca'], 'peca'),
      supplyId: str(item.supplyId),
      supplyName: str(item.supplyName, 'Suprimento'),
      type: oneOf<MovementType>(item.type, ['entrada', 'saida'], 'entrada'),
      quantity: Math.max(0, num(item.quantity)),
      user: str(item.user),
      notes: str(item.notes),
      createdAt: str(item.createdAt, new Date().toISOString()),
    }
    return [movement]
  })

  const disposals = rows(raw.disposals).flatMap((item) => {
    if (!isRecord(item) || !str(item.id)) return []
    const disposal: Disposal = {
      id: str(item.id),
      date: str(item.date),
      sectorId: str(item.sectorId),
      printerId: str(item.printerId),
      printerName: str(item.printerName),
      printerModel: str(item.printerModel),
      manufacturer: str(item.manufacturer),
      supplyType: str(item.supplyType),
      quantity: Math.max(0, num(item.quantity)),
      reason: oneOf<DisposalReason>(item.reason, REASONS, 'outro'),
      responsible: str(item.responsible),
      notes: str(item.notes),
      createdAt: str(item.createdAt, new Date().toISOString()),
      updatedAt: str(item.updatedAt, new Date().toISOString()),
    }
    return [disposal]
  })

  const extensions = rows(raw.extensions).flatMap((item) => {
    if (!isRecord(item) || !str(item.id)) return []
    const extension: Extension = {
      id: str(item.id),
      number: str(item.number),
      externalLine: str(item.externalLine),
      assetId: str(item.assetId),
      ip: str(item.ip),
      model: str(item.model),
      sectorId: str(item.sectorId),
      nameLocation: str(item.nameLocation),
      active: bool(item.active, true),
      createdAt: str(item.createdAt, new Date().toISOString()),
      updatedAt: str(item.updatedAt, new Date().toISOString()),
    }
    return [extension]
  })

  const computers = rows(raw.computers).flatMap((item) => {
    if (!isRecord(item) || !str(item.id)) return []
    const computer: Computer = {
      id: str(item.id),
      assetId: str(item.assetId),
      hostname: str(item.hostname),
      userName: str(item.userName),
      sectorId: str(item.sectorId),
      ip: str(item.ip),
      os: str(item.os),
      status: oneOf<AssetStatus>(item.status, STATUSES, 'ativo'),
      lastCheckedAt: item.lastCheckedAt == null ? null : str(item.lastCheckedAt),
      createdAt: str(item.createdAt, new Date().toISOString()),
      updatedAt: str(item.updatedAt, new Date().toISOString()),
    }
    return [computer]
  })

  const audit = rows(raw.audit).flatMap((item) => {
    if (!isRecord(item) || !str(item.id)) return []
    const entry: AuditLog = {
      id: str(item.id),
      at: str(item.at, new Date().toISOString()),
      operator: str(item.operator, 'Administrador'),
      action: oneOf<AuditAction>(item.action, ACTIONS, 'editar'),
      entity: str(item.entity, 'Registro'),
      entityId: str(item.entityId),
      summary: str(item.summary),
    }
    return [entry]
  })

  return {
    version: 1,
    settings,
    sectors,
    assets,
    printers,
    toners,
    parts,
    movements,
    disposals,
    extensions,
    computers,
    audit,
  }
}
