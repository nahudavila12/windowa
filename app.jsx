import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { parseDinamometroData, parseDinamometroHexString } from './src/dinamometro/parser.js';
import { parseBalanceHexString } from './src/balance/parser.js';
import { parseLibreHexString } from './src/libre/parser.js';

// Estilos para el modal y su contenido
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

function exportTestsToCSV(tests) {
  if (!tests.length) return;
  const header = 'Test,Número,Valor,Nombre/Nota\n';
  let rows = '';
  tests.forEach((test, idx) => {
    test.valores.forEach((valor, i) => {
      rows += `${idx + 1},${i + 1},${valor},"${test.nombre || ''}"\n`;
    });
  });
  const csvContent = header + rows;
  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'tests_dinamometro.csv';
  a.click();
  URL.revokeObjectURL(url);
}

const parseadores = {
  'Valkyria Dynamometer': data => {
    if (Array.isArray(data)) return parseDinamometroData(data);
    if (typeof data === 'string') return parseDinamometroHexString(data);
    return [];
  },
  'Valkyria Platform': data => {
    if (typeof data === 'string') return parseBalanceHexString(data);
    return [];
  },
  'Valkyria Free Charge 5': data => {
    if (typeof data === 'string') return parseLibreHexString(data);
    return [];
  }
};

