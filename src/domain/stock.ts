export type StockLevel = 'normal' | 'baixo' | 'sem'

export function stockLevel(stock: number, minimum: number): StockLevel {
  if (stock <= 0) return 'sem'
  if (stock <= minimum) return 'baixo'
  return 'normal'
}

export function stockLabel(level: StockLevel): string {
  if (level === 'sem') return 'Sem estoque'
  if (level === 'baixo') return 'Estoque baixo'
  return 'Normal'
}

export function needsSupply(items: { stock: number; minimum: number }[]): boolean {
  return items.some((item) => stockLevel(item.stock, item.minimum) !== 'normal')
}
