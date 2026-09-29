import { tonerColorLabel, TONER_COLORS } from '../domain/labels'
import type {
  Asset,
  AuditAction,
  AuditLog,
  Computer,
  Database,
  Disposal,
  Extension,
  Part,
  Printer,
  SupplyMovement,
  Toner,
  TonerColor,
} from '../domain/types'
import { normalizeDatabase } from './database'
import type {
  AssetInput,
  ComputerInput,
  DisposalInput,
  ExtensionInput,
  MoveInput,
  PartInput,
  PrinterInput,
  SettingsPatch,
  TonerInput,
} from './inputs'

export type Result = { ok: true; db: Database } | { ok: false; error: string }

function uid(): string {
  return crypto.randomUUID()
}

function now(): string {
  return new Date().toISOString()
}

function fail(error: string): Result {
  return { ok: false, error }
}

function ok(db: Database): Result {
  return { ok: true, db }
}

function assertEdit(db: Database): string | null {
  if (db.settings.role !== 'admin') return 'Seu acesso é somente visualização.'
  return null
}

function operatorName(db: Database): string {
  return db.settings.operatorName.trim() || 'Administrador'
}

function sameText(left: string, right: string): boolean {
  return left.trim().toLocaleLowerCase('pt-BR') === right.trim().toLocaleLowerCase('pt-BR')
}

function positiveInt(value: number): boolean {
  return Number.isInteger(value) && value > 0
}

function nonNegativeInt(value: number): boolean {
  return Number.isInteger(value) && value >= 0
}

function audit(
  db: Database,
  entry: { action: AuditAction; entity: string; entityId: string; summary: string },
  operator = operatorName(db),
): Database {
  const log: AuditLog = {
    id: uid(),
    at: now(),
    operator,
    action: entry.action,
    entity: entry.entity,
    entityId: entry.entityId,
    summary: entry.summary,
  }
  return { ...db, audit: [log, ...db.audit] }
}

function changedLabels<T extends object>(
  before: T,
  after: T,
  labels: Partial<Record<keyof T, string>>,
): string[] {
  const changes: string[] = []
  for (const key of Object.keys(labels) as (keyof T)[]) {
    if (before[key] !== after[key] && labels[key]) changes.push(labels[key])
  }
  return changes
}

function sectorExists(db: Database, sectorId: string): boolean {
  return !sectorId || db.sectors.some((sector) => sector.id === sectorId)
}

export function updateSettings(db: Database, patch: SettingsPatch): Result {
  const onlyRole = Object.keys(patch).every((key) => key === 'role')
  if (db.settings.role !== 'admin' && !onlyRole) {
    return fail('Seu acesso é somente visualização.')
  }
  const settings = {
    organizationName:
      patch.organizationName !== undefined
        ? patch.organizationName.trim() || db.settings.organizationName
        : db.settings.organizationName,
    operatorName:
      patch.operatorName !== undefined
        ? patch.operatorName.trim() || 'Administrador'
        : db.settings.operatorName,
    role: patch.role ?? db.settings.role,
  }
  if (
    settings.organizationName === db.settings.organizationName &&
    settings.operatorName === db.settings.operatorName &&
    settings.role === db.settings.role
  ) {
    return ok(db)
  }
  const bits: string[] = []
  if (settings.organizationName !== db.settings.organizationName) bits.push('organização')
  if (settings.operatorName !== db.settings.operatorName) bits.push('operador')
  if (settings.role !== db.settings.role) {
    bits.push(settings.role === 'admin' ? 'modo administrador' : 'modo consulta')
  }
  const next = audit(
    { ...db, settings },
    {
      action: 'editar',
      entity: 'Configurações',
      entityId: 'settings',
      summary: `Alterou ${bits.join(', ')}.`,
    },
    operatorName(db),
  )
  return ok(next)
}

export function addSector(db: Database, name: string): Result {
  const denied = assertEdit(db)
  if (denied) return fail(denied)
  const trimmed = name.trim()
  if (!trimmed) return fail('Informe o nome do setor.')
  if (db.sectors.some((sector) => sameText(sector.name, trimmed))) {
    return fail('Já existe um setor com esse nome.')
  }
  const stamp = now()
  const sector = { id: uid(), name: trimmed, createdAt: stamp, updatedAt: stamp }
  const sectors = [...db.sectors, sector].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
  const next = audit(
    { ...db, sectors },
    { action: 'criar', entity: 'Setor', entityId: sector.id, summary: `Cadastrou o setor ${sector.name}.` },
  )
  return ok(next)
}

