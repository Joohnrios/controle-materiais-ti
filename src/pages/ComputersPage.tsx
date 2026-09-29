import { useMemo, useState } from 'react'
import { Check, Monitor, Pencil, Plus, Trash2 } from 'lucide-react'
import { useStore } from '../data/store'
import { statusLabel } from '../domain/labels'
import { sectorName } from '../domain/lookups'
import type { AssetStatus, Computer } from '../domain/types'
import { formatDate, matchesQuery } from '../lib/format'
import type { Report } from '../lib/report'
import { ExportBar } from '../components/ExportBar'
import { SectorSelect } from '../components/SectorSelect'
import { Badge, Button, Card, ConfirmDialog, EmptyState, Field, FormError, IconButton, inputClass, Modal, SearchInput } from '../components/ui'

export function ComputersPage() {
  const { db, repo, canEdit } = useStore()
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<AssetStatus | ''>('')
  const [checkFilter, setCheckFilter] = useState('')
  const [editing, setEditing] = useState<Computer | 'new' | null>(null)
  const [removing, setRemoving] = useState<Computer | null>(null)

  const rows = useMemo(() => {
    return db.computers.filter((computer) => {
      const asset = db.assets.find((item) => item.id === computer.assetId)
      if (status && computer.status !== status) return false
      if (checkFilter === 'sim' && !computer.lastCheckedAt) return false
      if (checkFilter === 'nao' && computer.lastCheckedAt) return false
      return matchesQuery(query, [computer.hostname, computer.userName, computer.ip, computer.os, asset?.tombo, asset?.brand, asset?.model, asset?.serial])
    })
  }, [db, query, status, checkFilter])

  const report: Report = {
    title: 'Computadores',
    filename: 'computadores',
    sections: [{
      title: 'Computadores',
      headers: ['Hostname', 'Usuário', 'Setor', 'Marca', 'Modelo', 'Série', 'Tombo', 'IP', 'Sistema', 'Status', 'Conferência'],
      rows: rows.map((computer) => {
        const asset = db.assets.find((item) => item.id === computer.assetId)
        return [
          computer.hostname,
          computer.userName,
          sectorName(db.sectors, computer.sectorId),
          asset?.brand || '',
          asset?.model || '',
          asset?.serial || '',
          asset?.tombo || '',
          computer.ip,
          computer.os,
          statusLabel[computer.status],
          computer.lastCheckedAt ? formatDate(computer.lastCheckedAt) : 'Não conferido',
        ]
      }),
    }],
  }

  return (
    <div className="space-y-4">
      <Card className="space-y-3 p-4">
        <div className="flex flex-wrap items-center gap-3">
          <SearchInput value={query} onChange={setQuery} placeholder="Buscar hostname, usuário, tombo ou IP" />
          <div className="ml-auto flex flex-wrap gap-2">
            <ExportBar report={report} />
            {canEdit && <Button onClick={() => setEditing('new')}><Plus className="h-4 w-4" />Novo computador</Button>}
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <select className={inputClass} value={status} onChange={(event) => setStatus(event.target.value as AssetStatus | '')}>
            <option value="">Todos os status</option>
            <option value="ativo">Ativo</option>
            <option value="manutencao">Manutenção</option>
            <option value="baixado">Baixado</option>
          </select>
          <select className={inputClass} value={checkFilter} onChange={(event) => setCheckFilter(event.target.value)}>
            <option value="">Conferência: todas</option>
            <option value="sim">Conferidos</option>
            <option value="nao">Sem conferência</option>
          </select>
        </div>
        <p className="text-sm text-slate-500">{rows.length} computador(es)</p>
      </Card>
      <Card>
        {rows.length === 0 ? (
          <EmptyState icon={Monitor} title="Nenhum computador" text="A ficha técnica fica ligada ao patrimônio, para o tombo existir em um só lugar." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px] text-left text-sm">
              <thead className="text-xs uppercase tracking-wide text-slate-400">
                <tr>
                  {['Hostname', 'Usuário', 'Setor', 'Marca', 'Tombo', 'IP', 'Sistema', 'Status', 'Conferência', ''].map((header) => (
                    <th key={header || 'acoes'} className="px-4 py-3 font-medium">{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((computer) => {
                  const asset = db.assets.find((item) => item.id === computer.assetId)
                  return (
                    <tr key={computer.id}>
                      <td className="px-4 py-3 font-medium">{computer.hostname}</td>
                      <td className="px-4 py-3">{computer.userName || '—'}</td>
                      <td className="px-4 py-3">{sectorName(db.sectors, computer.sectorId)}</td>
                      <td className="px-4 py-3">{asset?.brand || '—'}</td>
                      <td className="px-4 py-3">{asset?.tombo || '—'}</td>
                      <td className="px-4 py-3">{computer.ip || '—'}</td>
                      <td className="px-4 py-3">{computer.os || '—'}</td>
                      <td className="px-4 py-3"><Badge tone={computer.status === 'ativo' ? 'green' : computer.status === 'manutencao' ? 'amber' : 'slate'}>{statusLabel[computer.status]}</Badge></td>
                      <td className="px-4 py-3">{computer.lastCheckedAt ? formatDate(computer.lastCheckedAt) : <Badge tone="amber">Não conferido</Badge>}</td>
                      <td className="px-4 py-3">
                        {canEdit && (
                          <div className="flex">
                            <IconButton label="Conferir" onClick={() => repo.checkComputer(computer.id)}><Check className="h-4 w-4" /></IconButton>
                            <IconButton label="Editar" onClick={() => setEditing(computer)}><Pencil className="h-4 w-4" /></IconButton>
                            <IconButton label="Excluir" onClick={() => setRemoving(computer)}><Trash2 className="h-4 w-4" /></IconButton>
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
      {editing && <ComputerForm computer={editing === 'new' ? null : editing} onClose={() => setEditing(null)} />}
      {removing && (
        <ConfirmDialog
          title="Excluir ficha"
          message={`Excluir a ficha de ${removing.hostname}? O patrimônio continua cadastrado.`}
          onConfirm={() => repo.removeComputer(removing.id)}
          onClose={() => setRemoving(null)}
        />
      )}
    </div>
  )
}

function ComputerForm({ computer, onClose }: { computer: Computer | null; onClose: () => void }) {
  const { db, repo } = useStore()
  const linked = computer ? db.assets.find((asset) => asset.id === computer.assetId) : undefined
  const available = db.assets.filter((asset) => !db.computers.some((item) => item.assetId === asset.id) || asset.id === computer?.assetId)
  const [assetId, setAssetId] = useState(computer?.assetId ?? '')
  const [description, setDescription] = useState(linked?.description ?? '')
  const [brand, setBrand] = useState(linked?.brand ?? '')
  const [model, setModel] = useState(linked?.model ?? '')
  const [serial, setSerial] = useState(linked?.serial ?? '')
  const [tombo, setTombo] = useState(linked?.tombo ?? '')
  const [sectorId, setSectorId] = useState(computer?.sectorId || linked?.sectorId || '')
  const [location, setLocation] = useState(linked?.location ?? '')
  const [responsible, setResponsible] = useState(linked?.responsible ?? '')
  const [origin, setOrigin] = useState(linked?.origin ?? '')
  const [acquiredAt, setAcquiredAt] = useState(linked?.acquiredAt ?? '')
  const [warrantyUntil, setWarrantyUntil] = useState(linked?.warrantyUntil ?? '')
  const [hostname, setHostname] = useState(computer?.hostname ?? '')
  const [userName, setUserName] = useState(computer?.userName ?? '')
  const [ip, setIp] = useState(computer?.ip ?? '')
  const [os, setOs] = useState(computer?.os ?? '')
  const [status, setStatus] = useState<AssetStatus>(computer?.status ?? 'ativo')
  const [error, setError] = useState('')

  function pickAsset(id: string) {
    setAssetId(id)
    const asset = db.assets.find((item) => item.id === id)
    if (!asset) return
    setDescription(asset.description)
    setBrand(asset.brand)
    setModel(asset.model)
    setSerial(asset.serial)
    setTombo(asset.tombo)
    setSectorId(asset.sectorId)
    setLocation(asset.location)
    setResponsible(asset.responsible)
    setOrigin(asset.origin)
    setAcquiredAt(asset.acquiredAt)
    setWarrantyUntil(asset.warrantyUntil)
    setStatus(asset.status)
  }

  return (
    <Modal title={computer ? 'Editar computador' : 'Novo computador'} onClose={onClose} size="lg">
      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault()
          const message = repo.saveComputer({
            id: computer?.id,
            assetId: assetId || undefined,
            description,
            brand,
            model,
            serial,
            tombo,
            sectorId,
            location,
            responsible,
            origin,
            acquiredAt,
            warrantyUntil,
            hostname,
            userName,
            ip,
            os,
            status,
          })
          if (message) setError(message)
          else onClose()
        }}
      >
        {!computer && (
          <Field label="Patrimônio existente">
            <select className={inputClass} value={assetId} onChange={(event) => pickAsset(event.target.value)}>
              <option value="">Criar patrimônio novo</option>
              {available.map((asset) => <option key={asset.id} value={asset.id}>{asset.tombo} — {asset.description}</option>)}
            </select>
          </Field>
        )}
        <p className="text-sm font-medium text-slate-800">Patrimônio</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Descrição"><input className={inputClass} value={description} onChange={(event) => setDescription(event.target.value)} /></Field>
          <Field label="Tombo"><input className={inputClass} value={tombo} onChange={(event) => setTombo(event.target.value)} /></Field>
          <Field label="Marca"><input className={inputClass} value={brand} onChange={(event) => setBrand(event.target.value)} /></Field>
          <Field label="Modelo"><input className={inputClass} value={model} onChange={(event) => setModel(event.target.value)} /></Field>
          <Field label="Número de série"><input className={inputClass} value={serial} onChange={(event) => setSerial(event.target.value)} /></Field>
          <Field label="Responsável"><input className={inputClass} value={responsible} onChange={(event) => setResponsible(event.target.value)} /></Field>
          <Field label="Local"><input className={inputClass} value={location} onChange={(event) => setLocation(event.target.value)} /></Field>
          <Field label="Nota ou origem"><input className={inputClass} value={origin} onChange={(event) => setOrigin(event.target.value)} /></Field>
          <Field label="Aquisição"><input type="date" className={inputClass} value={acquiredAt} onChange={(event) => setAcquiredAt(event.target.value)} /></Field>
          <Field label="Garantia até"><input type="date" className={inputClass} value={warrantyUntil} onChange={(event) => setWarrantyUntil(event.target.value)} /></Field>
        </div>
        <Field label="Setor"><SectorSelect value={sectorId} onChange={setSectorId} /></Field>
        <p className="text-sm font-medium text-slate-800">Ficha técnica</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Hostname"><input className={inputClass} value={hostname} onChange={(event) => setHostname(event.target.value)} /></Field>
          <Field label="Usuário"><input className={inputClass} value={userName} onChange={(event) => setUserName(event.target.value)} /></Field>
          <Field label="IP"><input className={inputClass} value={ip} onChange={(event) => setIp(event.target.value)} /></Field>
          <Field label="Sistema"><input className={inputClass} value={os} onChange={(event) => setOs(event.target.value)} /></Field>
          <Field label="Status">
            <select className={inputClass} value={status} onChange={(event) => setStatus(event.target.value as AssetStatus)}>
              <option value="ativo">Ativo</option>
              <option value="manutencao">Manutenção</option>
              <option value="baixado">Baixado</option>
            </select>
          </Field>
        </div>
        <FormError message={error} />
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button type="submit">Salvar</Button>
        </div>
      </form>
    </Modal>
  )
}
