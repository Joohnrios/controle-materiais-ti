import type { Result } from './mutations'
import type { MaterialsRepository } from './repository'
import { emptyDatabase, normalizeDatabase } from './database'
import {
  addSector,
  checkAsset,
  checkComputer,
  importBackup,
  moveSupply,
  removeAsset,
  removeComputer,
  removeDisposal,
  removeExtension,
  removePart,
  removePrinter,
  removeSector,
  renameSector,
  saveAsset,
  saveComputer,
  saveDisposal,
  saveExtension,
  savePart,
  savePrinter,
  saveToner,
  updateSettings,
} from './mutations'
import type { Database } from '../domain/types'
import type {
  AssetInput,
  ComputerInput,
  DisposalInput,
  ExtensionInput,
  MoveInput,
  PartInput,
  PrinterInput,
  SettingsPatch,
  TonerInput,
} from './inputs'

const STORAGE_KEY = 'controle-materiais-ti.v1'

function readStorage(): Database {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return emptyDatabase()
    return normalizeDatabase(JSON.parse(raw)) ?? emptyDatabase()
  } catch {
    return emptyDatabase()
  }
}

export class LocalRepository implements MaterialsRepository {
  private db: Database
  private listeners = new Set<() => void>()

  constructor() {
    this.db = readStorage()
  }

  getState(): Database {
    return this.db
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  private commit(next: Database) {
    this.db = next
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    this.listeners.forEach((listener) => listener())
  }

  private apply(result: Result): string | null {
    if (!result.ok) return result.error
    if (result.db !== this.db) this.commit(result.db)
    return null
  }

  updateSettings(patch: SettingsPatch): string | null {
    return this.apply(updateSettings(this.db, patch))
  }

  addSector(name: string): string | null {
    return this.apply(addSector(this.db, name))
  }

  renameSector(id: string, name: string): string | null {
    return this.apply(renameSector(this.db, id, name))
  }

  removeSector(id: string): string | null {
    return this.apply(removeSector(this.db, id))
  }

  saveAsset(input: AssetInput): string | null {
    return this.apply(saveAsset(this.db, input))
  }

  removeAsset(id: string): string | null {
    return this.apply(removeAsset(this.db, id))
  }

  checkAsset(id: string): string | null {
    return this.apply(checkAsset(this.db, id))
  }

  savePrinter(input: PrinterInput): string | null {
    return this.apply(savePrinter(this.db, input))
  }

  removePrinter(id: string): string | null {
    return this.apply(removePrinter(this.db, id))
  }

  saveToner(input: TonerInput): string | null {
    return this.apply(saveToner(this.db, input))
  }

  savePart(input: PartInput): string | null {
    return this.apply(savePart(this.db, input))
  }

  removePart(id: string): string | null {
    return this.apply(removePart(this.db, id))
  }

  moveSupply(input: MoveInput): string | null {
    return this.apply(moveSupply(this.db, input))
  }

  saveDisposal(input: DisposalInput): string | null {
    return this.apply(saveDisposal(this.db, input))
  }

  removeDisposal(id: string): string | null {
    return this.apply(removeDisposal(this.db, id))
  }

  saveExtension(input: ExtensionInput): string | null {
    return this.apply(saveExtension(this.db, input))
  }

  removeExtension(id: string): string | null {
    return this.apply(removeExtension(this.db, id))
  }

  saveComputer(input: ComputerInput): string | null {
    return this.apply(saveComputer(this.db, input))
  }

  removeComputer(id: string): string | null {
    return this.apply(removeComputer(this.db, id))
  }

  checkComputer(id: string): string | null {
    return this.apply(checkComputer(this.db, id))
  }

  exportBackup(): string {
    return JSON.stringify(this.db, null, 2)
  }

  importBackup(json: string): string | null {
    return this.apply(importBackup(this.db, json))
  }
}
