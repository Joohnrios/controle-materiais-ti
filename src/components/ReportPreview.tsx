import type { Settings } from '../domain/types'
import { formatDateTime } from '../lib/format'
import type { Report } from '../lib/report'
import { Button } from './ui'

export function ReportPreview({
  report,
  settings,
  onClose,
}: {
  report: Report
  settings: Settings
  onClose: () => void
}) {
  const issued = formatDateTime(new Date().toISOString())
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 p-4 print:bg-white print:p-0">
      <div className="mx-auto mb-4 flex max-w-5xl justify-end gap-2 print:hidden">
        <Button onClick={() => window.print()}>Salvar PDF</Button>
        <Button variant="secondary" onClick={onClose}>Fechar</Button>
      </div>
      <article id="print-root" className="mx-auto max-w-5xl bg-white p-8 text-slate-900 shadow-xl print:shadow-none">
        <header className="mb-6 border-b border-slate-200 pb-4">
          <p className="text-xs uppercase tracking-wide text-slate-500">{settings.organizationName}</p>
          <h1 className="mt-1 text-2xl font-semibold">{report.title}</h1>
          {report.subtitle && <p className="mt-1 text-sm text-slate-600">{report.subtitle}</p>}
          <p className="mt-3 text-sm text-slate-500">Emitido em {issued} por {settings.operatorName}</p>
        </header>
        <div className="space-y-8">
          {report.sections.map((section) => (
            <section key={section.title}>
              <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">{section.title}</h2>
              {section.rows.length === 0 ? (
                <p className="text-sm text-slate-500">Nenhum registro.</p>
              ) : (
                <table className="w-full border-collapse text-left text-sm">
                  <thead>
                    <tr>
                      {section.headers.map((header) => (
                        <th key={header} className="border border-slate-200 bg-slate-50 px-2 py-1.5 font-medium">{header}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {section.rows.map((row, index) => (
                      <tr key={index}>
                        {row.map((cell, cellIndex) => (
                          <td key={cellIndex} className="border border-slate-200 px-2 py-1.5">{cell}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </section>
          ))}
        </div>
        <p className="mt-4 text-xs text-slate-400 print:hidden">No diálogo de impressão, escolha Salvar como PDF.</p>
      </article>
    </div>
  )
}
