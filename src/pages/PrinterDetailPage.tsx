import { useMemo, useState, type ReactNode } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowDown, ArrowUp, ChevronLeft, Pencil, Plus, Printer, Trash2 } from 'lucide-react'
import { useStore } from '../data/store'
import { movementLabel, printerTypeLabel, tonerColorLabel, tonerDotClass } from '../domain/labels'
import { sectorName } from '../domain/lookups'
import { needsSupply, stockLabel, stockLevel } from '../domain/stock'
import type { MovementType, Part, SupplyKind, Toner } from '../domain/types'
import { formatDateTime } from '../lib/format'
import type { Report } from '../lib/report'
import { ExportBar } from '../components/ExportBar'
import { PrinterForm } from '../components/PrinterForm'
import { Badge, Button, Card, ConfirmDialog, EmptyState, Field, FormError, IconButton, inputClass, Modal } from '../components/ui'

export function PrinterDetailPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const { db, repo, canEdit } = useStore()
  const printer = db.printers.find((item) => item.id === id)
  const [editing, setEditing] = useState(false)
  const [move, setMove] = useState<{ kind: SupplyKind; id: string; type: MovementType; name: string } | null>(null)
  const [tonerEdit, setTonerEdit] = useState<Toner | null>(null)
  const [partEdit, setPartEdit] = useState<Part | 'new' | null>(null)
  const [removePartId, setRemovePartId] = useState<string | null>(null)
  const [removePrinter, setRemovePrinter] = useState(false)

  const toners = useMemo(
    () => db.toners.filter((toner) => toner.printerId === id).sort((a, b) => colorOrder(a.color) - colorOrder(b.color)),
    [db.toners, id],
  )
  const parts = useMemo(
    () => db.parts.filter((part) => part.printerId === id).sort((a, b) => a.name.localeCompare(b.name, 'pt-BR')),
    [db.parts, id],
  )
  const movements = useMemo(
    () => db.movements.filter((movement) => movement.printerId === id),
    [db.movements, id],
  )

  if (!printer) {
    return (
      <Card>
        <EmptyState icon={Printer} title="Impressora não encontrada" text="Ela pode ter sido excluída neste navegador." />
        <div className="pb-8 text-center">
          <Link to="/impressoras" className="text-sm font-medium text-blue-600">Voltar</Link>
        </div>
      </Card>
    )
  }

  const low = needsSupply([...toners, ...parts])
  const report: Report = {
    title: `Ficha ${printer.name}`,
    filename: `ficha-${printer.name}`,
    sections: [
      {
        title: 'Identificação',
        headers: ['Nome', 'Código', 'Fabricante', 'Modelo', 'Série', 'IP', 'Local', 'Setor', 'Tipo', 'Status'],
        rows: [[
          printer.name,
          printer.code,
          printer.manufacturer,
          printer.model,
          printer.serial,
          printer.ip,
          printer.location,
          sectorName(db.sectors, printer.sectorId),
          printerTypeLabel[printer.type],
          low ? 'Estoque baixo' : 'Normal',
        ]],
      },
      {
        title: 'Toners',
        headers: ['Cor', 'Modelo', 'Código', 'Estoque', 'Mínimo', 'Status'],
        rows: toners.map((toner) => [
          tonerColorLabel[toner.color],
          toner.model,
          toner.code,
          toner.stock,
          toner.minimum,
          stockLabel(stockLevel(toner.stock, toner.minimum)),
        ]),
      },
      {
        title: 'Peças',
        headers: ['Peça', 'Estoque', 'Mínimo', 'Status', 'Observação'],
        rows: parts.map((part) => [
          part.name,
          part.stock,
          part.minimum,
          stockLabel(stockLevel(part.stock, part.minimum)),
          part.notes,
        ]),
      },
      {
        title: 'Histórico',
        headers: ['Data', 'Suprimento', 'Tipo', 'Quantidade', 'Usuário', 'Observação'],
        rows: movements.map((movement) => [
          formatDateTime(movement.createdAt),
          movement.supplyName,
          movementLabel[movement.type],
          movement.quantity,
          movement.user,
          movement.notes,
        ]),
      },
    ],
  }

  const fields = [
    ['Nome', printer.name],
    ['Código', printer.code || '—'],
    ['Fabricante', printer.manufacturer],
    ['IP', printer.ip || '—'],
    ['Modelo', printer.model],
    ['Localização', printer.location || '—'],
    ['Número de série', printer.serial || '—'],
    ['Tipo', printerTypeLabel[printer.type]],
    ['Setor', sectorName(db.sectors, printer.sectorId)],
  ]

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link to="/impressoras" className="inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-800">
          <ChevronLeft className="h-4 w-4" />
          Impressoras
        </Link>
        <div className="flex flex-wrap gap-2">
          <ExportBar report={report} />
          {canEdit && <Button variant="secondary" onClick={() => setEditing(true)}>Editar</Button>}
          {canEdit && <Button variant="danger" onClick={() => setRemovePrinter(true)}>Excluir</Button>}
        </div>
      </div>
      <Card className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-blue-50 text-blue-600">
              <Printer className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-lg font-semibold">{printer.name}</h2>
              <p className="text-sm text-slate-500">{printer.manufacturer}</p>
            </div>
          </div>
          <Badge tone={low ? 'amber' : 'green'}>{low ? 'Estoque baixo' : 'Normal'}</Badge>
        </div>
        <dl className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {fields.map(([label, value]) => (
            <div key={label}>
              <dt className="text-xs text-slate-400">{label}</dt>
              <dd className="mt-1 font-medium text-slate-800">{value}</dd>
            </div>
          ))}
        </dl>
      </Card>
      <Card>
        <div className="flex items-center justify-between px-5 py-4">
          <h2 className="font-semibold">Suprimentos (Toners)</h2>
          <span className="text-sm text-slate-400">{toners.length} toner(s)</span>
        </div>
        <SupplyTable
          headers={['Cor', 'Modelo', 'Código', 'Estoque', 'Mínimo', 'Status', 'Ações']}
          empty="Nenhum toner nesta impressora."
        >
          {toners.map((toner) => {
            const level = stockLevel(toner.stock, toner.minimum)
            return (
              <tr key={toner.id}>
                <td className="px-5 py-3">
                  <span className="inline-flex items-center gap-2">
                    <span className={`h-3 w-3 rounded-full ${tonerDotClass[toner.color]}`} />
                    {tonerColorLabel[toner.color]}
                  </span>
                </td>
                <td className="px-5 py-3">{toner.model || '—'}</td>
                <td className="px-5 py-3">{toner.code || '—'}</td>
                <td className="px-5 py-3">{toner.stock}</td>
                <td className="px-5 py-3">{toner.minimum}</td>
                <td className="px-5 py-3"><Badge tone={level === 'sem' ? 'red' : level === 'baixo' ? 'amber' : 'green'}>{stockLabel(level)}</Badge></td>
                <td className="px-5 py-3">
                  {canEdit && (
                    <div className="flex">
                      <IconButton label="Saída" onClick={() => setMove({ kind: 'toner', id: toner.id, type: 'saida', name: `Toner ${tonerColorLabel[toner.color]}` })}><ArrowDown className="h-4 w-4" /></IconButton>
                      <IconButton label="Entrada" onClick={() => setMove({ kind: 'toner', id: toner.id, type: 'entrada', name: `Toner ${tonerColorLabel[toner.color]}` })}><ArrowUp className="h-4 w-4" /></IconButton>
                      <IconButton label="Editar" onClick={() => setTonerEdit(toner)}><Pencil className="h-4 w-4" /></IconButton>
                    </div>
                  )}
                </td>
              </tr>
            )
          })}
        </SupplyTable>
      </Card>
      <Card>
        <div className="flex items-center justify-between px-5 py-4">
          <h2 className="font-semibold">Suprimentos/Peças</h2>
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-400">{parts.length} item(ns)</span>
            {canEdit && <Button onClick={() => setPartEdit('new')}><Plus className="h-4 w-4" />Novo suprimento</Button>}
          </div>
        </div>
        <SupplyTable headers={['Peça / suprimento', 'Estoque', 'Status', 'Observações', 'Ações']} empty="Nenhuma peça cadastrada.">
          {parts.map((part) => {
            const level = stockLevel(part.stock, part.minimum)
            return (
              <tr key={part.id}>
                <td className="px-5 py-3 font-medium">{part.name}</td>
                <td className="px-5 py-3">{part.stock}</td>
                <td className="px-5 py-3"><Badge tone={level === 'sem' ? 'red' : level === 'baixo' ? 'amber' : 'green'}>{stockLabel(level)}</Badge></td>
                <td className="px-5 py-3 text-slate-500">{part.notes || '—'}</td>
                <td className="px-5 py-3">
                  {canEdit && (
                    <div className="flex">
                      <IconButton label="Saída" onClick={() => setMove({ kind: 'peca', id: part.id, type: 'saida', name: part.name })}><ArrowDown className="h-4 w-4" /></IconButton>
                      <IconButton label="Entrada" onClick={() => setMove({ kind: 'peca', id: part.id, type: 'entrada', name: part.name })}><ArrowUp className="h-4 w-4" /></IconButton>
                      <IconButton label="Editar" onClick={() => setPartEdit(part)}><Pencil className="h-4 w-4" /></IconButton>
                      <IconButton label="Excluir" onClick={() => setRemovePartId(part.id)}><Trash2 className="h-4 w-4" /></IconButton>
                    </div>
                  )}
                </td>
              </tr>
            )
          })}
        </SupplyTable>
      </Card>
      <Card>
        <div className="px-5 py-4">
          <h2 className="font-semibold">Histórico de movimentações</h2>
        </div>
        <SupplyTable headers={['Data', 'Suprimento', 'Tipo', 'Quantidade', 'Usuário', 'Observação']} empty="Nenhuma movimentação registrada.">
          {movements.map((movement) => (
            <tr key={movement.id}>
              <td className="px-5 py-3">{formatDateTime(movement.createdAt)}</td>
              <td className="px-5 py-3">{movement.supplyName}</td>
              <td className="px-5 py-3">{movementLabel[movement.type]}</td>
              <td className="px-5 py-3">{movement.quantity}</td>
              <td className="px-5 py-3">{movement.user}</td>
              <td className="px-5 py-3 text-slate-500">{movement.notes || '—'}</td>
            </tr>
          ))}
        </SupplyTable>
      </Card>
      {editing && <PrinterForm printer={printer} onClose={() => setEditing(false)} />}
      {move && <MoveDialog move={move} onClose={() => setMove(null)} />}
      {tonerEdit && <TonerDialog toner={tonerEdit} onClose={() => setTonerEdit(null)} />}
      {partEdit && <PartDialog printerId={printer.id} part={partEdit === 'new' ? null : partEdit} onClose={() => setPartEdit(null)} />}
      {removePartId && (
        <ConfirmDialog
          title="Excluir suprimento"
          message="A peça sai da ficha. O histórico de movimentação permanece."
          onConfirm={() => repo.removePart(removePartId)}
          onClose={() => setRemovePartId(null)}
        />
      )}
      {removePrinter && (
        <ConfirmDialog
          title="Excluir impressora"
          message="Toners e peças desta impressora serão removidos. Descartes já registrados continuam no histórico."
          onConfirm={() => {
            const error = repo.removePrinter(printer.id)
            if (!error) navigate('/impressoras')
            return error
          }}
          onClose={() => setRemovePrinter(false)}
        />
      )}
    </div>
  )
}

