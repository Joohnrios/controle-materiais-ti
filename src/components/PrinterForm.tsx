import { useState } from 'react'
import type { Printer, PrinterType } from '../domain/types'
import { useStore } from '../data/store'
import { SectorSelect } from './SectorSelect'
import { Button, Field, FormError, inputClass, Modal } from './ui'

const empty = {
  name: '',
  code: '',
  manufacturer: '',
  model: '',
  serial: '',
  ip: '',
  location: '',
  sectorId: '',
  type: 'colorida' as PrinterType,
}

export function PrinterForm({ printer, onClose }: { printer: Printer | null; onClose: () => void }) {
  const { repo } = useStore()
  const [form, setForm] = useState(printer ? {
    name: printer.name,
    code: printer.code,
    manufacturer: printer.manufacturer,
    model: printer.model,
    serial: printer.serial,
    ip: printer.ip,
    location: printer.location,
    sectorId: printer.sectorId,
    type: printer.type,
  } : empty)
  const [error, setError] = useState('')

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  return (
    <Modal title={printer ? 'Editar impressora' : 'Nova impressora'} onClose={onClose} size="lg">
      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault()
          const message = repo.savePrinter({ id: printer?.id, ...form })
          if (message) setError(message)
          else onClose()
        }}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nome">
            <input className={inputClass} value={form.name} onChange={(event) => set('name', event.target.value)} />
          </Field>
          <Field label="Código">
            <input className={inputClass} value={form.code} onChange={(event) => set('code', event.target.value)} />
          </Field>
          <Field label="Fabricante">
            <input className={inputClass} value={form.manufacturer} onChange={(event) => set('manufacturer', event.target.value)} />
          </Field>
          <Field label="Modelo">
            <input className={inputClass} value={form.model} onChange={(event) => set('model', event.target.value)} />
          </Field>
          <Field label="Número de série">
            <input className={inputClass} value={form.serial} onChange={(event) => set('serial', event.target.value)} />
          </Field>
          <Field label="IP">
            <input className={inputClass} value={form.ip} onChange={(event) => set('ip', event.target.value)} />
          </Field>
          <Field label="Localização">
            <input className={inputClass} value={form.location} onChange={(event) => set('location', event.target.value)} />
          </Field>
          <Field label="Tipo">
            <select className={inputClass} value={form.type} onChange={(event) => set('type', event.target.value as PrinterType)}>
              <option value="colorida">Colorida</option>
              <option value="monocromatica">Monocromática</option>
            </select>
          </Field>
        </div>
        <Field label="Setor">
          <SectorSelect value={form.sectorId} onChange={(sectorId) => set('sectorId', sectorId)} />
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