export function renameSector(db: Database, id: string, name: string): Result {
  const denied = assertEdit(db)
  if (denied) return fail(denied)
  const current = db.sectors.find((sector) => sector.id === id)
  if (!current) return fail('Setor não encontrado.')
  const trimmed = name.trim()
  if (!trimmed) return fail('Informe o nome do setor.')
  if (db.sectors.some((sector) => sector.id !== id && sameText(sector.name, trimmed))) {
    return fail('Já existe um setor com esse nome.')
  }
  if (current.name === trimmed) return ok(db)
  const sectors = db.sectors
    .map((sector) => (sector.id === id ? { ...sector, name: trimmed, updatedAt: now() } : sector))
    .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
  const next = audit(
    { ...db, sectors },
    { action: 'editar', entity: 'Setor', entityId: id, summary: `Renomeou o setor para ${trimmed}.` },
  )
  return ok(next)
}

export function removeSector(db: Database, id: string): Result {
  const denied = assertEdit(db)
  if (denied) return fail(denied)
  const current = db.sectors.find((sector) => sector.id === id)
  if (!current) return fail('Setor não encontrado.')
  const used = [
    ...db.assets,
    ...db.printers,
    ...db.disposals,
    ...db.extensions,
    ...db.computers,
  ].some((item) => item.sectorId === id)
  if (used) return fail('Este setor está em uso e não pode ser excluído.')
  const next = audit(
    { ...db, sectors: db.sectors.filter((sector) => sector.id !== id) },
    { action: 'excluir', entity: 'Setor', entityId: id, summary: `Excluiu o setor ${current.name}.` },
  )
  return ok(next)
}

export function saveAsset(db: Database, input: AssetInput): Result {
  const denied = assertEdit(db)
  if (denied) return fail(denied)
  const description = input.description.trim()
  const tombo = input.tombo.trim()
  const serial = input.serial.trim()
  if (!description) return fail('Informe a descrição.')
  if (!tombo) return fail('Informe o tombo.')
  if (!sectorExists(db, input.sectorId)) return fail('Setor não encontrado.')
  const existing = input.id ? db.assets.find((asset) => asset.id === input.id) : undefined
  if (input.id && !existing) return fail('Patrimônio não encontrado.')
  if (db.assets.some((asset) => sameText(asset.tombo, tombo) && asset.id !== existing?.id)) {
    return fail('Já existe um patrimônio com esse tombo.')
  }
  if (serial && db.assets.some((asset) => asset.serial && sameText(asset.serial, serial) && asset.id !== existing?.id)) {
    return fail('Já existe um patrimônio com esse número de série.')
  }
  const stamp = now()
  const fields = {
    description,
    brand: input.brand.trim(),
    model: input.model.trim(),
    serial,
    tombo,
    category: input.category,
    sectorId: input.sectorId,
    location: input.location.trim(),
    responsible: input.responsible.trim(),
    origin: input.origin.trim(),
    acquiredAt: input.acquiredAt,
    warrantyUntil: input.warrantyUntil,
    status: input.status,
  }
  if (existing) {
    const updated: Asset = { ...existing, ...fields, updatedAt: stamp }
    const labels = changedLabels(existing, updated, {
      description: 'descrição',
      brand: 'marca',
      model: 'modelo',
      serial: 'série',
      tombo: 'tombo',
      category: 'categoria',
      sectorId: 'setor',
      location: 'local',
      responsible: 'responsável',
      origin: 'origem',
      acquiredAt: 'aquisição',
      warrantyUntil: 'garantia',
      status: 'status',
    })
    const linked = db.computers.find((computer) => computer.assetId === existing.id)
    const computerChanged = Boolean(linked && (linked.status !== input.status || linked.sectorId !== input.sectorId))
    if (labels.length === 0 && !computerChanged) return ok(db)
    const computers = db.computers.map((computer) =>
      computer.assetId === existing.id
        ? { ...computer, status: input.status, sectorId: input.sectorId, updatedAt: stamp }
        : computer,
    )
    const next = audit(
      { ...db, assets: db.assets.map((asset) => (asset.id === existing.id ? updated : asset)), computers },
      {
        action: 'editar',
        entity: 'Patrimônio',
        entityId: existing.id,
        summary: labels.length
          ? `Alterou o patrimônio ${tombo}: ${labels.join(', ')}.`
          : `Atualizou o vínculo do patrimônio ${tombo}.`,
      },
    )
    return ok(next)
  }
  const created: Asset = {
    id: uid(),
    ...fields,
    lastCheckedAt: null,
    createdAt: stamp,
    updatedAt: stamp,
  }
  const next = audit(
    { ...db, assets: [...db.assets, created] },
    {
      action: 'criar',
      entity: 'Patrimônio',
      entityId: created.id,
      summary: `Cadastrou o patrimônio ${tombo} (${description}).`,
    },
  )
  return ok(next)
}

