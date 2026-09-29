import * as XLSX from 'xlsx'
import type { Settings } from '../domain/types'
import { downloadName, formatDateTime } from './format'
import type { Report } from './report'

function sheetName(title: string, index: number): string {
  const base = title.replace(/[\\/?*[\]:]/g, ' ').trim() || `Aba ${index + 1}`
  const named = index === 0 ? base : `${base} ${index + 1}`
  return named.slice(0, 31)
}

export function exportExcel(report: Report, settings: Settings): void {
  const workbook = XLSX.utils.book_new()
  const issued = formatDateTime(new Date().toISOString())
  const sections = report.sections.length > 0 ? report.sections : [{ title: 'Relatório', headers: [], rows: [] }]
  sections.forEach((section, index) => {
    const rows: (string | number)[][] = [
      ['Organização', settings.organizationName],
      ['Emitido em', issued],
      ['Gerado por', settings.operatorName || 'Administrador'],
      ['Relatório', report.title],
    ]
    if (report.subtitle) rows.push(['Filtro', report.subtitle])
    rows.push([section.title], [], section.headers)
    if (section.rows.length === 0) rows.push(['Nenhum registro.'])
    else rows.push(...section.rows)
    const sheet = XLSX.utils.aoa_to_sheet(rows)
    XLSX.utils.book_append_sheet(workbook, sheet, sheetName(section.title, index))
  })
  XLSX.writeFile(workbook, `${downloadName(report.filename)}.xlsx`)
}
