import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { StoreProvider } from './data/store'
import { ThemeProvider } from './lib/theme'
import { AssetsPage } from './pages/AssetsPage'
import { AuditPage } from './pages/AuditPage'
import { ComputersPage } from './pages/ComputersPage'
import { DashboardPage } from './pages/DashboardPage'
import { DisposalsPage } from './pages/DisposalsPage'
import { ExtensionsPage } from './pages/ExtensionsPage'
import { PrinterDetailPage } from './pages/PrinterDetailPage'
import { PrintersPage } from './pages/PrintersPage'
import { SettingsPage } from './pages/SettingsPage'

export function App() {
  return (
    <ThemeProvider>
      <StoreProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<Layout />}>
              <Route index element={<DashboardPage />} />
              <Route path="impressoras" element={<PrintersPage />} />
              <Route path="impressoras/:id" element={<PrinterDetailPage />} />
              <Route path="descartes" element={<DisposalsPage />} />
              <Route path="patrimonios" element={<AssetsPage />} />
              <Route path="ramais" element={<ExtensionsPage />} />
              <Route path="computadores" element={<ComputersPage />} />
              <Route path="historico" element={<AuditPage />} />
              <Route path="configuracoes" element={<SettingsPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </StoreProvider>
    </ThemeProvider>
  )
}
