import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

export type ThemeChoice = 'light' | 'dark' | 'system'

export const THEME_KEY = 'controle-materiais-ti.theme'

export function readThemeChoice(): ThemeChoice {
  const value = localStorage.getItem(THEME_KEY)
  if (value === 'light' || value === 'dark' || value === 'system') return value
  return 'system'
}

export function prefersDark(): boolean {
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

export function resolveDark(choice: ThemeChoice): boolean {
  if (choice === 'dark') return true
  if (choice === 'light') return false
  return prefersDark()
}

export function applyTheme(choice: ThemeChoice) {
  const dark = resolveDark(choice)
  document.documentElement.classList.toggle('dark', dark)
  document.documentElement.style.colorScheme = dark ? 'dark' : 'light'
}

export function saveTheme(choice: ThemeChoice) {
  localStorage.setItem(THEME_KEY, choice)
  applyTheme(choice)
}

const ThemeContext = createContext<{ choice: ThemeChoice; setChoice: (choice: ThemeChoice) => void } | null>(null)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [choice, setChoiceState] = useState<ThemeChoice>(readThemeChoice)

  useEffect(() => {
    applyTheme(choice)
    if (choice !== 'system') return
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => applyTheme('system')
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [choice])

  function setChoice(next: ThemeChoice) {
    saveTheme(next)
    setChoiceState(next)
  }

  return <ThemeContext.Provider value={{ choice, setChoice }}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const value = useContext(ThemeContext)
  if (!value) throw new Error('useTheme precisa do ThemeProvider')
  return value
}