export default function App() {
  const [status, setStatus] = useState('Esperando acciones...');
  const [devices, setDevices] = useState([]);
  const [connectedDevice, setConnectedDevice] = useState(null);
  const [heartRate, setHeartRate] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [hrHistory, setHrHistory] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [rawDataLogs, setRawDataLogs] = useState([]);
  const [tests, setTests] = useState([]);
  const [currentTest, setCurrentTest] = useState([]);
  const [isTestRunning, setIsTestRunning] = useState(false);
  const [nombreTest, setNombreTest] = useState('');
  const [showNombreModal, setShowNombreModal] = useState(false);
  const [tipoDispositivo, setTipoDispositivo] = useState('Valkyria Dynamometer'); // 'Valkyria Dynamometer', 'Valkyria Platform' o 'Valkyria Free Charge 5'

  useEffect(() => {
    // Suscribirse a eventos de electronAPI
    const removeDeviceFound = window.electronAPI.onDeviceFound(device => {
      setDevices(prev => prev.find(d => d.id === device.id) ? prev : [...prev, device]);
    });
    const removeDeviceConnected = window.electronAPI.onDeviceConnected(device => {
      setConnectedDevice(device);
      setStatus(`Conectado a: ${device.name || device.id}`);
      setIsScanning(false);
      setHeartRate(null);
      setHrHistory([]);
      setRawDataLogs([]);
    });
    const removeDeviceDisconnected = window.electronAPI.onDeviceDisconnected(deviceId => {
      if (connectedDevice && connectedDevice.id === deviceId) {
        setConnectedDevice(null);
        setStatus('Dispositivo desconectado.');
        setHeartRate(null);
        setHrHistory([]);
      }
    });
    const removeHeartRate = window.electronAPI.onHeartRateUpdate(hr => {
      setHeartRate(hr);
      setHrHistory(prev => {
        const newHistory = [...prev, { time: prev.length + 1, hr }];
        if (newHistory.length > 50) {
          return newHistory.slice(newHistory.length - 50);
        }
        return newHistory;
      });
    });

    const removeRawData = window.electronAPI.onRawDataUpdate(logEntry => {
      const parser = parseadores[tipoDispositivo] || (() => []);
      const valoresParseados = parser(logEntry.data);
      if (isTestRunning && valoresParseados.length > 0) {
        setCurrentTest(prev => [...prev, ...valoresParseados]);
      }
      setRawDataLogs(prev => [
        { ...logEntry, valoresParseados },
        ...prev.slice(0, 199)
      ]);
    });

    return () => {
      removeDeviceFound();
      removeDeviceConnected();
      removeDeviceDisconnected();
      removeHeartRate();
      removeRawData();
    };
  }, [connectedDevice, isTestRunning, tipoDispositivo]);

  const handleScan = async () => {
    setStatus('Iniciando escaneo...');
    setDevices([]);
    setIsScanning(true);
    setRawDataLogs([]);
    try {
      await window.electronAPI.startScan();
      setStatus('Escaneando...');
    } catch (error) {
      setStatus(`Error al escanear: ${error.message}`);
      setIsScanning(false);
    }
  };

  const handleStopScan = async () => {
    setStatus('Deteniendo escaneo...');
    try {
      await window.electronAPI.stopScan();
      setStatus('Escaneo detenido.');
    } catch (error) {
      setStatus(`Error al detener: ${error.message}`);
    }
    setIsScanning(false);
  };

  const handleConnect = async (deviceId) => {
    setStatus(`Conectando a ${deviceId}...`);
    try {
      await window.electronAPI.connectToDevice(deviceId);
    } catch (error) {
      setStatus(`Error al conectar: ${error.message}`);
    }
  };

  const handleDisconnect = async () => {
    if (connectedDevice) {
      await window.electronAPI.bleDisconnectDevice(connectedDevice.id);
      setConnectedDevice(null);
      setStatus('Dispositivo desconectado.');
      setHeartRate(null);
      setHrHistory([]);
    }
  };

  const handleStartTest = () => {
    setCurrentTest([]);
    setIsTestRunning(true);
    setStatus('Test iniciado');
  };

  const handleEndTest = () => {
    setIsTestRunning(false);
    setShowNombreModal(true);
  };

  const handleGuardarTest = () => {
    if (currentTest.length > 0) {
      setTests(prev => [...prev, { valores: currentTest, nombre: nombreTest, tipo: tipoDispositivo }]);
    }
    setCurrentTest([]);
    setNombreTest('');
    setShowNombreModal(false);
    setStatus('Test finalizado');
  };

  return (
    <div style={{ fontFamily: 'sans-serif', margin: 20 }}>
      <h1>Monitor BLE y Dispositivos Ivolution</h1>
      <div style={{ marginBottom: 15, padding: 10, background: '#e9ecef', borderRadius: 4 }}>{status}</div>
      <div style={{ marginBottom: 10 }}>
        <label>Tipo de dispositivo: </label>
        <select value={tipoDispositivo} onChange={e => setTipoDispositivo(e.target.value)}>
          <option value="Valkyria Dynamometer">Valkyria Dynamometer</option>
          <option value="Valkyria Platform">Valkyria Platform</option>
          <option value="Valkyria Free Charge 5">Valkyria Free Charge 5</option>
        </select>
      </div>
      {!connectedDevice && (
        isScanning ? (
          <button onClick={handleStopScan}>Detener Escaneo</button>
        ) : (
          <button onClick={handleScan}>Escanear Dispositivos</button>
        )
      )}
      {!connectedDevice && (
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
      {connectedDevice && (
        <div>
          <h2>Información del Dispositivo Conectado:</h2>
          <div>Conectado a: {connectedDevice.name || connectedDevice.id}</div>
          <div style={{ fontWeight: 'bold', color: '#007bff', marginTop: 10 }}>
            Fuerza: {heartRate === null ? 'Esperando datos...' : `${heartRate} BPM`}
          </div>
          {hrHistory.length > 1 && (
            <div style={{ marginTop: 30 }}>
              <h3>Historial </h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={hrHistory} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" label={{ value: 'Muestra', position: 'insideBottomRight', offset: 0 }} />
                  <YAxis label={{ value: 'BPM', angle: -90, position: 'insideLeft' }} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="hr" stroke="#8884d8" activeDot={{ r: 8 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
          <button onClick={handleDisconnect}>Desconectar</button>
          <button onClick={() => setShowModal(true)}>Ver datos recibidos</button>
          <button onClick={handleStartTest} disabled={isTestRunning}>Iniciar test</button>
          <button onClick={handleEndTest} disabled={!isTestRunning}>Finalizar test</button>
          <div>
            <h3>Tests realizados: {tests.length}</h3>
            <button onClick={() => exportTestsToCSV(tests)} disabled={!tests.length}>Exportar tests a CSV</button>
            {tests.map((test, idx) => (
              <div key={idx} style={{marginBottom: 10}}>
                <strong>Test #{idx + 1} ({test.tipo || 'dinamometro'}):</strong>
                {test.tipo === 'Valkyria Platform' ? (
                  <>
                    <br/>
                    <em>Canal 1:</em> {test.valores.map((v, i) => v.fuerza1?.toFixed(2)).join(', ')}<br/>
                    <em>Canal 2:</em> {test.valores.map((v, i) => v.fuerza2?.toFixed(2)).join(', ')}<br/>
                  </>
                ) : test.tipo === 'Valkyria Free Charge 5' ? (
                  <>
                    <em>Distancias:</em> {test.valores.map((v, i) => v?.toFixed(2)).join(', ')}<br/>
                  </>
                ) : test.tipo === 'Valkyria Dynamometer' ? (
                  <>
                    <em>Fuerzas:</em> {test.valores.map((v, i) => v?.toFixed ? v.toFixed(2) : v).join(', ')}<br/>
                  </>
                ) : (
                  <>
                    {test.valores.join(', ')}<br/>
                  </>
                )}
                <em>Nombre/Nota:</em> {test.nombre || '(sin nombre)'}
                <ResponsiveContainer width="100%" height={120}>
                  <LineChart data={
                    test.tipo === 'Valkyria Platform'
                      ? test.valores.map((v, i) => ({ muestra: i + 1, fuerza1: v.fuerza1, fuerza2: v.fuerza2 }))
                      : test.tipo === 'Valkyria Free Charge 5'
                        ? test.valores.map((v, i) => ({ muestra: i + 1, distancia: v }))
                        : test.tipo === 'Valkyria Dynamometer'
                          ? test.valores.map((v, i) => ({ muestra: i + 1, valor: v }))
                          : test.valores.map((v, i) => ({ muestra: i + 1, valor: v }))
                  }>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="muestra" label={{ value: 'Muestra', position: 'insideBottomRight', offset: 0 }} />
                    <YAxis label={{ value: test.tipo === 'Valkyria Free Charge 5' ? 'Distancia' : (test.tipo === 'Valkyria Platform' ? 'Fuerza' : 'Valor'), angle: -90, position: 'insideLeft' }} />
                    <Tooltip />
                    <Legend />
                    {test.tipo === 'Valkyria Platform' ? (
                      <>
                        <Line type="monotone" dataKey="fuerza1" stroke="#82ca9d" name="Canal 1" />
                        <Line type="monotone" dataKey="fuerza2" stroke="#8884d8" name="Canal 2" />
                      </>
                    ) : test.tipo === 'Valkyria Free Charge 5' ? (
                      <Line type="monotone" dataKey="distancia" stroke="#ff7300" name="Distancia" />
                    ) : (
                      <Line type="monotone" dataKey="valor" stroke="#82ca9d" />
                    )}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ))}
          </div>
        </div>
      )}
      {showModal && (
        <>
          <div style={overlayStyles} onClick={() => setShowModal(false)} />
          <div style={modalStyles}>
            <h2>Log de Datos Crudos Recibidos</h2>
            {rawDataLogs.length === 0 ? <p>No se han recibido datos crudos aún.</p> : (
              <ul style={{ listStyleType: 'none', padding: 0}}>
                {rawDataLogs.map((log, idx) => (
                  <li key={idx} style={listItemStyles}>
                    <strong>[{log.timestamp}]</strong> de {log.characteristicId}:
                    <div style={codeBlockStyles}>{log.data}</div>
                    {log.valoresParseados && log.valoresParseados.length > 0 && (
                      <div style={{marginTop: 4, color: '#007bff'}}>
                        <strong>Parseado:</strong> {Array.isArray(log.valoresParseados) && log.valoresParseados[0] && log.valoresParseados[0].fuerza1 !== undefined
                          ? log.valoresParseados.map((v, i) => `(${v.fuerza1?.toFixed(2)}, ${v.fuerza2?.toFixed(2)})`).join(', ')
                          : Array.isArray(log.valoresParseados) && typeof log.valoresParseados[0] === 'number'
                            ? log.valoresParseados.map((v, i) => v?.toFixed(2)).join(', ')
                            : log.valoresParseados.join(', ')}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
            <button onClick={() => setShowModal(false)} style={{marginTop: '15px'}}>Cerrar</button>
          </div>
        </>
      )}
      {showNombreModal && (
        <>
          <div style={overlayStyles} onClick={() => setShowNombreModal(false)} />
          <div style={modalStyles}>
            <h2>Guardar Test</h2>
            <label>Nombre o nota para el test:</label>
            <input
              type="text"
              value={nombreTest}
              onChange={e => setNombreTest(e.target.value)}
              style={{width: '100%', margin: '10px 0', padding: 8, fontSize: 16}}
              placeholder="Ej: Test de bíceps, paciente Juan"
            />
            <button onClick={handleGuardarTest} style={{marginRight: 10}}>Guardar</button>
            <button onClick={() => setShowNombreModal(false)}>Cancelar</button>
          </div>
        </>
      )}
    </div>
  );
}