function colorOrder(color: string): number {
  return ['preto', 'ciano', 'magenta', 'amarelo'].indexOf(color)
}

function SupplyTable({ headers, empty, children }: { headers: string[]; empty: string; children: ReactNode }) {
  const list = Array.isArray(children) ? children : [children]
  const visible = list.some(Boolean)
  return visible ? (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[760px] text-left text-sm">
        <thead className="border-t border-slate-100 text-xs uppercase tracking-wide text-slate-400">
          <tr>{headers.map((header) => <th key={header} className="px-5 py-3 font-medium">{header}</th>)}</tr>
        </thead>
        <tbody className="divide-y divide-slate-100">{children}</tbody>
      </table>
    </div>
  ) : (
    <p className="px-5 pb-6 text-sm text-slate-500">{empty}</p>
  )
}

function MoveDialog({
  move,
  onClose,
}: {
  move: { kind: SupplyKind; id: string; type: MovementType; name: string }
  onClose: () => void
}) {
  const { repo, db } = useStore()
  const [quantity, setQuantity] = useState('1')
  const [user, setUser] = useState(db.settings.operatorName)
  const [notes, setNotes] = useState('')
  const [error, setError] = useState('')
  return (
    <Modal title={`${move.type === 'entrada' ? 'Entrada' : 'Saída'} · ${move.name}`} onClose={onClose}>
      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault()
          const message = repo.moveSupply({
            supplyKind: move.kind,
            supplyId: move.id,
            type: move.type,
            quantity: Number(quantity),
            user,
            notes,
          })
          if (message) setError(message)
          else onClose()
        }}
      >
        <Field label="Quantidade">
          <input className={inputClass} inputMode="numeric" value={quantity} onChange={(event) => setQuantity(event.target.value)} />
        </Field>
        <Field label="Usuário">
          <input className={inputClass} value={user} onChange={(event) => setUser(event.target.value)} />
        </Field>
        <Field label="Observação">
          <input className={inputClass} value={notes} onChange={(event) => setNotes(event.target.value)} />
        </Field>
        <FormError message={error} />
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button type="submit">Salvar</Button>
        </div>
      </form>
    </Modal>
  )
}

