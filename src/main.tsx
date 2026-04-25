import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import 'normalize.css'
import './index.scss'


createRoot(document.getElementById('root')!).render(
    <App />
)
