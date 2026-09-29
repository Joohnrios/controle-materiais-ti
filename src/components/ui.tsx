import { Search, X, type LucideIcon } from 'lucide-react'
import { useEffect, useState, type ButtonHTMLAttributes, type ReactNode } from 'react'

export const inputClass =
  'w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink outline-none transition focus:border-accent focus:ring-2 focus:ring-accent-soft'

const buttonStyles = {
  primary: 'bg-accent text-white hover:bg-accent-strong',
  secondary: 'border border-line bg-surface text-ink hover:bg-surface-2',
  danger: 'bg-rose-600 text-white hover:bg-rose-700',
  ghost: 'text-slate-600 hover:bg-slate-100',
}

export function Button({
  variant = 'primary',
  className = '',
  type = 'button',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: keyof typeof buttonStyles }) {
  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${buttonStyles[variant]} ${className}`}
      {...props}
    />
  )
}

export function IconButton({
  label,
  children,
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={`grid h-8 w-8 place-items-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 disabled:opacity-40 ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="text-sm">
      <span className="mb-1.5 block font-medium text-slate-700">{label}</span>
      {children}
    </div>
  )
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <section className={`rounded-xl border border-line bg-surface shadow-sm ${className}`}>{children}</section>
}

const badgeTones = {
  green: 'bg-emerald-50 text-emerald-700',
  amber: 'bg-amber-50 text-amber-700',
  red: 'bg-rose-50 text-rose-700',
  slate: 'bg-slate-100 text-slate-600',
  blue: 'bg-blue-50 text-blue-700',
}

export function Badge({ tone, children }: { tone: keyof typeof badgeTones; children: ReactNode }) {
  return <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${badgeTones[tone]}`}>{children}</span>
}

export function SearchInput({
  value,
  onChange,
  placeholder,
}: {
  value: string
  onChange: (value: string) => void
  placeholder: string
}) {
  return (
    <div className="relative min-w-[220px] flex-1">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className={`${inputClass} pl-10`}
      />
    </div>
  )
}

export function Modal({
  title,
  onClose,
  children,
  size = 'md',
}: {
  title: string
  onClose: () => void
  children: ReactNode
  size?: 'md' | 'lg'
}) {
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 sm:items-center" onMouseDown={onClose}>
      <div
        className={`my-6 w-full rounded-xl border border-line bg-surface shadow-xl ${size === 'lg' ? 'max-w-3xl' : 'max-w-lg'}`}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
          <IconButton label="Fechar" onClick={onClose}>
            <X className="h-4 w-4" />
          </IconButton>
        </div>
        <div className="max-h-[min(70vh,720px)] overflow-y-auto px-5 py-4">{children}</div>
      </div>
    </div>
  )
}

export function FormError({ message }: { message: string }) {
  if (!message) return null
  return <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{message}</p>
}

export function EmptyState({
  icon: Icon,
  title,
  text,
}: {
  icon: LucideIcon
  title: string
  text: string
}) {
  return (
    <div className="flex flex-col items-center px-6 py-16 text-center">
      <span className="mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-slate-100 text-slate-500">
        <Icon className="h-5 w-5" />
      </span>
      <p className="font-medium text-slate-800">{title}</p>
      <p className="mt-1 max-w-md text-sm text-slate-500">{text}</p>
    </div>
  )
}

export function ConfirmDialog({
  title,
  message,
  confirmLabel = 'Excluir',
  onConfirm,
  onClose,
}: {
  title: string
  message: string
  confirmLabel?: string
  onConfirm: () => string | null
  onClose: () => void
}) {
  return (
    <Modal title={title} onClose={onClose}>
      <ConfirmBody message={message} confirmLabel={confirmLabel} onConfirm={onConfirm} onClose={onClose} />
    </Modal>
  )
}

function ConfirmBody({
  message,
  confirmLabel,
  onConfirm,
  onClose,
}: {
  message: string
  confirmLabel: string
  onConfirm: () => string | null
  onClose: () => void
}) {
  const [error, setError] = useState('')
  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault()
        const result = onConfirm()
        if (result) setError(result)
        else onClose()
      }}
    >
      <p className="text-sm leading-6 text-slate-600">{message}</p>
      <FormError message={error} />
      <div className="flex justify-end gap-2">
        <Button variant="secondary" onClick={onClose}>Cancelar</Button>
        <Button variant="danger" type="submit">{confirmLabel}</Button>
      </div>
    </form>
  )
}
