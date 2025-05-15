import React from 'react';
import ReactDOM from 'react-dom/client';
import App from '../app.jsx';
import { parseDinamometroData } from './dinamometro/parser.js';

// Ejemplo de uso del parser (puedes borrar esto luego)
const ejemploDatosHex = [
  "302e30", "0d0a", "2d302e30", "0d0a", "312e32", "0d0a", "322e37", "0d0a"
];
console.log('Ejemplo parseo dinamómetro:', parseDinamometroData(ejemploDatosHex));

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
); 