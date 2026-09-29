import { Link } from 'react-router-dom'
import { useStore } from '../data/store'
import { assetGaps, sectorName } from '../domain/lookups'
import { reasonLabel, tonerColorLabel } from '../domain/labels'
import { stockLabel, stockLevel } from '../domain/stock'
import { formatDate, todayInput } from '../lib/format'
import { Badge, Card } from '../components/ui'

export function DashboardPage() {
  const { db } = useStore()
  const month = todayInput().slice(0, 7)
  const lowSupplies = [
    ...db.toners.filter((toner) => stockLevel(toner.stock, toner.minimum) !== 'normal').map((toner) => ({
      id: toner.id,
      printerId: toner.printerId,
      name: tonerColorLabel[toner.color],
      kind: 'Toner',
      stock: toner.stock,
      minimum: toner.minimum,
    })),
    ...db.parts.filter((part) => stockLevel(part.stock, part.minimum) !== 'normal').map((part) => ({
      id: part.id,
      printerId: part.printerId,
      name: part.name,
      kind: 'Peça',
      stock: part.stock,
      minimum: part.minimum,
    })),
  ]
  const gaps = db.assets.flatMap((asset) => {
    const missing = assetGaps(asset)
    return missing.length ? [{ asset, missing }] : []
  })
  const recent = [...db.disposals].sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt)).slice(0, 6)
  const activeAssets = db.assets.filter((asset) => asset.status !== 'baixado').length
  const activeComputers = db.computers.filter((computer) => computer.status !== 'baixado').length
  const activeExtensions = db.extensions.filter((extension) => extension.active).length
  const monthDisposals = db.disposals.filter((disposal) => disposal.date.startsWith(month)).length

  const attention = [
    { label: 'Estoque baixo', value: lowSupplies.length, hint: 'suprimentos', to: '/impressoras?filtro=baixo' },
    { label: 'Pendências', value: gaps.length, hint: 'cadastros incompletos', to: '/patrimonios?filtro=pendencias' },
    { label: 'Descartes no mês', value: monthDisposals, hint: 'registros', to: '/descartes' },
  ]
  const registry = [
    { label: 'Impressoras', value: db.printers.length, hint: 'cadastradas', to: '/impressoras' },
    { label: 'Patrimônios', value: activeAssets, hint: `${db.assets.length} no cadastro`, to: '/patrimonios' },
    { label: 'Ramais', value: activeExtensions, hint: `de ${db.extensions.length}`, to: '/ramais' },
    { label: 'Computadores', value: activeComputers, hint: `${db.computers.length} no cadastro`, to: '/computadores' },
  ]

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">Pede ação</h2>
          <p className="mt-1 text-sm text-faint">O que está em falta, incompleto ou foi descartado neste mês.</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          {attention.map((item) => (
            <Link key={item.label} to={item.to} className="rounded-xl border border-line bg-surface px-4 py-3 transition hover:border-accent">
              <p className="text-sm text-muted">{item.label}</p>
              <p className={`mt-1 text-3xl font-semibold ${item.value > 0 ? 'text-accent' : 'text-ink'}`}>{item.value}</p>
              <p className="text-xs text-faint">{item.hint}</p>
            </Link>
          ))}
        </div>
        <div className="grid gap-4 xl:grid-cols-2">
          <Card>
            <div className="flex items-center justify-between border-b border-line px-5 py-4">
              <h2 className="font-semibold">Suprimentos com estoque baixo</h2>
              <Link to="/impressoras?filtro=baixo" className="text-sm font-medium text-accent">Ver todos</Link>
            </div>
            {lowSupplies.length === 0 ? (
              <p className="px-5 py-8 text-sm text-muted">Nenhum suprimento abaixo do mínimo.</p>
            ) : (
              <ul className="divide-y divide-line">
                {lowSupplies.slice(0, 6).map((item) => {
                  const printer = db.printers.find((entry) => entry.id === item.printerId)
                  const level = stockLevel(item.stock, item.minimum)
                  return (
                    <li key={item.id} className="flex items-center justify-between gap-3 px-5 py-3 text-sm">
                      <div>
                        <p className="font-medium">{item.kind === 'Toner' ? `Toner ${item.name}` : item.name}</p>
                        <p className="text-muted">{printer?.name ?? 'Impressora removida'}</p>
                      </div>
                      <div className="text-right">
                        <Badge tone={level === 'sem' ? 'red' : 'amber'}>{stockLabel(level)}</Badge>
                        <p className="mt-1 text-xs text-faint">{item.stock} / mín. {item.minimum}</p>
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </Card>
          <Card>
            <div className="flex items-center justify-between border-b border-line px-5 py-4">
              <h2 className="font-semibold">Pendências de cadastro</h2>
              <Link to="/patrimonios?filtro=pendencias" className="text-sm font-medium text-accent">Ver patrimônios</Link>
            </div>
            {gaps.length === 0 ? (
              <p className="px-5 py-8 text-sm text-muted">Nenhum patrimônio sem tombo, série ou responsável.</p>
            ) : (
              <ul className="divide-y divide-line">
                {gaps.slice(0, 6).map(({ asset, missing }) => (
                  <li key={asset.id} className="flex items-center justify-between gap-3 px-5 py-3 text-sm">
                    <div>
                      <p className="font-medium">{asset.description}</p>
                      <p className="text-muted">{asset.tombo || 'Sem tombo'} · {sectorName(db.sectors, asset.sectorId)}</p>
                    </div>
                    <Badge tone="amber">{missing.join(', ')}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
        <Card>
          <div className="flex items-center justify-between border-b border-line px-5 py-4">
            <h2 className="font-semibold">Últimos descartes</h2>
            <Link to="/descartes" className="text-sm font-medium text-accent">Ver todos</Link>
          </div>
          {recent.length === 0 ? (
            <p className="px-5 py-8 text-sm text-muted">Nenhum descarte registrado.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead className="text-xs uppercase tracking-wide text-faint">
                  <tr>
                    {['Data', 'Setor', 'Impressora', 'Insumo', 'Qtd', 'Motivo', 'Responsável'].map((header) => (
                      <th key={header} className="px-5 py-3 font-medium">{header}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {recent.map((disposal) => (
                    <tr key={disposal.id}>
                      <td className="px-5 py-3">{formatDate(disposal.date)}</td>
                      <td className="px-5 py-3">{sectorName(db.sectors, disposal.sectorId)}</td>
                      <td className="px-5 py-3">{disposal.printerName}</td>
                      <td className="px-5 py-3">{disposal.supplyType}</td>
                      <td className="px-5 py-3">{disposal.quantity}</td>
                      <td className="px-5 py-3">{reasonLabel[disposal.reason]}</td>
                      <td className="px-5 py-3">{disposal.responsible}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </section>
      <section className="space-y-3">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">Cadastro</h2>
          <p className="mt-1 text-sm text-faint">Totais do que já está registrado.</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {registry.map((item) => (
            <Link key={item.label} to={item.to} className="rounded-xl border border-line bg-surface px-4 py-3 transition hover:border-accent">
              <p className="text-2xl font-semibold">{item.value}</p>
              <p className="text-sm font-medium">{item.label}</p>
              <p className="text-xs text-faint">{item.hint}</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}
