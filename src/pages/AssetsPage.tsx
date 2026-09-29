import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Check, Package, Pencil, Plus, Trash2 } from 'lucide-react'
import { useStore } from '../data/store'
import { CATEGORIES, categoryLabel, STATUSES, statusLabel } from '../domain/labels'
import { assetGaps, sectorName } from '../domain/lookups'
import type { Asset, AssetCategory, AssetStatus } from '../domain/types'
import { formatDate, matchesQuery } from '../lib/format'
import type { Report } from '../lib/report'
import { ExportBar } from '../components/ExportBar'
import { SectorSelect } from '../components/SectorSelect'
import { Badge, Button, Card, ConfirmDialog, EmptyState, Field, FormError, IconButton, inputClass, Modal, SearchInput } from '../components/ui'

export function AssetsPage() {
  const { db, repo, canEdit } = useStore()
  const [params] = useSearchParams()
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<AssetCategory | ''>('')
  const [status, setStatus] = useState<AssetStatus | ''>('')
  const [checkFilter, setCheckFilter] = useState('')
  const [gapsOnly, setGapsOnly] = useState(params.get('filtro') === 'pendencias')
  const [editing, setEditing] = useState<Asset | 'new' | null>(null)
  const [removing, setRemoving] = useState<Asset | null>(null)

  const rows = useMemo(() => {
    return db.assets.filter((asset) => {
      if (category && asset.category !== category) return false
      if (status && asset.status !== status) return false
      if (checkFilter === 'sim' && !asset.lastCheckedAt) return false
      if (checkFilter === 'nao' && asset.lastCheckedAt) return false
      if (gapsOnly && assetGaps(asset).length === 0) return false
      return matchesQuery(query, [asset.description, asset.brand, asset.model, asset.serial, asset.tombo, asset.responsible, asset.location])
    })
  }, [db.assets, category, status, checkFilter, gapsOnly, query])

  const report: Report = {
    title: 'Patrimônios de TI',
    filename: 'patrimonios',
    subtitle: gapsOnly ? 'Somente pendências de cadastro' : undefined,
    sections: [{
      title: 'Patrimônios',
      headers: ['Descrição', 'Marca', 'Modelo', 'Série', 'Tombo', 'Categoria', 'Setor', 'Local', 'Responsável', 'Origem', 'Aquisição', 'Garantia', 'Status', 'Conferência'],
      rows: rows.map((asset) => [
        asset.description,
        asset.brand,
        asset.model,
        asset.serial,
        asset.tombo,
        categoryLabel[asset.category],
        sectorName(db.sectors, asset.sectorId),
        asset.location,
        asset.responsible,
        asset.origin,
        formatDate(asset.acquiredAt),
        formatDate(asset.warrantyUntil),
        statusLabel[asset.status],
        asset.lastCheckedAt ? formatDate(asset.lastCheckedAt) : 'Não conferido',
      ]),
    }],
  }

  return (
    <div className="space-y-4">
      <Card className="space-y-3 p-4">
        <div className="flex flex-wrap items-center gap-3">
          <SearchInput value={query} onChange={setQuery} placeholder="Pesquisar por descrição, marca ou tombo" />
          <div className="ml-auto flex flex-wrap gap-2">
            <ExportBar report={report} />
            {canEdit && <Button onClick={() => setEditing('new')}><Plus className="h-4 w-4" />Novo patrimônio</Button>}
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-4">
          <select className={inputClass} value={category} onChange={(event) => setCategory(event.target.value as AssetCategory | '')}>
            <option value="">Todas as categorias</option>
            {CATEGORIES.map((item) => <option key={item} value={item}>{categoryLabel[item]}</option>)}
          </select>
          <select className={inputClass} value={status} onChange={(event) => setStatus(event.target.value as AssetStatus | '')}>
            <option value="">Todos os status</option>
            {STATUSES.map((item) => <option key={item} value={item}>{statusLabel[item]}</option>)}
          </select>
          <select className={inputClass} value={checkFilter} onChange={(event) => setCheckFilter(event.target.value)}>
            <option value="">Conferência: todas</option>
            <option value="sim">Conferidos</option>
            <option value="nao">Sem conferência</option>
          </select>
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input type="checkbox" checked={gapsOnly} onChange={(event) => setGapsOnly(event.target.checked)} />
            Só pendências
          </label>
        </div>
        <p className="text-sm text-slate-500">{rows.length} patrimônio(s)</p>
      </Card>
      <Card>
        {rows.length === 0 ? (
          <EmptyState icon={Package} title="Nenhum patrimônio" text="O tombo oficial de rede, rack, energia e demais itens de TI fica aqui." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px] text-left text-sm">
              <thead className="text-xs uppercase tracking-wide text-slate-400">
                <tr>
                  {['Descrição', 'Marca', 'Modelo', 'Tombo', 'Categoria', 'Setor', 'Responsável', 'Status', 'Conferência', ''].map((header) => (
                    <th key={header || 'acoes'} className="px-4 py-3 font-medium">{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((asset) => (
                  <tr key={asset.id}>
                    <td className="px-4 py-3 font-medium">{asset.description}</td>
                    <td className="px-4 py-3">{asset.brand || '—'}</td>
                    <td className="px-4 py-3">{asset.model || '—'}</td>
                    <td className="px-4 py-3">{asset.tombo}</td>
                    <td className="px-4 py-3">{categoryLabel[asset.category]}</td>
                    <td className="px-4 py-3">{sectorName(db.sectors, asset.sectorId)}</td>
                    <td className="px-4 py-3">{asset.responsible || '—'}</td>
                    <td className="px-4 py-3"><StatusBadge status={asset.status} /></td>
                    <td className="px-4 py-3">{asset.lastCheckedAt ? formatDate(asset.lastCheckedAt) : <Badge tone="amber">Não conferido</Badge>}</td>
                    <td className="px-4 py-3">
                      {canEdit && (
                        <div className="flex">
                          <IconButton label="Conferir" onClick={() => repo.checkAsset(asset.id)}><Check className="h-4 w-4" /></IconButton>
                          <IconButton label="Editar" onClick={() => setEditing(asset)}><Pencil className="h-4 w-4" /></IconButton>
                          <IconButton label="Excluir" onClick={() => setRemoving(asset)}><Trash2 className="h-4 w-4" /></IconButton>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
      {editing && <AssetForm asset={editing === 'new' ? null : editing} onClose={() => setEditing(null)} />}
      {removing && (
        <ConfirmDialog
          title="Excluir patrimônio"
          message={`Excluir ${removing.tombo}? Se houver computador ou ramal vinculado, a exclusão é recusada. Para auditoria, prefira marcar como baixado.`}
          onConfirm={() => repo.removeAsset(removing.id)}
          onClose={() => setRemoving(null)}
        />
      )}
    </div>
  )
}

function StatusBadge({ status }: { status: AssetStatus }) {
  const tone = status === 'ativo' ? 'green' : status === 'manutencao' ? 'amber' : 'slate'
  return <Badge tone={tone}>{statusLabel[status]}</Badge>
}

function AssetForm({ asset, onClose }: { asset: Asset | null; onClose: () => void }) {
  const { db, repo } = useStore()
  const [form, setForm] = useState({
    description: asset?.description ?? '',
    brand: asset?.brand ?? '',
    model: asset?.model ?? '',
    serial: asset?.serial ?? '',
    tombo: asset?.tombo ?? '',
    category: asset?.category ?? 'rede' as AssetCategory,
    sectorId: asset?.sectorId ?? '',
    location: asset?.location ?? '',
    responsible: asset?.responsible ?? '',
    origin: asset?.origin ?? '',
    acquiredAt: asset?.acquiredAt ?? '',
    warrantyUntil: asset?.warrantyUntil ?? '',
    status: asset?.status ?? 'ativo' as AssetStatus,
  })
  const [error, setError] = useState('')
  const linked = asset ? db.computers.some((computer) => computer.assetId === asset.id) : false

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  return (
    <Modal title={asset ? 'Editar patrimônio' : 'Novo patrimônio'} onClose={onClose} size="lg">
      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault()
          const message = repo.saveAsset({ id: asset?.id, ...form })
          if (message) setError(message)
          else onClose()
        }}
      >
        {linked && <p className="rounded-lg bg-blue-50 px-3 py-2 text-sm text-blue-700">Este patrimônio tem ficha de computador. O status e o setor também atualizam essa ficha.</p>}
        {form.category === 'computador' && <p className="text-sm text-slate-500">Hostname, IP e sistema ficam na página Computadores.</p>}
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Descrição"><input className={inputClass} value={form.description} onChange={(event) => set('description', event.target.value)} /></Field>
          <Field label="Tombo"><input className={inputClass} value={form.tombo} onChange={(event) => set('tombo', event.target.value)} /></Field>
          <Field label="Marca"><input className={inputClass} value={form.brand} onChange={(event) => set('brand', event.target.value)} /></Field>
          <Field label="Modelo"><input className={inputClass} value={form.model} onChange={(event) => set('model', event.target.value)} /></Field>
          <Field label="Número de série"><input className={inputClass} value={form.serial} onChange={(event) => set('serial', event.target.value)} /></Field>
          <Field label="Categoria">
            <select className={inputClass} value={form.category} onChange={(event) => set('category', event.target.value as AssetCategory)}>
              {CATEGORIES.map((item) => <option key={item} value={item}>{categoryLabel[item]}</option>)}
            </select>
          </Field>
          <Field label="Local"><input className={inputClass} value={form.location} onChange={(event) => set('location', event.target.value)} /></Field>
          <Field label="Responsável"><input className={inputClass} value={form.responsible} onChange={(event) => set('responsible', event.target.value)} /></Field>
          <Field label="Nota ou origem"><input className={inputClass} value={form.origin} onChange={(event) => set('origin', event.target.value)} /></Field>
          <Field label="Status">
            <select className={inputClass} value={form.status} onChange={(event) => set('status', event.target.value as AssetStatus)}>
              {STATUSES.map((item) => <option key={item} value={item}>{statusLabel[item]}</option>)}
            </select>
          </Field>
          <Field label="Aquisição"><input type="date" className={inputClass} value={form.acquiredAt} onChange={(event) => set('acquiredAt', event.target.value)} /></Field>
          <Field label="Garantia até"><input type="date" className={inputClass} value={form.warrantyUntil} onChange={(event) => set('warrantyUntil', event.target.value)} /></Field>
        </div>
        <Field label="Setor"><SectorSelect value={form.sectorId} onChange={(sectorId) => set('sectorId', sectorId)} /></Field>
        <FormError message={error} />
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button type="submit">Salvar</Button>
        </div>
      </form>
    </Modal>
  )
}
