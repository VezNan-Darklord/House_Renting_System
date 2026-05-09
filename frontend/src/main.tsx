import { createRoot } from 'react-dom/client'
import 'antd/dist/reset.css'
import './global.css'
import { StrictMode } from 'react'
import App from './components/app'


createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