export function removeAsset(db: Database, id: string): Result {
  const denied = assertEdit(db)
  if (denied) return fail(denied)
  const asset = db.assets.find((item) => item.id === id)
  if (!asset) return fail('Patrimônio não encontrado.')
  if (db.computers.some((computer) => computer.assetId === id)) {
    return fail('Este patrimônio está vinculado a um computador. Exclua a ficha técnica antes, ou altere o status para baixado.')
  }
  if (db.extensions.some((extension) => extension.assetId === id)) {
    return fail('Este patrimônio está vinculado a um ramal.')
  }
  const next = audit(
    { ...db, assets: db.assets.filter((item) => item.id !== id) },
    {
      action: 'excluir',
      entity: 'Patrimônio',
      entityId: id,
      summary: `Excluiu o patrimônio ${asset.tombo} (${asset.description}).`,
    },
  )
  return ok(next)
}

export function checkAsset(db: Database, id: string): Result {
  const denied = assertEdit(db)
  if (denied) return fail(denied)
  const asset = db.assets.find((item) => item.id === id)
  if (!asset) return fail('Patrimônio não encontrado.')
  const stamp = now()
  const next = audit(
    {
      ...db,
      assets: db.assets.map((item) => (item.id === id ? { ...item, lastCheckedAt: stamp, updatedAt: stamp } : item)),
      computers: db.computers.map((computer) =>
        computer.assetId === id ? { ...computer, lastCheckedAt: stamp, updatedAt: stamp } : computer,
      ),
    },
    {
      action: 'conferencia',
      entity: 'Patrimônio',
      entityId: id,
      summary: `Conferiu o patrimônio ${asset.tombo}.`,
    },
  )
  return ok(next)
}

function printerFields(input: PrinterInput) {
  return {
    name: input.name.trim(),
    code: input.code.trim(),
    manufacturer: input.manufacturer.trim(),
    model: input.model.trim(),
    serial: input.serial.trim(),
    ip: input.ip.trim(),
    location: input.location.trim(),
    sectorId: input.sectorId,
    type: input.type,
  }
}

function blankToner(printerId: string, color: TonerColor, stamp: string): Toner {
  return {
    id: uid(),
    printerId,
    color,
    model: '',
    code: '',
    stock: 0,
    minimum: 1,
    createdAt: stamp,
    updatedAt: stamp,
  }
}

