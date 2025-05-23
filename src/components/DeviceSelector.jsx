import React from 'react';

export default function DeviceSelector({
  modoConexion,
  isScanning,
  handleScan,
  handleStopScan,
  devices,
  handleConnect,
  connectedDevice,
  puertosUSB,
  puertoUSBSeleccionado,
  setPuertoUSBSeleccionado,
  handleConectarUSB,
  usbConectado,
  handleDesconectarUSB
}) {
  return (
    <div style={{ marginBottom: 20 }}>
      {modoConexion === 'bluetooth' && !connectedDevice && (
        isScanning ? (
          <button onClick={handleStopScan}>Detener Escaneo</button>
        ) : (
          <button onClick={handleScan}>Escanear Dispositivos</button>
        )
      )}
      {modoConexion === 'bluetooth' && !connectedDevice && (
        <div>
          <h2>Dispositivos Encontrados:</h2>
          <ul>
            {devices.filter(device => (device.name || '').startsWith('Valkyria')).map(device => (
              <li key={device.id} style={{ marginBottom: 8 }}>
                {device.name || 'Desconocido'} (ID: {device.id})
                <button style={{ marginLeft: 10 }} onClick={() => handleConnect(device.id)} disabled={!!connectedDevice}>
                  Conectar
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
      {modoConexion === 'usb' && !usbConectado && (
        <div style={{ marginBottom: 10 }}>
          <label>Puerto USB: </label>
          <select value={puertoUSBSeleccionado} onChange={e => setPuertoUSBSeleccionado(e.target.value)}>
            <option value="">Selecciona un puerto</option>
            {puertosUSB.map(p => (
              <option key={p.path} value={p.path}>{p.path} {p.manufacturer ? `(${p.manufacturer})` : ''}</option>
            ))}
          </select>
          <button onClick={handleConectarUSB} disabled={!puertoUSBSeleccionado}>Conectar USB</button>
        </div>
      )}
      {modoConexion === 'usb' && usbConectado && (
        <div style={{ marginBottom: 10 }}>
          <span style={{ color: 'green', fontWeight: 'bold' }}>USB conectado: {puertoUSBSeleccionado}</span>
          <button onClick={handleDesconectarUSB} style={{ marginLeft: 10 }}>Desconectar USB</button>
        </div>
      )}
    </div>
  );
} 