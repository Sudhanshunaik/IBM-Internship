import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import './styles/tokens.css'
import './styles/app.css'

// Surface unhandled errors so we can see them in dev tools.
if (typeof window !== 'undefined') {
  window.addEventListener('error', (e) => {
    // eslint-disable-next-line no-console
    console.log('[window.error]', e.message, e.filename, e.lineno, e.error?.stack)
  })
  window.addEventListener('unhandledrejection', (e) => {
    // eslint-disable-next-line no-console
    console.log('[unhandledrejection]', e.reason?.message, e.reason?.stack)
  })
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
)