import { createRoot } from 'react-dom/client'
import 'antd/dist/reset.css'
import './global.css'
import { StrictMode } from 'react'
import App from './app'


createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