export function savePrinter(db: Database, input: PrinterInput): Result {
  const denied = assertEdit(db)
  if (denied) return fail(denied)
  const fields = printerFields(input)
  if (!fields.name) return fail('Informe o nome da impressora.')
  if (!fields.manufacturer) return fail('Informe o fabricante.')
  if (!fields.model) return fail('Informe o modelo.')
  if (!sectorExists(db, input.sectorId)) return fail('Setor não encontrado.')
  const existing = input.id ? db.printers.find((printer) => printer.id === input.id) : undefined
  if (input.id && !existing) return fail('Impressora não encontrada.')
  const stamp = now()
  if (!existing) {
    const printer: Printer = { id: uid(), ...fields, createdAt: stamp, updatedAt: stamp }
    const colors: TonerColor[] = fields.type === 'colorida' ? [...TONER_COLORS] : ['preto']
    const toners = [...db.toners, ...colors.map((color) => blankToner(printer.id, color, stamp))]
    const next = audit(
      { ...db, printers: [...db.printers, printer], toners },
      {
        action: 'criar',
        entity: 'Impressora',
        entityId: printer.id,
        summary: `Cadastrou a impressora ${printer.name}.`,
      },
    )
    return ok(next)
  }
  const updated: Printer = { ...existing, ...fields, updatedAt: stamp }
  const labels = changedLabels(existing, updated, {
    name: 'nome',
    code: 'código',
    manufacturer: 'fabricante',
    model: 'modelo',
    serial: 'série',
    ip: 'IP',
    location: 'local',
    sectorId: 'setor',
    type: 'tipo',
  })
  const missing = fields.type === 'colorida'
    ? TONER_COLORS.filter((color) => !db.toners.some((toner) => toner.printerId === existing.id && toner.color === color))
    : []
  if (labels.length === 0 && missing.length === 0) return ok(db)
  const toners = missing.length
    ? [...db.toners, ...missing.map((color) => blankToner(existing.id, color, stamp))]
    : db.toners
  const summary = [
    labels.length ? `Alterou a impressora ${updated.name}: ${labels.join(', ')}.` : `Alterou a impressora ${updated.name}.`,
    missing.length ? 'Incluiu os toners de cor que faltavam.' : '',
  ]
    .filter(Boolean)
    .join(' ')
  const next = audit(
    { ...db, printers: db.printers.map((printer) => (printer.id === existing.id ? updated : printer)), toners },
    { action: 'editar', entity: 'Impressora', entityId: existing.id, summary },
  )
  return ok(next)
}

export function removePrinter(db: Database, id: string): Result {
  const denied = assertEdit(db)
  if (denied) return fail(denied)
  const printer = db.printers.find((item) => item.id === id)
  if (!printer) return fail('Impressora não encontrada.')
  const next = audit(
    {
      ...db,
      printers: db.printers.filter((item) => item.id !== id),
      toners: db.toners.filter((toner) => toner.printerId !== id),
      parts: db.parts.filter((part) => part.printerId !== id),
    },
    {
      action: 'excluir',
      entity: 'Impressora',
      entityId: id,
      summary: `Excluiu a impressora ${printer.name}. Descartes e movimentações anteriores permanecem no histórico.`,
    },
  )
  return ok(next)
}

export function saveToner(db: Database, input: TonerInput): Result {
  const denied = assertEdit(db)
  if (denied) return fail(denied)
  const toner = db.toners.find((item) => item.id === input.id)
  if (!toner) return fail('Toner não encontrado.')
  if (!nonNegativeInt(input.minimum)) {
    return fail('O estoque mínimo precisa ser um número inteiro igual ou maior que zero.')
  }
  const updated: Toner = {
    ...toner,
    model: input.model.trim(),
    code: input.code.trim(),
    minimum: input.minimum,
    updatedAt: now(),
  }
  const labels = changedLabels(toner, updated, { model: 'modelo', code: 'código', minimum: 'mínimo' })
  if (labels.length === 0) return ok(db)
  const next = audit(
    { ...db, toners: db.toners.map((item) => (item.id === toner.id ? updated : item)) },
    {
      action: 'editar',
      entity: 'Toner',
      entityId: toner.id,
      summary: `Alterou o toner ${tonerColorLabel[toner.color]}: ${labels.join(', ')}.`,
    },
  )
  return ok(next)
}

