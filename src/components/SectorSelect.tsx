import { useState } from 'react'
import { useStore } from '../data/store'
import { Button, FormError, inputClass } from './ui'

export function SectorSelect({ value, onChange }: { value: string; onChange: (id: string) => void }) {
  const { db, repo, canEdit } = useStore()
  const [name, setName] = useState('')
  const [error, setError] = useState('')

  function create() {
    const message = repo.addSector(name)
    if (message) {
      setError(message)
      return
    }
    const created = repo.getState().sectors.find((sector) => sector.name.toLocaleLowerCase('pt-BR') === name.trim().toLocaleLowerCase('pt-BR'))
    if (created) onChange(created.id)
    setName('')
    setError('')
  }

  return (
    <div className="space-y-2">
      <select value={value} onChange={(event) => onChange(event.target.value)} className={inputClass}>
        <option value="">Sem setor</option>
        {db.sectors.map((sector) => (
          <option key={sector.id} value={sector.id}>{sector.name}</option>
        ))}
      </select>
      {canEdit && (
        <div className="flex gap-2">
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Novo setor"
            className={inputClass}
          />
          <Button variant="secondary" onClick={create}>Adicionar</Button>
        </div>
      )}
      <FormError message={error} />
    </div>
  )
}
