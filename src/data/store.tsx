import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Database } from '../domain/types'
import { LocalRepository } from './localRepository'

type StoreValue = {
  db: Database
  repo: LocalRepository
  canEdit: boolean
}

const StoreContext = createContext<StoreValue | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [repo] = useState(() => new LocalRepository())
  const [db, setDb] = useState<Database>(() => repo.getState())

  useEffect(() => repo.subscribe(() => setDb(repo.getState())), [repo])

  const value: StoreValue = { db, repo, canEdit: db.settings.role === 'admin' }
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore(): StoreValue {
  const value = useContext(StoreContext)
  if (!value) throw new Error('useStore fora do provedor')
  return value
}