export function savePart(db: Database, input: PartInput): Result {
  const denied = assertEdit(db)
  if (denied) return fail(denied)
  const name = input.name.trim()
  if (!name) return fail('Informe o nome do suprimento.')
  if (!nonNegativeInt(input.minimum)) {
    return fail('O estoque mínimo precisa ser um número inteiro igual ou maior que zero.')
  }
  if (!db.printers.some((printer) => printer.id === input.printerId)) return fail('Impressora não encontrada.')
  const existing = input.id ? db.parts.find((part) => part.id === input.id) : undefined
  if (input.id && !existing) return fail('Suprimento não encontrado.')
  const stamp = now()
  if (!existing) {
    const created: Part = {
      id: uid(),
      printerId: input.printerId,
      name,
      stock: 0,
      minimum: input.minimum,
      notes: input.notes.trim(),
      createdAt: stamp,
      updatedAt: stamp,
    }
    const next = audit(
      { ...db, parts: [...db.parts, created] },
      { action: 'criar', entity: 'Peça', entityId: created.id, summary: `Cadastrou o suprimento ${name}.` },
    )
    return ok(next)
  }
  const updated: Part = { ...existing, name, minimum: input.minimum, notes: input.notes.trim(), updatedAt: stamp }
  const labels = changedLabels(existing, updated, { name: 'nome', minimum: 'mínimo', notes: 'observação' })
  if (labels.length === 0) return ok(db)
  const next = audit(
    { ...db, parts: db.parts.map((part) => (part.id === existing.id ? updated : part)) },
    { action: 'editar', entity: 'Peça', entityId: existing.id, summary: `Alterou o suprimento ${name}: ${labels.join(', ')}.` },
  )
  return ok(next)
}

export function removePart(db: Database, id: string): Result {
  const denied = assertEdit(db)
  if (denied) return fail(denied)
  const part = db.parts.find((item) => item.id === id)
  if (!part) return fail('Suprimento não encontrado.')
  const next = audit(
    { ...db, parts: db.parts.filter((item) => item.id !== id) },
    {
      action: 'excluir',
      entity: 'Peça',
      entityId: id,
      summary: `Excluiu o suprimento ${part.name}. O histórico de movimentação foi mantido.`,
    },
  )
  return ok(next)
}

export function moveSupply(db: Database, input: MoveInput): Result {
  const denied = assertEdit(db)
  if (denied) return fail(denied)
  if (!positiveInt(input.quantity)) return fail('Informe uma quantidade inteira maior que zero.')
  const stamp = now()
  const user = input.user.trim() || operatorName(db)
  if (input.supplyKind === 'toner') {
    const toner = db.toners.find((item) => item.id === input.supplyId)
    if (!toner) return fail('Toner não encontrado.')
    const nextStock = input.type === 'entrada' ? toner.stock + input.quantity : toner.stock - input.quantity
    if (nextStock < 0) return fail('A saída é maior que o estoque atual.')
    const supplyName = `Toner ${tonerColorLabel[toner.color]}`
    const movement: SupplyMovement = {
      id: uid(),
      printerId: toner.printerId,
      supplyKind: 'toner',
      supplyId: toner.id,
      supplyName,
      type: input.type,
      quantity: input.quantity,
      user,
      notes: input.notes.trim(),
      createdAt: stamp,
    }
    const next = audit(
      {
        ...db,
        toners: db.toners.map((item) => (item.id === toner.id ? { ...item, stock: nextStock, updatedAt: stamp } : item)),
        movements: [movement, ...db.movements],
      },
      {
        action: input.type,
        entity: 'Suprimento',
        entityId: movement.id,
        summary: `${input.type === 'entrada' ? 'Entrada' : 'Saída'} de ${input.quantity} un. de ${supplyName}.`,
      },
    )
    return ok(next)
  }
  const part = db.parts.find((item) => item.id === input.supplyId)
  if (!part) return fail('Suprimento não encontrado.')
  const nextStock = input.type === 'entrada' ? part.stock + input.quantity : part.stock - input.quantity
  if (nextStock < 0) return fail('A saída é maior que o estoque atual.')
  const movement: SupplyMovement = {
    id: uid(),
    printerId: part.printerId,
    supplyKind: 'peca',
    supplyId: part.id,
    supplyName: part.name,
    type: input.type,
    quantity: input.quantity,
    user,
    notes: input.notes.trim(),
    createdAt: stamp,
  }
  const next = audit(
    {
      ...db,
      parts: db.parts.map((item) => (item.id === part.id ? { ...item, stock: nextStock, updatedAt: stamp } : item)),
      movements: [movement, ...db.movements],
    },
    {
      action: input.type,
      entity: 'Suprimento',
      entityId: movement.id,
      summary: `${input.type === 'entrada' ? 'Entrada' : 'Saída'} de ${input.quantity} un. de ${part.name}.`,
    },
  )
  return ok(next)
}

