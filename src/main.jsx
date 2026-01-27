import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// 1. Criamos a referência do root separadamente
const root = createRoot(document.getElementById('root'));

// 2. Envolvemos a renderização em um atraso de 2 segundos (2000ms)
setTimeout(() => {
  root.render(
    <StrictMode>
      <App />
    </StrictMode>
  );
}, 2000);

// 3. Registro do Service Worker (Mantido fora do timeout para iniciar logo)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/serviceWorker.js')
      .then(reg => console.log('Service Worker registrado!', reg))
      .catch(err => console.log('Erro ao registrar Service Worker:', err));
  });
}