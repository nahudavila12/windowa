import React from 'react';

const modalStyles = {
  position: 'fixed',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  backgroundColor: 'white',
  padding: '20px',
  borderRadius: '8px',
  boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
  zIndex: 1000,
  width: '80%',
  maxWidth: '600px',
  maxHeight: '70vh',
  overflowY: 'auto'
};

const overlayStyles = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0,0,0,0.5)',
  zIndex: 999
};

const listItemStyles = {
  borderBottom: '1px solid #eee',
  padding: '8px 0',
  fontSize: '0.9em'
};

const codeBlockStyles = {
  backgroundColor: '#f5f5f5',
  padding: '5px',
  borderRadius: '4px',
  fontFamily: 'monospace',
  wordBreak: 'break-all'
};

export default function RawDataLog({ show, onClose, rawDataLogs }) {
  if (!show) return null;
  return (
    <>
      <div style={overlayStyles} onClick={onClose} />
      <div style={modalStyles}>
        <h2>Log de Datos Crudos Recibidos</h2>
        {rawDataLogs.length === 0 ? <p>No se han recibido datos crudos aún.</p> : (
          <ul style={{ listStyleType: 'none', padding: 0}}>
            {rawDataLogs.map((log, idx) => (
              <li key={idx} style={listItemStyles}>
                <strong>[{log.timestamp}]</strong> de {log.characteristicId}:
                <div style={codeBlockStyles}><strong>Crudo:</strong> {log.data}</div>
                {log.valoresParseados && log.valoresParseados.length > 0 && (
                  <div style={{marginTop: 4, color: '#007bff'}}>
                    <strong>Parseado:</strong> {
                      Array.isArray(log.valoresParseados) && log.valoresParseados[0] && typeof log.valoresParseados[0] === 'object'
                        ? log.valoresParseados.map((v, i) => {
                            if (v.fuerza1 !== undefined && v.fuerza2 !== undefined) {
                              return `(${v.fuerza1?.toFixed(2)}, ${v.fuerza2?.toFixed(2)}) t:${v.timestamp}`;
                            } else if (v.valor !== undefined) {
                              return `${v.valor?.toFixed(2)} t:${v.timestamp}`;
                            } else {
                              return JSON.stringify(v);
                            }
                          }).join(', ')
                        : Array.isArray(log.valoresParseados) && typeof log.valoresParseados[0] === 'number'
                          ? log.valoresParseados.map((v, i) => v?.toFixed(2)).join(', ')
                          : log.valoresParseados.join(', ')
                    }
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
        <button onClick={onClose} style={{marginTop: '15px'}}>Cerrar</button>
      </div>
    </>
  );
} 