export function saveDisposal(db: Database, input: DisposalInput): Result {
  const denied = assertEdit(db)
  if (denied) return fail(denied)
  const supplyType = input.supplyType.trim()
  const responsible = input.responsible.trim()
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.date)) return fail('Informe a data do descarte.')
  if (!supplyType) return fail('Informe o tipo de insumo.')
  if (!positiveInt(input.quantity)) return fail('Informe uma quantidade inteira maior que zero.')
  if (!responsible) return fail('Informe o responsável.')
  if (!sectorExists(db, input.sectorId)) return fail('Setor não encontrado.')
  const printer = db.printers.find((item) => item.id === input.printerId)
  if (!printer) return fail('Selecione uma impressora.')
  const existing = input.id ? db.disposals.find((item) => item.id === input.id) : undefined
  if (input.id && !existing) return fail('Descarte não encontrado.')
  let working = db
  if (!existing && input.deductStock && input.supplyId && input.supplyKind) {
    const moved = moveSupply(working, {
      supplyKind: input.supplyKind,
      supplyId: input.supplyId,
      type: 'saida',
      quantity: input.quantity,
      user: responsible,
      notes: input.notes.trim() || `Descarte: ${supplyType}`,
    })
    if (!moved.ok) return moved
    working = moved.db
  }
  const stamp = now()
  const snapshot = {
    date: input.date,
    sectorId: input.sectorId,
    printerId: printer.id,
    printerName: printer.name,
    printerModel: printer.model,
    manufacturer: printer.manufacturer,
    supplyType,
    quantity: input.quantity,
    reason: input.reason,
    responsible,
    notes: input.notes.trim(),
  }
  if (!existing) {
    const created: Disposal = { id: uid(), ...snapshot, createdAt: stamp, updatedAt: stamp }
    const next = audit(
      { ...working, disposals: [created, ...working.disposals] },
      {
        action: 'descarte',
        entity: 'Descarte',
        entityId: created.id,
        summary: `Registrou descarte de ${input.quantity} un. de ${supplyType} (${printer.name}).`,
      },
    )
    return ok(next)
  }
  const updated: Disposal = { ...existing, ...snapshot, updatedAt: stamp }
  const labels = changedLabels(existing, updated, {
    date: 'data',
    sectorId: 'setor',
    printerName: 'impressora',
    supplyType: 'insumo',
    quantity: 'quantidade',
    reason: 'motivo',
    responsible: 'responsável',
    notes: 'observação',
  })
  if (labels.length === 0) return ok(db)
  const next = audit(
    { ...db, disposals: db.disposals.map((item) => (item.id === existing.id ? updated : item)) },
    {
      action: 'editar',
      entity: 'Descarte',
      entityId: existing.id,
      summary: `Alterou o descarte de ${supplyType}: ${labels.join(', ')}.`,
    },
  )
  return ok(next)
}

export function removeDisposal(db: Database, id: string): Result {
  const denied = assertEdit(db)
  if (denied) return fail(denied)
  const disposal = db.disposals.find((item) => item.id === id)
  if (!disposal) return fail('Descarte não encontrado.')
  const next = audit(
    { ...db, disposals: db.disposals.filter((item) => item.id !== id) },
    {
      action: 'excluir',
      entity: 'Descarte',
      entityId: id,
      summary: `Excluiu o descarte de ${disposal.supplyType} (${disposal.printerName}). O estoque não foi estornado.`,
    },
  )
  return ok(next)
}

