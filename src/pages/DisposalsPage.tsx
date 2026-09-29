import { useMemo, useState } from 'react'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { useStore } from '../data/store'
import { REASONS, reasonLabel, tonerColorLabel } from '../domain/labels'
import { sectorName } from '../domain/lookups'
import type { Disposal, DisposalReason, SupplyKind } from '../domain/types'
import { formatDate, matchesQuery, todayInput } from '../lib/format'
import type { Report } from '../lib/report'
import { ExportBar } from '../components/ExportBar'
import { SectorSelect } from '../components/SectorSelect'
import { Badge, Button, Card, ConfirmDialog, EmptyState, Field, FormError, IconButton, inputClass, Modal, SearchInput } from '../components/ui'

export function DisposalsPage() {
  const { db, repo, canEdit } = useStore()
  const [query, setQuery] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [supply, setSupply] = useState('')
  const [manufacturer, setManufacturer] = useState('')
  const [responsible, setResponsible] = useState('')
  const [sectorId, setSectorId] = useState('')
  const [editing, setEditing] = useState<Disposal | 'new' | null>(null)
  const [removing, setRemoving] = useState<Disposal | null>(null)

  const manufacturers = [...new Set(db.disposals.map((item) => item.manufacturer).filter(Boolean))]
  const supplyTypes = [...new Set(db.disposals.map((item) => item.supplyType).filter(Boolean))]
  const people = [...new Set(db.disposals.map((item) => item.responsible).filter(Boolean))]

  const rows = useMemo(() => {
    return [...db.disposals]
      .filter((item) => {
        if (from && item.date < from) return false
        if (to && item.date > to) return false
        if (supply && item.supplyType !== supply) return false
        if (manufacturer && item.manufacturer !== manufacturer) return false
        if (responsible && item.responsible !== responsible) return false
        if (sectorId && item.sectorId !== sectorId) return false
        return matchesQuery(query, [item.printerName, item.printerModel, item.supplyType, item.responsible, item.notes, item.manufacturer])
      })
      .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt))
  }, [db.disposals, from, to, supply, manufacturer, responsible, sectorId, query])

  const subtitle = [
    from || to ? `Período ${from || '…'} a ${to || '…'}` : '',
    supply ? `Insumo ${supply}` : '',
    manufacturer ? `Fabricante ${manufacturer}` : '',
    responsible ? `Responsável ${responsible}` : '',
    sectorId ? `Setor ${sectorName(db.sectors, sectorId)}` : '',
    query ? `Busca ${query}` : '',
  ].filter(Boolean).join(' · ')

  const report: Report = {
    title: 'Descartes de impressoras',
    filename: 'descartes',
    subtitle: subtitle || undefined,
    sections: [{
      title: 'Descartes',
      headers: ['Data', 'Setor', 'Impressora', 'Modelo', 'Fabricante', 'Tipo', 'Qtd', 'Motivo', 'Responsável', 'Observação'],
      rows: rows.map((item) => [
        formatDate(item.date),
        sectorName(db.sectors, item.sectorId),
        item.printerName,
        item.printerModel,
        item.manufacturer,
        item.supplyType,
        item.quantity,
        reasonLabel[item.reason],
        item.responsible,
        item.notes,
      ]),
    }],
  }

  return (
    <div className="space-y-4">
      <Card className="space-y-4 p-4">
        <div className="flex flex-wrap items-center gap-3">
          <SearchInput value={query} onChange={setQuery} placeholder="Buscar impressora, insumo, responsável..." />
          <div className="ml-auto flex flex-wrap gap-2">
            <ExportBar report={report} />
            {canEdit && <Button onClick={() => setEditing('new')}><Plus className="h-4 w-4" />Novo descarte</Button>}
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
          <input type="date" className={inputClass} value={from} onChange={(event) => setFrom(event.target.value)} aria-label="Data início" />
          <input type="date" className={inputClass} value={to} onChange={(event) => setTo(event.target.value)} aria-label="Data fim" />
          <select className={inputClass} value={supply} onChange={(event) => setSupply(event.target.value)} aria-label="Tipo de insumo">
            <option value="">Todos os insumos</option>
            {supplyTypes.map((item) => <option key={item}>{item}</option>)}
          </select>
          <select className={inputClass} value={manufacturer} onChange={(event) => setManufacturer(event.target.value)} aria-label="Fabricante">
            <option value="">Todos os fabricantes</option>
            {manufacturers.map((item) => <option key={item}>{item}</option>)}
          </select>
          <select className={inputClass} value={sectorId} onChange={(event) => setSectorId(event.target.value)} aria-label="Setor">
            <option value="">Todos os setores</option>
            {db.sectors.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select>
          <select className={inputClass} value={responsible} onChange={(event) => setResponsible(event.target.value)} aria-label="Responsável">
            <option value="">Todos os responsáveis</option>
            {people.map((item) => <option key={item}>{item}</option>)}
          </select>
        </div>
        <p className="text-sm text-slate-500">{rows.length} registro(s)</p>
      </Card>
      <Card>
        {rows.length === 0 ? (
          <EmptyState icon={Trash2} title="Nenhum descarte" text="Os descartes de toner e peças aparecem aqui, prontos para filtrar e exportar." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-left text-sm">
              <thead className="text-xs uppercase tracking-wide text-slate-400">
                <tr>
                  {['Data', 'Setor', 'Impressora', 'Modelo', 'Tipo', 'Qtd', 'Motivo', 'Responsável', ''].map((header) => (
                    <th key={header || 'acoes'} className="px-4 py-3 font-medium">{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((item) => (
                  <tr key={item.id}>
                    <td className="px-4 py-3">{formatDate(item.date)}</td>
                    <td className="px-4 py-3">{sectorName(db.sectors, item.sectorId)}</td>
                    <td className="px-4 py-3 font-medium">{item.printerName}</td>
                    <td className="px-4 py-3">{item.printerModel}</td>
                    <td className="px-4 py-3">{item.supplyType}</td>
                    <td className="px-4 py-3">{item.quantity}</td>
                    <td className="px-4 py-3"><Badge tone="slate">{reasonLabel[item.reason]}</Badge></td>
                    <td className="px-4 py-3">{item.responsible}</td>
                    <td className="px-4 py-3">
                      {canEdit && (
                        <div className="flex">
                          <IconButton label="Editar" onClick={() => setEditing(item)}><Pencil className="h-4 w-4" /></IconButton>
                          <IconButton label="Excluir" onClick={() => setRemoving(item)}><Trash2 className="h-4 w-4" /></IconButton>
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
      {editing && <DisposalForm disposal={editing === 'new' ? null : editing} onClose={() => setEditing(null)} />}
      {removing && (
        <ConfirmDialog
          title="Excluir descarte"
          message="O registro sai da lista, mas permanece no histórico de alterações. O estoque já baixado não volta automaticamente."
          onConfirm={() => repo.removeDisposal(removing.id)}
          onClose={() => setRemoving(null)}
        />
      )}
    </div>
  )
}

function DisposalForm({ disposal, onClose }: { disposal: Disposal | null; onClose: () => void }) {
  const { db, repo } = useStore()
  const [date, setDate] = useState(disposal?.date || todayInput())
  const [sectorId, setSectorId] = useState(disposal?.sectorId || '')
  const [printerId, setPrinterId] = useState(disposal?.printerId || '')
  const [choice, setChoice] = useState(disposal ? `texto:${disposal.supplyType}` : '')
  const [customType, setCustomType] = useState(disposal?.supplyType || '')
  const [quantity, setQuantity] = useState(String(disposal?.quantity || 1))
  const [reason, setReason] = useState<DisposalReason>(disposal?.reason || 'insumo_esgotado')
  const [responsible, setResponsible] = useState(disposal?.responsible || db.settings.operatorName)
  const [notes, setNotes] = useState(disposal?.notes || '')
  const [deduct, setDeduct] = useState(!disposal)
  const [error, setError] = useState('')

  const options = useMemo(() => {
    const toners = db.toners.filter((toner) => toner.printerId === printerId).map((toner) => ({
      key: `toner:${toner.id}`,
      kind: 'toner' as SupplyKind,
      id: toner.id,
      label: `Toner ${tonerColorLabel[toner.color]}`,
      stock: toner.stock,
    }))
    const parts = db.parts.filter((part) => part.printerId === printerId).map((part) => ({
      key: `peca:${part.id}`,
      kind: 'peca' as SupplyKind,
      id: part.id,
      label: part.name,
      stock: part.stock,
    }))
    return [...toners, ...parts]
  }, [db.toners, db.parts, printerId])

  const selected = options.find((option) => option.key === choice)
  const supplyType = selected?.label || (choice === 'outro' ? customType : customType)

  return (
    <Modal title={disposal ? 'Editar descarte' : 'Novo descarte'} onClose={onClose} size="lg">
      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault()
          const message = repo.saveDisposal({
            id: disposal?.id,
            date,
            sectorId,
            printerId,
            supplyType,
            quantity: Number(quantity),
            reason,
            responsible,
            notes,
            deductStock: !disposal && deduct && Boolean(selected),
            supplyKind: selected?.kind,
            supplyId: selected?.id,
          })
          if (message) setError(message)
          else onClose()
        }}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Data">
            <input type="date" className={inputClass} value={date} onChange={(event) => setDate(event.target.value)} />
          </Field>
          <Field label="Impressora">
            <select
              className={inputClass}
              value={printerId}
              onChange={(event) => {
                const next = event.target.value
                setPrinterId(next)
                const printer = db.printers.find((item) => item.id === next)
                if (printer && !sectorId) setSectorId(printer.sectorId)
                setChoice('')
              }}
            >
              <option value="">Selecione</option>
              {db.printers.map((printer) => <option key={printer.id} value={printer.id}>{printer.name}</option>)}
            </select>
          </Field>
          <Field label="Insumo">
            <select className={inputClass} value={choice.startsWith('texto:') ? 'outro' : choice} onChange={(event) => setChoice(event.target.value)}>
              <option value="">Selecione</option>
              {options.map((option) => <option key={option.key} value={option.key}>{option.label} ({option.stock})</option>)}
              <option value="outro">Outro</option>
            </select>
          </Field>
          {(choice === 'outro' || choice.startsWith('texto:')) && (
            <Field label="Descrição do insumo">
              <input className={inputClass} value={customType} onChange={(event) => setCustomType(event.target.value)} />
            </Field>
          )}
          <Field label="Quantidade">
            <input className={inputClass} inputMode="numeric" value={quantity} onChange={(event) => setQuantity(event.target.value)} />
          </Field>
          <Field label="Motivo">
            <select className={inputClass} value={reason} onChange={(event) => setReason(event.target.value as DisposalReason)}>
              {REASONS.map((item) => <option key={item} value={item}>{reasonLabel[item]}</option>)}
            </select>
          </Field>
          <Field label="Responsável">
            <input className={inputClass} value={responsible} onChange={(event) => setResponsible(event.target.value)} />
          </Field>
        </div>
        <Field label="Setor">
          <SectorSelect value={sectorId} onChange={setSectorId} />
        </Field>
        <Field label="Observação">
          <input className={inputClass} value={notes} onChange={(event) => setNotes(event.target.value)} />
        </Field>
        {!disposal && selected && (
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" checked={deduct} onChange={(event) => setDeduct(event.target.checked)} />
            Baixar do estoque atual ({selected.stock})
          </label>
        )}
        <FormError message={error} />
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button type="submit">Salvar</Button>
        </div>
      </form>
    </Modal>
  )
}