function TonerDialog({ toner, onClose }: { toner: Toner; onClose: () => void }) {
  const { repo } = useStore()
  const [model, setModel] = useState(toner.model)
  const [code, setCode] = useState(toner.code)
  const [minimum, setMinimum] = useState(String(toner.minimum))
  const [error, setError] = useState('')
  return (
    <Modal title={`Editar toner ${tonerColorLabel[toner.color]}`} onClose={onClose}>
      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault()
          const message = repo.saveToner({ id: toner.id, model, code, minimum: Number(minimum) })
          if (message) setError(message)
          else onClose()
        }}
      >
        <Field label="Modelo"><input className={inputClass} value={model} onChange={(event) => setModel(event.target.value)} /></Field>
        <Field label="Código"><input className={inputClass} value={code} onChange={(event) => setCode(event.target.value)} /></Field>
        <Field label="Estoque mínimo"><input className={inputClass} inputMode="numeric" value={minimum} onChange={(event) => setMinimum(event.target.value)} /></Field>
        <p className="text-xs text-slate-500">O estoque muda apenas por entrada ou saída, para ficar no histórico.</p>
        <FormError message={error} />
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button type="submit">Salvar</Button>
        </div>
      </form>
    </Modal>
  )
}

function PartDialog({ printerId, part, onClose }: { printerId: string; part: Part | null; onClose: () => void }) {
  const { repo } = useStore()
  const [name, setName] = useState(part?.name ?? '')
  const [minimum, setMinimum] = useState(String(part?.minimum ?? 1))
  const [notes, setNotes] = useState(part?.notes ?? '')
  const [error, setError] = useState('')
  return (
    <Modal title={part ? 'Editar suprimento' : 'Novo suprimento'} onClose={onClose}>
      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault()
          const message = repo.savePart({ id: part?.id, printerId, name, minimum: Number(minimum), notes })
          if (message) setError(message)
          else onClose()
        }}
      >
        <Field label="Peça / suprimento"><input className={inputClass} value={name} onChange={(event) => setName(event.target.value)} /></Field>
        <Field label="Estoque mínimo"><input className={inputClass} inputMode="numeric" value={minimum} onChange={(event) => setMinimum(event.target.value)} /></Field>
        <Field label="Observações"><input className={inputClass} value={notes} onChange={(event) => setNotes(event.target.value)} /></Field>
        <FormError message={error} />
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button type="submit">Salvar</Button>
        </div>
      </form>
    </Modal>
  )
}