export function saveExtension(db: Database, input: ExtensionInput): Result {
  const denied = assertEdit(db)
  if (denied) return fail(denied)
  const number = input.number.trim()
  if (!number) return fail('Informe o número do ramal.')
  if (!sectorExists(db, input.sectorId)) return fail('Setor não encontrado.')
  if (input.assetId && !db.assets.some((asset) => asset.id === input.assetId)) {
    return fail('Patrimônio não encontrado.')
  }
  const existing = input.id ? db.extensions.find((item) => item.id === input.id) : undefined
  if (input.id && !existing) return fail('Ramal não encontrado.')
  if (db.extensions.some((item) => sameText(item.number, number) && item.id !== existing?.id)) {
    return fail('Já existe um ramal com esse número.')
  }
  const stamp = now()
  const fields = {
    number,
    externalLine: input.externalLine.trim(),
    assetId: input.assetId,
    ip: input.ip.trim(),
    model: input.model.trim(),
    sectorId: input.sectorId,
    nameLocation: input.nameLocation.trim(),
    active: input.active,
  }
  if (!existing) {
    const created: Extension = { id: uid(), ...fields, createdAt: stamp, updatedAt: stamp }
    const next = audit(
      { ...db, extensions: [...db.extensions, created] },
      { action: 'criar', entity: 'Ramal', entityId: created.id, summary: `Cadastrou o ramal ${number}.` },
    )
    return ok(next)
  }
  const updated: Extension = { ...existing, ...fields, updatedAt: stamp }
  const labels = changedLabels(existing, updated, {
    number: 'número',
    externalLine: 'linha externa',
    assetId: 'patrimônio',
    ip: 'IP',
    model: 'modelo',
    sectorId: 'setor',
    nameLocation: 'nome/local',
    active: 'situação',
  })
  if (labels.length === 0) return ok(db)
  const next = audit(
    { ...db, extensions: db.extensions.map((item) => (item.id === existing.id ? updated : item)) },
    { action: 'editar', entity: 'Ramal', entityId: existing.id, summary: `Alterou o ramal ${number}: ${labels.join(', ')}.` },
  )
  return ok(next)
}

export function removeExtension(db: Database, id: string): Result {
  const denied = assertEdit(db)
  if (denied) return fail(denied)
  const extension = db.extensions.find((item) => item.id === id)
  if (!extension) return fail('Ramal não encontrado.')
  const next = audit(
    { ...db, extensions: db.extensions.filter((item) => item.id !== id) },
    { action: 'excluir', entity: 'Ramal', entityId: id, summary: `Excluiu o ramal ${extension.number}.` },
  )
  return ok(next)
}

export function saveComputer(db: Database, input: ComputerInput): Result {
  const denied = assertEdit(db)
  if (denied) return fail(denied)
  const hostname = input.hostname.trim()
  const tombo = input.tombo.trim()
  const serial = input.serial.trim()
  const description = input.description.trim() || hostname
  if (!hostname) return fail('Informe o hostname.')
  if (!tombo) return fail('Informe o tombo do patrimônio.')
  if (!sectorExists(db, input.sectorId)) return fail('Setor não encontrado.')
  const existing = input.id ? db.computers.find((computer) => computer.id === input.id) : undefined
  if (input.id && !existing) return fail('Computador não encontrado.')
  if (db.computers.some((computer) => sameText(computer.hostname, hostname) && computer.id !== existing?.id)) {
    return fail('Já existe um computador com esse hostname.')
  }

  let asset = existing ? db.assets.find((item) => item.id === existing.assetId) : undefined
  if (!existing && input.assetId) {
    asset = db.assets.find((item) => item.id === input.assetId)
    if (!asset) return fail('Patrimônio não encontrado.')
    if (db.computers.some((computer) => computer.assetId === asset!.id)) {
      return fail('Esse patrimônio já possui uma ficha de computador.')
    }
  }
  if (db.assets.some((item) => sameText(item.tombo, tombo) && item.id !== asset?.id)) {
    return fail('Já existe um patrimônio com esse tombo.')
  }
  if (serial && db.assets.some((item) => item.serial && sameText(item.serial, serial) && item.id !== asset?.id)) {
    return fail('Já existe um patrimônio com esse número de série.')
  }

  const stamp = now()
  const assetFields = {
    description,
    brand: input.brand.trim(),
    model: input.model.trim(),
    serial,
    tombo,
    category: asset?.category ?? 'computador' as const,
    sectorId: input.sectorId,
    location: input.location.trim(),
    responsible: input.responsible.trim(),
    origin: input.origin.trim(),
    acquiredAt: input.acquiredAt,
    warrantyUntil: input.warrantyUntil,
    status: input.status,
  }
  let assets = db.assets
  let assetId = asset?.id
  if (!asset) {
    assetId = uid()
    const created: Asset = { id: assetId, ...assetFields, lastCheckedAt: null, createdAt: stamp, updatedAt: stamp }
    assets = [...assets, created]
  } else {
    assets = assets.map((item) => (item.id === asset!.id ? { ...item, ...assetFields, updatedAt: stamp } : item))
    assetId = asset.id
  }

  const computerFields = {
    assetId: assetId!,
    hostname,
    userName: input.userName.trim(),
    sectorId: input.sectorId,
    ip: input.ip.trim(),
    os: input.os.trim(),
    status: input.status,
  }
  if (!existing) {
    const created: Computer = { id: uid(), ...computerFields, lastCheckedAt: null, createdAt: stamp, updatedAt: stamp }
    const next = audit(
      { ...db, assets, computers: [...db.computers, created] },
      {
        action: 'criar',
        entity: 'Computador',
        entityId: created.id,
        summary: `Cadastrou o computador ${hostname} (patrimônio ${tombo}).`,
      },
    )
    return ok(next)
  }
  const updated: Computer = { ...existing, ...computerFields, updatedAt: stamp }
  const previousAsset = db.assets.find((item) => item.id === existing.assetId)
  const computerLabels = changedLabels(existing, updated, {
    hostname: 'hostname',
    userName: 'usuário',
    sectorId: 'setor',
    ip: 'IP',
    os: 'sistema',
    status: 'status',
  })
  const assetChanged = previousAsset
    ? changedLabels(previousAsset, { ...previousAsset, ...assetFields, updatedAt: previousAsset.updatedAt }, {
        description: 'descrição',
        brand: 'marca',
        model: 'modelo',
        serial: 'série',
        tombo: 'tombo',
        sectorId: 'setor',
        location: 'local',
        responsible: 'responsável',
        origin: 'origem',
        acquiredAt: 'aquisição',
        warrantyUntil: 'garantia',
        status: 'status',
      })
    : ['patrimônio']
  const labels = [...new Set([...computerLabels, ...assetChanged])]
  if (labels.length === 0) return ok(db)
  const next = audit(
    { ...db, assets, computers: db.computers.map((computer) => (computer.id === existing.id ? updated : computer)) },
    {
      action: 'editar',
      entity: 'Computador',
      entityId: existing.id,
      summary: `Alterou o computador ${hostname}: ${labels.join(', ')}.`,
    },
  )
  return ok(next)
}

