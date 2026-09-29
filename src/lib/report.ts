export type ReportSection = {
  title: string
  headers: string[]
  rows: (string | number)[][]
}

export type Report = {
  title: string
  filename: string
  subtitle?: string
  sections: ReportSection[]
}
