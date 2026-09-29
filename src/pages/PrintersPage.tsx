import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Plus, Printer } from 'lucide-react'
import { useStore } from '../data/store'
import { printerTypeLabel, tonerColorLabel, tonerDotClass, TONER_COLORS } from '../domain/labels'
import { sectorName } from '../domain/lookups'
import { needsSupply, stockLabel, stockLevel } from '../domain/stock'
import { matchesQuery } from '../lib/format'
import type { Report } from '../lib/report'
import { ExportBar } from '../components/ExportBar'
import { PrinterForm } from '../components/PrinterForm'
import { Badge, Button, Card, EmptyState, SearchInput } from '../components/ui'

export function PrintersPage() {
  const { db, canEdit } = useStore()
  const [params] = useSearchParams()
  const [query, setQuery] = useState('')
  const [creating, setCreating] = useState(false)
  const onlyLow = params.get('filtro') === 'baixo'

  const cards = useMemo(() => {
    return db.printers.filter((printer) => {
      const toners = db.toners.filter((toner) => toner.printerId === printer.id)
      const parts = db.parts.filter((part) => part.printerId === printer.id)
      const low = needsSupply([...toners, ...parts])
      if (onlyLow && !low) return false
      return matchesQuery(query, [printer.name, printer.code, printer.manufacturer, printer.model, printer.ip, printer.location, printer.serial])
    })
  }, [db, query, onlyLow])

  const report: Report = {
    title: 'Impressoras',
    filename: 'impressoras',
    subtitle: onlyLow ? 'Somente estoque baixo' : query ? `Busca: ${query}` : undefined,
    sections: [{
      title: 'Impressoras',
      headers: ['Nome', 'Código', 'Fabricante', 'Modelo', 'Série', 'IP', 'Local', 'Setor', 'Tipo', 'Status'],
      rows: cards.map((printer) => {
        const supplies = [
          ...db.toners.filter((toner) => toner.printerId === printer.id),
          ...db.parts.filter((part) => part.printerId === printer.id),
        ]
        return [
          printer.name,
          printer.code,
          printer.manufacturer,
          printer.model,
          printer.serial,
          printer.ip,
          printer.location,
          sectorName(db.sectors, printer.sectorId),
          printerTypeLabel[printer.type],
          needsSupply(supplies) ? 'Estoque baixo' : 'Normal',
        ]
      }),
    }],
  }

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-3">
          <SearchInput value={query} onChange={setQuery} placeholder="Buscar impressora, modelo, código, setor..." />
          <div className="ml-auto flex flex-wrap gap-2">
            <ExportBar report={report} />
            {canEdit && (
              <Button onClick={() => setCreating(true)}>
                <Plus className="h-4 w-4" />
                Nova impressora
              </Button>
            )}
          </div>
        </div>
        <p className="mt-3 text-sm text-slate-500">{cards.length} impressora(s){onlyLow ? ' com estoque baixo' : ''}</p>
      </Card>
      {cards.length === 0 ? (
        <Card>
          <EmptyState icon={Printer} title="Nenhuma impressora" text="Cadastre a primeira impressora para controlar toner e peças." />
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {cards.map((printer) => {
            const toners = db.toners.filter((toner) => toner.printerId === printer.id).sort((a, b) => tonerOrder(a.color) - tonerOrder(b.color))
            const parts = db.parts.filter((part) => part.printerId === printer.id)
            const lowParts = parts.filter((part) => stockLevel(part.stock, part.minimum) !== 'normal')
            const low = needsSupply([...toners, ...parts])
            return (
              <Link key={printer.id} to={`/impressoras/${printer.id}`} className="flex flex-col rounded-xl border border-line bg-surface p-4 shadow-sm transition hover:border-accent">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="font-semibold">{printer.name}</h2>
                    <p className="text-sm text-muted">{printer.manufacturer} · {printer.model}</p>
                    <p className="text-sm text-faint">{printer.location || sectorName(db.sectors, printer.sectorId)}</p>
                  </div>
                  <Badge tone={low ? 'amber' : 'green'}>{low ? 'Estoque baixo' : 'Normal'}</Badge>
                </div>
                <ul className="mt-4 grid grid-cols-2 gap-2">
                  {(printer.type === 'colorida' ? TONER_COLORS : TONER_COLORS.filter((color) => color === 'preto')).map((color) => {
                    const toner = toners.find((item) => item.color === color)
                    const level = toner ? stockLevel(toner.stock, toner.minimum) : 'sem'
                    return (
                      <li key={color} className="flex items-center gap-2 rounded-lg bg-surface-2 px-2 py-1.5 text-sm">
                        <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${tonerDotClass[color]}`} />
                        <span className="text-muted">{tonerColorLabel[color]}</span>
                        <span className={`ml-auto font-semibold ${level === 'normal' ? '' : 'text-amber-700 dark:text-amber-300'}`}>
                          {toner ? toner.stock : '—'}
                        </span>
                      </li>
                    )
                  })}
                </ul>
                {lowParts.length > 0 && (
                  <p className="mt-3 text-xs text-amber-700 dark:text-amber-300">
                    Peças: {lowParts.map((part) => `${part.name} (${stockLabel(stockLevel(part.stock, part.minimum)).toLowerCase()})`).join(', ')}
                  </p>
                )}
              </Link>
            )
          })}
        </div>
      )}
      {creating && <PrinterForm printer={null} onClose={() => setCreating(false)} />}
    </div>
  )
}

function tonerOrder(color: string): number {
  return ['preto', 'ciano', 'magenta', 'amarelo'].indexOf(color)
}
