import type { Database, Settings } from '../domain/types'
import type {
  AssetInput,
  ComputerInput,
  DisposalInput,
  ExtensionInput,
  MoveInput,
  PartInput,
  PrinterInput,
  TonerInput,
} from './inputs'

export interface MaterialsRepository {
  getState(): Database
  subscribe(listener: () => void): () => void
  updateSettings(patch: Partial<Settings>): string | null
  addSector(name: string): string | null
  renameSector(id: string, name: string): string | null
  removeSector(id: string): string | null
  saveAsset(input: AssetInput): string | null
  removeAsset(id: string): string | null
  checkAsset(id: string): string | null
  savePrinter(input: PrinterInput): string | null
  removePrinter(id: string): string | null
  saveToner(input: TonerInput): string | null
  savePart(input: PartInput): string | null
  removePart(id: string): string | null
  moveSupply(input: MoveInput): string | null
  saveDisposal(input: DisposalInput): string | null
  removeDisposal(id: string): string | null
  saveExtension(input: ExtensionInput): string | null
  removeExtension(id: string): string | null
  saveComputer(input: ComputerInput): string | null
  removeComputer(id: string): string | null
  checkComputer(id: string): string | null
  exportBackup(): string
  importBackup(json: string): string | null
}
