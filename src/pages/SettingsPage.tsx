import { useState } from 'react'
import { Download, Trash2, Upload } from 'lucide-react'
import { useStore } from '../data/store'
import type { Role } from '../domain/types'
import { downloadName, todayInput } from '../lib/format'
import { useTheme, type ThemeChoice } from '../lib/theme'
import { Button, Card, ConfirmDialog, Field, FormError, IconButton, inputClass } from '../components/ui'

export function SettingsPage() {
  const { db, repo, canEdit } = useStore()
  const { choice, setChoice } = useTheme()
  const [organizationName, setOrganizationName] = useState(db.settings.organizationName)
  const [operatorName, setOperatorName] = useState(db.settings.operatorName)
  const [sectorName, setSectorName] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [pendingImport, setPendingImport] = useState<string | null>(null)
  const [removingSector, setRemovingSector] = useState<string | null>(null)

  function saveIdentity() {
    const result = repo.updateSettings({ organizationName, operatorName })
    setError(result ?? '')
    setMessage(result ? '' : 'Identificação salva.')
  }

  function addSector() {
    const result = repo.addSector(sectorName)
    setError(result ?? '')
    if (!result) {
      setSectorName('')
      setMessage('Setor adicionado.')
    }
  }

  function exportBackup() {
    const blob = new Blob([repo.exportBackup()], { type: 'application/json' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `${downloadName('backup-controle-materiais')}-${todayInput()}.json`
    link.click()
    URL.revokeObjectURL(link.href)
    setMessage('Backup baixado.')
    setError('')
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <Card className="space-y-4 p-5">
        <div>
          <h2 className="font-semibold">Identificação</h2>
          <p className="mt-1 text-sm text-slate-500">O nome da organização e do operador entram no PDF, no Excel e no histórico.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Organização">
            <input className={inputClass} value={organizationName} disabled={!canEdit} onChange={(event) => setOrganizationName(event.target.value)} />
          </Field>
          <Field label="Operador">
            <input className={inputClass} value={operatorName} disabled={!canEdit} onChange={(event) => setOperatorName(event.target.value)} />
          </Field>
        </div>
        {canEdit && <Button onClick={saveIdentity}>Salvar</Button>}
      </Card>
      <Card className="space-y-3 p-5">
        <h2 className="font-semibold">Aparência</h2>
        <p className="text-sm text-muted">Claro, escuro ou o tema do sistema. A escolha fica neste navegador e não entra no backup. PDF e impressão continuam em fundo branco.</p>
        <div className="grid gap-3 sm:grid-cols-3">
          {([
            ['light', 'Claro', 'Fundo claro o tempo todo.'],
            ['dark', 'Escuro', 'Fundo escuro o tempo todo.'],
            ['system', 'Sistema', 'Acompanha o tema do computador.'],
          ] as const).map(([value, label, hint]) => (
            <button
              key={value}
              type="button"
              onClick={() => setChoice(value as ThemeChoice)}
              className={`rounded-xl border px-4 py-3 text-left text-sm ${choice === value ? 'border-accent bg-accent-soft' : 'border-line bg-surface'}`}
            >
              <span className="font-medium">{label}</span>
              <span className="mt-1 block text-muted">{hint}</span>
            </button>
          ))}
        </div>
      </Card>
      <Card className="space-y-3 p-5">
        <h2 className="font-semibold">Modo de acesso</h2>
        <p className="text-sm text-slate-500">O uso neste computador começa como administrador. Consulta só visualiza e exporta. O login real entra depois.</p>
        <div className="grid gap-3 sm:grid-cols-2">
          {(['admin', 'consulta'] as Role[]).map((role) => (
            <button
              key={role}
              type="button"
              onClick={() => repo.updateSettings({ role })}
              className={`rounded-xl border px-4 py-3 text-left text-sm ${db.settings.role === role ? 'border-accent bg-accent-soft' : 'border-line bg-surface'}`}
            >
              <span className="font-medium">{role === 'admin' ? 'Administrador' : 'Consulta'}</span>
              <span className="mt-1 block text-slate-500">{role === 'admin' ? 'Pode cadastrar, editar e excluir.' : 'Somente visualização e exportação.'}</span>
            </button>
          ))}
        </div>
      </Card>
      <Card className="space-y-4 p-5">
        <h2 className="font-semibold">Setores</h2>
        {db.sectors.length === 0 ? (
          <p className="text-sm text-slate-500">Nenhum setor cadastrado.</p>
        ) : (
          <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200">
            {db.sectors.map((sector) => (
              <li key={sector.id} className="flex items-center justify-between px-3 py-2 text-sm">
                <span>{sector.name}</span>
                {canEdit && <IconButton label="Excluir setor" onClick={() => setRemovingSector(sector.id)}><Trash2 className="h-4 w-4" /></IconButton>}
              </li>
            ))}
          </ul>
        )}
        {canEdit && (
          <div className="flex gap-2">
            <input className={inputClass} value={sectorName} placeholder="Nome do setor" onChange={(event) => setSectorName(event.target.value)} />
            <Button variant="secondary" onClick={addSector}>Adicionar</Button>
          </div>
        )}
      </Card>
      <Card className="space-y-3 p-5">
        <h2 className="font-semibold">Backup</h2>
        <p className="text-sm leading-6 text-slate-500">
          Os dados ficam neste navegador, neste computador. Exporte um arquivo antes de trocar de máquina. A importação substitui tudo o que está salvo agora, inclusive o modo de acesso.
        </p>
        <p className="text-sm text-slate-600">
          {db.assets.length} patrimônios · {db.printers.length} impressoras · {db.extensions.length} ramais · {db.computers.length} computadores · {db.disposals.length} descartes
        </p>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={exportBackup}><Download className="h-4 w-4" />Exportar backup</Button>
          {canEdit && (
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-line bg-surface px-3 py-2 text-sm font-medium text-ink hover:bg-surface-2">
              <Upload className="h-4 w-4" />
              Importar backup
              <input
                type="file"
                accept="application/json,.json"
                className="hidden"
                onChange={async (event) => {
                  const file = event.target.files?.[0]
                  event.target.value = ''
                  if (!file) return
                  setPendingImport(await file.text())
                }}
              />
            </label>
          )}
        </div>
      </Card>
      {message && <p className="text-sm text-emerald-700">{message}</p>}
      <FormError message={error} />
      {pendingImport !== null && (
        <ConfirmDialog
          title="Importar backup"
          message="Isso substitui os dados atuais deste navegador. Confirme só se o arquivo for um backup deste controle."
          confirmLabel="Importar"
          onConfirm={() => {
            const result = repo.importBackup(pendingImport)
            if (!result) {
              setMessage('Backup importado.')
              setError('')
              const next = repo.getState().settings
              setOrganizationName(next.organizationName)
              setOperatorName(next.operatorName)
            }
            return result
          }}
          onClose={() => setPendingImport(null)}
        />
      )}
      {removingSector && (
        <ConfirmDialog
          title="Excluir setor"
          message="Só é possível excluir um setor que não esteja em uso."
          onConfirm={() => repo.removeSector(removingSector)}
          onClose={() => setRemovingSector(null)}
        />
      )}
    </div>
  )
}