export function removeComputer(db: Database, id: string): Result {
  const denied = assertEdit(db)
  if (denied) return fail(denied)
  const computer = db.computers.find((item) => item.id === id)
  if (!computer) return fail('Computador não encontrado.')
  const asset = db.assets.find((item) => item.id === computer.assetId)
  const next = audit(
    { ...db, computers: db.computers.filter((item) => item.id !== id) },
    {
      action: 'excluir',
      entity: 'Computador',
      entityId: id,
      summary: `Excluiu a ficha do computador ${computer.hostname}. O patrimônio ${asset?.tombo ?? 'vinculado'} permanece.`,
    },
  )
  return ok(next)
}

export function checkComputer(db: Database, id: string): Result {
  const denied = assertEdit(db)
  if (denied) return fail(denied)
  const computer = db.computers.find((item) => item.id === id)
  if (!computer) return fail('Computador não encontrado.')
  const stamp = now()
  const next = audit(
    {
      ...db,
      computers: db.computers.map((item) => (item.id === id ? { ...item, lastCheckedAt: stamp, updatedAt: stamp } : item)),
      assets: db.assets.map((asset) =>
        asset.id === computer.assetId ? { ...asset, lastCheckedAt: stamp, updatedAt: stamp } : asset,
      ),
    },
    {
      action: 'conferencia',
      entity: 'Computador',
      entityId: id,
      summary: `Conferiu o computador ${computer.hostname}.`,
    },
  )
  return ok(next)
}

export function importBackup(current: Database, json: string): Result {
  const denied = assertEdit(current)
  if (denied) return fail(denied)
  let parsed: unknown
  try {
    parsed = JSON.parse(json)
  } catch {
    return fail('O arquivo não está em JSON válido.')
  }
  const restored = normalizeDatabase(parsed)
  if (!restored) return fail('O arquivo não é um backup deste sistema.')
  const next = audit(
    restored,
    { action: 'backup', entity: 'Backup', entityId: 'import', summary: 'Importou um arquivo de backup.' },
    operatorName(current),
  )
  return ok(next)
}
