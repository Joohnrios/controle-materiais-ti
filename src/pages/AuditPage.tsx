import { useMemo, useState } from 'react'
import { ScrollText } from 'lucide-react'
import { useStore } from '../data/store'
import { ACTIONS, actionLabel } from '../domain/labels'
import type { AuditAction } from '../domain/types'
import { formatDateTime, matchesQuery } from '../lib/format'
import type { Report } from '../lib/report'
import { ExportBar } from '../components/ExportBar'
import { Card, EmptyState, inputClass, SearchInput } from '../components/ui'

export function AuditPage() {
  const { db } = useStore()
  const [query, setQuery] = useState('')
  const [action, setAction] = useState<AuditAction | ''>('')

  const rows = useMemo(() => {
    return db.audit.filter((entry) => {
      if (action && entry.action !== action) return false
      return matchesQuery(query, [entry.operator, entry.entity, entry.summary, actionLabel[entry.action]])
    })
  }, [db.audit, query, action])

  const report: Report = {
    title: 'Histórico de alterações',
    filename: 'historico',
    subtitle: [action ? actionLabel[action] : '', query ? `Busca: ${query}` : ''].filter(Boolean).join(' · ') || undefined,
    sections: [{
      title: 'Histórico',
      headers: ['Data', 'Operador', 'Ação', 'Registro', 'Resumo'],
      rows: rows.map((entry) => [formatDateTime(entry.at), entry.operator, actionLabel[entry.action], entry.entity, entry.summary]),
    }],
  }

  return (
    <div className="space-y-4">
      <Card className="space-y-3 p-4">
        <div className="flex flex-wrap items-center gap-3">
          <SearchInput value={query} onChange={setQuery} placeholder="Buscar operador, registro ou resumo" />
          <select className={`${inputClass} max-w-xs`} value={action} onChange={(event) => setAction(event.target.value as AuditAction | '')}>
            <option value="">Todas as ações</option>
            {ACTIONS.map((item) => <option key={item} value={item}>{actionLabel[item]}</option>)}
          </select>
          <div className="ml-auto flex gap-2">
            <ExportBar report={report} />
          </div>
        </div>
        <p className="text-sm text-slate-500">Este histórico não pode ser apagado pela tela. {rows.length} registro(s).</p>
      </Card>
      <Card>
        {rows.length === 0 ? (
          <EmptyState icon={ScrollText} title="Nenhuma alteração" text="Inclusões, edições, estoque, descartes e conferências aparecem aqui." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-left text-sm">
              <thead className="text-xs uppercase tracking-wide text-slate-400">
                <tr>
                  {['Data', 'Operador', 'Ação', 'Registro', 'Resumo'].map((header) => (
                    <th key={header} className="px-4 py-3 font-medium">{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((entry) => (
                  <tr key={entry.id}>
                    <td className="whitespace-nowrap px-4 py-3">{formatDateTime(entry.at)}</td>
                    <td className="px-4 py-3">{entry.operator}</td>
                    <td className="px-4 py-3">{actionLabel[entry.action]}</td>
                    <td className="px-4 py-3">{entry.entity}</td>
                    <td className="px-4 py-3 text-slate-600">{entry.summary}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}
