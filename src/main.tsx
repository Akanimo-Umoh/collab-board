import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { BrowserRouter } from 'react-router-dom'
import { startRealtime } from './realtime/startRealtime.ts'
import { ToastViewport } from './components/ui/ToastViewport.tsx'
import { ErrorBoundary } from './components/ErrorBoundary.tsx'
import { RootErrorFallback } from './components/RootErrorFallback.tsx'

startRealtime()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary fallback={() => <RootErrorFallback />}>
      <BrowserRouter>
        <App />
        <ToastViewport />
      </BrowserRouter>
    </ErrorBoundary>
  </StrictMode>,
)
