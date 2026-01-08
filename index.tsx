
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

console.log("🏗️ Cowele SLP: Iniciando Sistema Pro...");

const rootElement = document.getElementById('root');
if (!rootElement) {
  console.error("❌ Error Crítico: No se encontró el elemento #root");
} else {
  const root = createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}
