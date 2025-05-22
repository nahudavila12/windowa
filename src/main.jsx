import React from 'react';
import ReactDOM from 'react-dom/client';
import App from '../app.jsx';
import { parseDinamometroData } from './dinamometro/parser.js';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
); 