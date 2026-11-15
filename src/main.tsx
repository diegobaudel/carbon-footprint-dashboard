import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/palette.css'
import './index.css'
import App from './App.tsx'
import { FiltrosProvider } from './context/FiltrosProvider.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <FiltrosProvider>
      <App />
    </FiltrosProvider>
  </StrictMode>,
)
