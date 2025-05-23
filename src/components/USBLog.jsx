import React from 'react';

export default function USBLog({ usbRawLogs }) {
  if (!usbRawLogs.length) return null;
  return (
    <div style={{ margin: '20px 0', background: '#f8f9fa', borderRadius: 6, padding: 12 }}>
      <h2 style={{ color: '#007bff' }}>Log de Datos Crudos Recibidos por USB</h2>
      <ul style={{ listStyleType: 'none', padding: 0 }}>
        {usbRawLogs.map((log, idx) => (
          <li key={idx} style={{ borderBottom: '1px solid #eee', padding: '6px 0', fontSize: '0.95em' }}>
            <strong>[{new Date(log.timestamp).toLocaleTimeString()}]</strong>:
            <div style={{ background: '#e9ecef', borderRadius: 4, padding: 4, fontFamily: 'monospace', marginTop: 2 }}>{log.data}</div>
          </li>
        ))}
      </ul>
    </div>
  );
} 