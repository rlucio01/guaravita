
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

console.log('Guaravita Ledger booting...');

window.onerror = function (msg, url, line, col, error) {
  alert("Erro: " + msg + "\nLinha: " + line);
  return false;
};

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
