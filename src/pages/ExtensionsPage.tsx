import { useMemo, useState } from 'react'
import { Pencil, Phone, Plus, Trash2 } from 'lucide-react'
import { useStore } from '../data/store'
import { sectorName } from '../domain/lookups'
import type { Extension } from '../domain/types'
import { matchesQuery } from '../lib/format'
import type { Report } from '../lib/report'
import { ExportBar } from '../components/ExportBar'
import { SectorSelect } from '../components/SectorSelect'
import { Badge, Button, Card, ConfirmDialog, EmptyState, Field, FormError, IconButton, inputClass, Modal, SearchInput } from '../components/ui'

export function ExtensionsPage() {
  const { db, repo, canEdit } = useStore()
  const [query, setQuery] = useState('')
  const [editing, setEditing] = useState<Extension | 'new' | null>(null)
  const [removing, setRemoving] = useState<Extension | null>(null)
  const active = db.extensions.filter((item) => item.active).length

  const rows = useMemo(() => {
    return [...db.extensions]
      .filter((item) => {
        const asset = db.assets.find((entry) => entry.id === item.assetId)
        return matchesQuery(query, [item.number, item.externalLine, item.ip, item.model, item.nameLocation, asset?.tombo, sectorName(db.sectors, item.sectorId)])
      })
      .sort((a, b) => a.number.localeCompare(b.number, 'pt-BR', { numeric: true }))
  }, [db, query])

  const report: Report = {
    title: 'Ramais',
    filename: 'ramais',
    subtitle: query ? `Busca: ${query}` : undefined,
    sections: [{
      title: 'Ramais',
      headers: ['Ramal', 'Linha externa', 'Patrimônio', 'IP', 'Modelo', 'Nome/local', 'Setor', 'Status'],
      rows: rows.map((item) => {
        const asset = db.assets.find((entry) => entry.id === item.assetId)
        return [
          item.number,
          item.externalLine || '—',
          asset?.tombo || '—',
          item.ip || '—',
          item.model || '—',
          item.nameLocation || '—',
          sectorName(db.sectors, item.sectorId),
          item.active ? 'Ativo' : 'Inativo',
        ]
      }),
    }],
  }

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div>
            <p className="text-sm text-slate-500">Ramais ativos</p>
            <p className="text-lg font-semibold">{active} de {db.extensions.length}</p>
          </div>
          <SearchInput value={query} onChange={setQuery} placeholder="Buscar ramal, IP, setor ou patrimônio" />
          <div className="ml-auto flex gap-2">
            <ExportBar report={report} />
            {canEdit && <Button onClick={() => setEditing('new')}><Plus className="h-4 w-4" />Novo ramal</Button>}
          </div>
        </div>
      </Card>
      <Card>
        {rows.length === 0 ? (
          <EmptyState icon={Phone} title="Nenhum ramal" text="Cadastre os ramais e vincule o patrimônio quando houver tombo." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-left text-sm">
              <thead className="text-xs uppercase tracking-wide text-slate-400">
                <tr>
                  {['Ramal', 'Linha externa', 'Patrimônio', 'IP', 'Modelo', 'Nome/local', 'Setor', 'Status', ''].map((header) => (
                    <th key={header || 'acoes'} className="px-4 py-3 font-medium">{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((item) => {
                  const asset = db.assets.find((entry) => entry.id === item.assetId)
                  return (
                    <tr key={item.id}>
                      <td className="px-4 py-3 font-medium">{item.number}</td>
                      <td className="px-4 py-3">{item.externalLine || '—'}</td>
                      <td className="px-4 py-3">{asset?.tombo || '—'}</td>
                      <td className="px-4 py-3">{item.ip || '—'}</td>
                      <td className="px-4 py-3">{item.model || '—'}</td>
                      <td className="px-4 py-3">{item.nameLocation || '—'}</td>
                      <td className="px-4 py-3">{sectorName(db.sectors, item.sectorId)}</td>
                      <td className="px-4 py-3"><Badge tone={item.active ? 'green' : 'slate'}>{item.active ? 'Ativo' : 'Inativo'}</Badge></td>
                      <td className="px-4 py-3">
                        {canEdit && (
                          <div className="flex">
                            <IconButton label="Editar" onClick={() => setEditing(item)}><Pencil className="h-4 w-4" /></IconButton>
                            <IconButton label="Excluir" onClick={() => setRemoving(item)}><Trash2 className="h-4 w-4" /></IconButton>
                          </div>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
      {editing && <ExtensionForm extension={editing === 'new' ? null : editing} onClose={() => setEditing(null)} />}
      {removing && (
        <ConfirmDialog
          title="Excluir ramal"
          message={`Excluir o ramal ${removing.number}? O patrimônio vinculado não é apagado.`}
          onConfirm={() => repo.removeExtension(removing.id)}
          onClose={() => setRemoving(null)}
        />
      )}
    </div>
  )
}

function ExtensionForm({ extension, onClose }: { extension: Extension | null; onClose: () => void }) {
  const { db, repo } = useStore()
  const [number, setNumber] = useState(extension?.number ?? '')
  const [externalLine, setExternalLine] = useState(extension?.externalLine ?? '')
  const [assetId, setAssetId] = useState(extension?.assetId ?? '')
  const [ip, setIp] = useState(extension?.ip ?? '')
  const [model, setModel] = useState(extension?.model ?? '')
  const [sectorId, setSectorId] = useState(extension?.sectorId ?? '')
  const [nameLocation, setNameLocation] = useState(extension?.nameLocation ?? '')
  const [active, setActive] = useState(extension?.active ?? true)
  const [error, setError] = useState('')

  return (
    <Modal title={extension ? 'Editar ramal' : 'Novo ramal'} onClose={onClose}>
      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault()
          const message = repo.saveExtension({ id: extension?.id, number, externalLine, assetId, ip, model, sectorId, nameLocation, active })
          if (message) setError(message)
          else onClose()
        }}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Número"><input className={inputClass} value={number} onChange={(event) => setNumber(event.target.value)} /></Field>
          <Field label="Linha externa"><input className={inputClass} value={externalLine} onChange={(event) => setExternalLine(event.target.value)} /></Field>
          <Field label="Patrimônio">
            <select className={inputClass} value={assetId} onChange={(event) => setAssetId(event.target.value)}>
              <option value="">Não vinculado</option>
              {db.assets.map((asset) => <option key={asset.id} value={asset.id}>{asset.tombo} — {asset.description}</option>)}
            </select>
          </Field>
          <Field label="IP"><input className={inputClass} value={ip} onChange={(event) => setIp(event.target.value)} /></Field>
          <Field label="Modelo"><input className={inputClass} value={model} onChange={(event) => setModel(event.target.value)} /></Field>
          <Field label="Setor"><SectorSelect value={sectorId} onChange={setSectorId} /></Field>
        </div>
        <Field label="Nome / local"><input className={inputClass} value={nameLocation} onChange={(event) => setNameLocation(event.target.value)} /></Field>
        <button type="button" className="flex items-center gap-3 text-sm font-medium text-slate-700" onClick={() => setActive((value) => !value)} role="switch" aria-checked={active}>
          <span className={`relative h-6 w-11 rounded-full transition ${active ? 'bg-blue-600' : 'bg-slate-300'}`}>
            <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition ${active ? 'left-5' : 'left-0.5'}`} />
          </span>
          Ativo
        </button>
        <FormError message={error} />
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button type="submit">Salvar</Button>
        </div>
      </form>
    </Modal>
  )
}
