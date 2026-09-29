import type { Asset, Sector } from './types'

export function sectorName(sectors: Sector[], id: string): string {
  if (!id) return '—'
  return sectors.find((sector) => sector.id === id)?.name ?? '—'
}

export function assetGaps(asset: Asset): string[] {
  const gaps: string[] = []
  if (!asset.tombo.trim()) gaps.push('tombo')
  if (!asset.serial.trim()) gaps.push('série')
  if (!asset.responsible.trim()) gaps.push('responsável')
  return gaps
}
