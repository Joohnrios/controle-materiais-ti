import { useState } from 'react'
import { FileSpreadsheet, FileText } from 'lucide-react'
import { useStore } from '../data/store'
import { exportExcel } from '../lib/exportExcel'
import type { Report } from '../lib/report'
import { ReportPreview } from './ReportPreview'
import { Button } from './ui'

export function ExportBar({ report }: { report: Report }) {
  const { db } = useStore()
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button variant="secondary" onClick={() => exportExcel(report, db.settings)}>
        <FileSpreadsheet className="h-4 w-4" />
        Excel
      </Button>
      <Button variant="secondary" onClick={() => setOpen(true)}>
        <FileText className="h-4 w-4" />
        PDF
      </Button>
      {open && <ReportPreview report={report} settings={db.settings} onClose={() => setOpen(false)} />}
    </>
  )
}
