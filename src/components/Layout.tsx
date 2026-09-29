import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import {
  Boxes,
  LayoutDashboard,
  Menu,
  Monitor,
  Phone,
  Printer,
  ScrollText,
  Settings,
  Trash2,
  X,
} from 'lucide-react'
import { useStore } from '../data/store'
import { initials, longDate } from '../lib/format'

const NAV = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/impressoras', label: 'Impressoras', icon: Printer, end: false },
  { to: '/descartes', label: 'Descartes', icon: Trash2, end: false },
  { to: '/patrimonios', label: 'Patrimônios', icon: Boxes, end: false },
  { to: '/ramais', label: 'Ramais', icon: Phone, end: false },
  { to: '/computadores', label: 'Computadores', icon: Monitor, end: false },
  { to: '/historico', label: 'Histórico', icon: ScrollText, end: false },
  { to: '/configuracoes', label: 'Configurações', icon: Settings, end: false },
]

function pageTitle(pathname: string): string {
  if (pathname.startsWith('/impressoras')) return 'Suprimentos de impressoras'
  if (pathname.startsWith('/descartes')) return 'Descartes'
  if (pathname.startsWith('/patrimonios')) return 'Patrimônios de TI'
  if (pathname.startsWith('/ramais')) return 'Ramais'
  if (pathname.startsWith('/computadores')) return 'Computadores'
  if (pathname.startsWith('/historico')) return 'Histórico de alterações'
  if (pathname.startsWith('/configuracoes')) return 'Configurações'
  return 'Dashboard'
}

export function Layout() {
  const { db } = useStore()
  const location = useLocation()
  const [open, setOpen] = useState(false)
  const [now, setNow] = useState(() => new Date())
  const title = pageTitle(location.pathname)

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 60000)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    document.title = `${title} · Controle de Materiais`
    setOpen(false)
  }, [title, location.pathname])

  const roleLabel = db.settings.role === 'admin' ? 'Administrador' : 'Somente visualização'

  return (
    <div className="flex h-full min-h-screen bg-canvas text-ink">
      {open && <button className="fixed inset-0 z-30 bg-black/40 md:hidden" aria-label="Fechar menu" onClick={() => setOpen(false)} />}
      <aside className={`fixed inset-y-0 left-0 z-40 flex w-56 shrink-0 flex-col border-r border-line bg-surface text-ink transition md:static ${open ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="flex items-center gap-3 px-4 py-5">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-accent text-sm font-semibold text-white">ti</span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{db.settings.organizationName}</p>
            <p className="text-xs text-muted">Controle local</p>
          </div>
        </div>
        <nav className="flex-1 space-y-0.5 px-2">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition ${isActive ? 'bg-accent-soft text-accent' : 'text-muted hover:bg-surface-2 hover:text-ink'}`
              }
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-line p-4 text-sm">
          <div className="flex items-center gap-3">
            <span className="grid h-8 w-8 place-items-center rounded-full bg-accent-soft text-xs font-semibold text-accent">
              {initials(db.settings.operatorName)}
            </span>
            <div className="min-w-0">
              <p className="truncate font-medium">{db.settings.operatorName}</p>
              <p className="text-xs text-muted">{roleLabel}</p>
            </div>
          </div>
          <p className="mt-3 text-xs text-faint">Versão 1.0.0</p>
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between gap-4 px-4 py-5 md:px-8">
          <div className="flex items-center gap-3">
            <button className="grid h-10 w-10 place-items-center rounded-lg border border-line bg-surface md:hidden" onClick={() => setOpen(true)} aria-label="Abrir menu">
              {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
            <div>
              <h1 className="text-xl font-semibold md:text-2xl">{title}</h1>
              <p className="text-sm text-muted">{longDate(now)}</p>
            </div>
          </div>
          <p className="hidden rounded-full border border-line bg-surface px-3 py-1 text-xs text-muted sm:block">Dados neste navegador</p>
        </header>
        <main className="min-h-0 flex-1 overflow-auto px-4 pb-10 md:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
