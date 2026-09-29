import type {
  AssetCategory,
  AssetStatus,
  AuditAction,
  DisposalReason,
  MovementType,
  PrinterType,
  TonerColor,
} from './types'

export const TONER_COLORS: TonerColor[] = ['preto', 'ciano', 'magenta', 'amarelo']

export const tonerColorLabel: Record<TonerColor, string> = {
  preto: 'Preto',
  ciano: 'Ciano',
  magenta: 'Magenta',
  amarelo: 'Amarelo',
}

export const tonerDotClass: Record<TonerColor, string> = {
  preto: 'bg-neutral-950 ring-1 ring-black/20 dark:ring-white/50',
  ciano: 'bg-cyan-400',
  magenta: 'bg-fuchsia-500',
  amarelo: 'bg-yellow-400',
}

export const categoryLabel: Record<AssetCategory, string> = {
  rede: 'Rede',
  rack: 'Rack',
  energia: 'Energia',
  nobreak: 'Nobreak',
  firewall: 'Firewall',
  computador: 'Computador',
  outro: 'Outro',
}

export const statusLabel: Record<AssetStatus, string> = {
  ativo: 'Ativo',
  manutencao: 'Manutenção',
  baixado: 'Baixado',
}

export const reasonLabel: Record<DisposalReason, string> = {
  insumo_esgotado: 'Insumo esgotado',
  danificado: 'Danificado',
  outro: 'Outro',
}

export const actionLabel: Record<AuditAction, string> = {
  criar: 'Inclusão',
  editar: 'Edição',
  excluir: 'Exclusão',
  entrada: 'Entrada',
  saida: 'Saída',
  descarte: 'Descarte',
  conferencia: 'Conferência',
  backup: 'Backup',
}

export const printerTypeLabel: Record<PrinterType, string> = {
  colorida: 'Colorida',
  monocromatica: 'Monocromática',
}

export const movementLabel: Record<MovementType, string> = {
  entrada: 'Entrada',
  saida: 'Saída',
}

export const CATEGORIES = Object.keys(categoryLabel) as AssetCategory[]
export const STATUSES = Object.keys(statusLabel) as AssetStatus[]
export const REASONS = Object.keys(reasonLabel) as DisposalReason[]
export const ACTIONS = Object.keys(actionLabel) as AuditAction[]
