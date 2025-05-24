import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { parseDinamometroData, parseDinamometroHexString } from './src/dinamometro/parser.js';
import { parseBalanceHexString } from './src/balance/parser.js';
import { parseLibreString } from './src/libre/parser.js';
import { parse1kHzHexString } from './src/balance/parser_1khz.js';
import DeviceSelector from './src/components/DeviceSelector.jsx';
import RawDataLog from './src/components/RawDataLog.jsx';
import TestList from './src/components/TestList.jsx';
import USBLog from './src/components/USBLog.jsx';

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
  let header = '';
  let rows = '';
  tests.forEach((test, idx) => {
    if (test.tipo === 'Valkyria Dynamometer') {
      header = 'Test,Número,Fuerza,Timestamp,Nombre/Nota\n';
      test.valores.forEach((valor, i) => {
        if (valor && typeof valor === 'object') {
          rows += `${idx + 1},${i + 1},${valor.valor !== undefined ? valor.valor : ''},${valor.timestamp !== undefined ? valor.timestamp : ''},"${test.nombre || ''}"\n`;
        }
      });
    } else if (test.tipo === 'Valkyria Platform') {
      header = 'Test,Número,Fuerza1,Fuerza2,Timestamp,Nombre/Nota\n';
      test.valores.forEach((valor, i) => {
        if (valor && typeof valor === 'object') {
          rows += `${idx + 1},${i + 1},${valor.fuerza1 !== undefined ? valor.fuerza1 : ''},${valor.fuerza2 !== undefined ? valor.fuerza2 : ''},${valor.timestamp !== undefined ? valor.timestamp : ''},"${test.nombre || ''}"\n`;
        }
      });
    } else if (test.tipo === 'Valkyria Free Charge 5') {
      header = 'Test,Número,Distancia,Timestamp,Nombre/Nota\n';
      test.valores.forEach((valor, i) => {
        if (valor && typeof valor === 'object') {
          rows += `${idx + 1},${i + 1},${valor.valor !== undefined ? valor.valor : ''},${valor.timestamp !== undefined ? valor.timestamp : ''},"${test.nombre || ''}"\n`;
        }
      });
    }
  });
  const csvContent = header + rows;
  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'tests_ivolution.csv';
  a.click();
  URL.revokeObjectURL(url);
}

const parseadores = {
  'Valkyria Dynamometer': data => {
    console.log('[PARSEADOR] Tipo: Dynamometer, Data:', data);
    if (Array.isArray(data)) return parseDinamometroData(data);
    if (typeof data === 'string') return parseDinamometroHexString(data);
    return [];
  },
  'Valkyria Platform': data => {
    console.log('[PARSEADOR] Tipo: Platform , Data:', data);
    if (typeof data === 'string') return parseBalanceHexString(data);
    return [];
  },
  'Valkyria Free Charge 5': data => {
    console.log('[PARSEADOR] Tipo: Free Charge 5, Data:', data);
    if (typeof data === 'string') return parseLibreString(data);
    return [];
  }
};

// FUNCIONES PARA FILTRAR VALORES PLANOS AL FINAL
function filtrarPlanosAlFinal(arr, key = 'valor', N = 10) {
  if (!arr.length) return arr;
  let count = 1;
  let i = arr.length - 1;
  while (i > 0 && count < N + 1) {
    if (arr[i][key] === arr[i - 1][key]) {
      count++;
      i--;
    } else {
      break;
    }
  }
  if (count > N) {
    return arr.slice(0, arr.length - count + N);
  }
  return arr;
}

function filtrarPlanosAlFinalPlataforma(arr, N = 10) {
  if (!arr.length) return arr;
  let count = 1;
  let i = arr.length - 1;
  while (
    i > 0 &&
    count < N + 1 &&
    arr[i].fuerza1 === arr[i - 1].fuerza1 &&
    arr[i].fuerza2 === arr[i - 1].fuerza2
  ) {
    count++;
    i--;
  }
  if (count > N) {
    return arr.slice(0, arr.length - count + N);
  }
  return arr;
}

// Función para mapear idMachine a nombre de dispositivo
function getNombreDispositivo(id) {
  switch (id) {
    case '10':
      return 'Valkyria Dynamometer';
    case '11':
      return 'Valkyria Free Charge 5';
    case '12':
      return 'Valkyria Platform';
    default:
      return 'Desconocido';
  }
}

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
  const [modoConexion, setModoConexion] = useState('bluetooth'); // 'bluetooth' o 'usb'
  const [puertosUSB, setPuertosUSB] = useState([]);
  const [puertoUSBSeleccionado, setPuertoUSBSeleccionado] = useState('');
  const [usbConectado, setUSBConectado] = useState(false);
  const [idMachine, setIdMachine] = useState('');
  const [usbRawLogs, setUsbRawLogs] = useState([]);
  const [usbError, setUsbError] = useState(null);

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
      console.log('[FRONT] Datos crudos:', logEntry.data);
      console.log('[FRONT] Valores parseados:', valoresParseados);
      if (isTestRunning && valoresParseados.length > 0) {
        console.log('[FRONT] Agregando a currentTest:', valoresParseados);
        setCurrentTest(prev => [...prev, ...valoresParseados]);
      }
      setRawDataLogs(prev => [
        { ...logEntry, valoresParseados },
        ...prev.slice(0, 199)
      ]);
    });

    if (modoConexion === 'usb') {
      setConnectedDevice(null);
      setIsScanning(false);
      setHeartRate(null);
      setHrHistory([]);
      setRawDataLogs([]);
      setUSBConectado(false);
      setPuertoUSBSeleccionado('');
      setUsbError(null);
      window.electronAPI.listarPuertosUSB()
        .then(puertos => {
          console.log('Puertos USB detectados:', puertos);
          setPuertosUSB(puertos);
          if (!puertos || puertos.length === 0) {
            setUsbError('No se detectaron puertos USB.');
          }
        })
        .catch(err => {
          console.error('Error al listar puertos USB:', err);
          setUsbError('Error al listar puertos USB: ' + err.message);
          setPuertosUSB([]);
        });
      const removeUSB = window.electronAPI.onUSBDatosCrudos(({ raw, parsed, timestamp }) => {
        console.log('[FRONT][USB] Datos crudos:', raw);
        console.log('[FRONT][USB] Valores parseados:', parsed);
        if (isTestRunning && parsed && parsed.length > 0) {
          console.log('[FRONT][USB] Agregando a currentTest:', parsed);
          setCurrentTest(prev => [...prev, ...parsed]);
        }
        setRawDataLogs(prev => [
          { timestamp, characteristicId: 'USB', data: raw, valoresParseados: parsed },
          ...prev.slice(0, 199)
        ]);
        setUsbRawLogs(prev => [
          { timestamp, data: raw },
          ...prev.slice(0, 199)
        ]);
      });
      return () => {
        removeDeviceFound();
        removeDeviceConnected();
        removeDeviceDisconnected();
        removeHeartRate();
        removeRawData();
        removeUSB();
      };
    }

    if (modoConexion === 'bluetooth') {
      setUSBConectado(false);
      setPuertoUSBSeleccionado('');
      setUsbError(null);
    }

    // Obtener el idMachine generado automáticamente desde el backend al iniciar
    window.electronAPI.getIdMachine && window.electronAPI.getIdMachine().then(setIdMachine);
  }, [connectedDevice, isTestRunning, tipoDispositivo, modoConexion]);

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
    let valoresFiltrados = currentTest;
    if (tipoDispositivo === 'Valkyria Dynamometer' || tipoDispositivo === 'Valkyria Free Charge 5') {
      valoresFiltrados = filtrarPlanosAlFinal(currentTest, 'valor', 10);
    } else if (tipoDispositivo === 'Valkyria Platform') {
      valoresFiltrados = filtrarPlanosAlFinalPlataforma(currentTest, 10);
    }
    if (valoresFiltrados.length > 0) {
      setTests(prev => [...prev, { valores: valoresFiltrados, nombre: nombreTest, tipo: tipoDispositivo }]);
    }
    setCurrentTest([]);
    setNombreTest('');
    setShowNombreModal(false);
    setStatus('Test finalizado');
  };

  const handleConectarUSB = async () => {
    if (!puertoUSBSeleccionado) return;
    await window.electronAPI.abrirPuertoUSB(puertoUSBSeleccionado, 115200);
    setUSBConectado(true);
    setStatus(`Conectado por USB a ${puertoUSBSeleccionado}`);
    setRawDataLogs([]);
  };

  const handleDesconectarUSB = async () => {
    await window.electronAPI.cerrarPuertoUSB();
    setUSBConectado(false);
    setStatus('USB desconectado.');
  };

  const handleIdMachineChange = async (e) => {
    const newId = e.target.value;
    setIdMachine(newId);
    await window.electronAPI.setIdMachine(newId);
  };

  const handleTipoDispositivoChange = async (e) => {
    const tipo = e.target.value;
    setTipoDispositivo(tipo);
    await window.electronAPI.setUsbTipoDispositivo(tipo);
  };

  return (
    <div style={{ fontFamily: 'sans-serif', margin: 20 }}>
      <h1>Monitor BLE y Dispositivos Ivolution</h1>
      <div style={{ marginBottom: 15, padding: 10, background: '#e9ecef', borderRadius: 4 }}>{status}</div>
      {modoConexion === 'usb' && idMachine && (
        <div style={{ marginBottom: 10, fontWeight: 'bold', color: '#28a745' }}>
          Dispositivo USB conectado: {getNombreDispositivo(idMachine)} (ID: {idMachine})
        </div>
      )}
      <div style={{ marginBottom: 10 }}>
        <label>Tipo de dispositivo: </label>
        <select value={tipoDispositivo} onChange={handleTipoDispositivoChange}>
          <option value="Valkyria Dynamometer">Valkyria Dynamometer</option>
          <option value="Valkyria Platform">Valkyria Platform</option>
          <option value="Valkyria Free Charge 5">Valkyria Free Charge 5</option>
        </select>
      </div>
      <div style={{ marginBottom: 10 }}>
        <label>Modo de conexión: </label>
        <select value={modoConexion} onChange={e => setModoConexion(e.target.value)}>
          <option value="bluetooth">Bluetooth</option>
          <option value="usb">USB</option>
        </select>
      </div>
      {/* DeviceSelector para Bluetooth */}
      {modoConexion === 'bluetooth' && (
        <DeviceSelector
          modoConexion={modoConexion}
          isScanning={isScanning}
          handleScan={handleScan}
          handleStopScan={handleStopScan}
          devices={devices}
          handleConnect={handleConnect}
          connectedDevice={connectedDevice}
          puertosUSB={puertosUSB}
          puertoUSBSeleccionado={puertoUSBSeleccionado}
          setPuertoUSBSeleccionado={setPuertoUSBSeleccionado}
          handleConectarUSB={handleConectarUSB}
          usbConectado={usbConectado}
          handleDesconectarUSB={handleDesconectarUSB}
        />
      )}
      {/* DeviceSelector o mensaje para USB */}
      {modoConexion === 'usb' && (
        usbError ? (
          <div style={{ color: 'red', marginBottom: 20, fontWeight: 'bold' }}>
            {usbError}
          </div>
        ) : puertosUSB.length > 0 ? (
          <DeviceSelector
            modoConexion={modoConexion}
            isScanning={isScanning}
            handleScan={handleScan}
            handleStopScan={handleStopScan}
            devices={devices}
            handleConnect={handleConnect}
            connectedDevice={connectedDevice}
            puertosUSB={puertosUSB}
            puertoUSBSeleccionado={puertoUSBSeleccionado}
            setPuertoUSBSeleccionado={setPuertoUSBSeleccionado}
            handleConectarUSB={handleConectarUSB}
            usbConectado={usbConectado}
            handleDesconectarUSB={handleDesconectarUSB}
          />
        ) : (
          <div style={{ color: 'red', marginBottom: 20, fontWeight: 'bold' }}>
            Se debe conectar un USB
            <br />
            <span style={{ fontSize: '0.9em', color: '#555' }}>puertosUSB: {JSON.stringify(puertosUSB)}</span>
          </div>
        )
      )}
      {/* Botones de test para USB */}
      {modoConexion === 'usb' && usbConectado && (
        <div style={{ margin: '20px 0', padding: 10, background: '#f8f9fa', borderRadius: 4 }}>
          <h3>Test por USB</h3>
          <button onClick={handleStartTest} disabled={isTestRunning} style={{marginRight: 10}}>Iniciar test</button>
          <button onClick={handleEndTest} disabled={!isTestRunning}>Finalizar test</button>
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
          {/* Gráfico de distancia procesada solo para Free Charge por Bluetooth */}
          {idMachine === '11' && rawDataLogs.length > 0 && (
            <div style={{ marginTop: 30 }}>
              <h3>Distancia procesada (Free Charge)</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart
                  data={
                    (rawDataLogs.find(log => Array.isArray(log.valoresParseados) && log.valoresParseados.length > 0)?.valoresParseados || [])
                      .map((dist, idx) => ({ muestra: idx + 1, distancia: dist }))
                  }
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="muestra" label={{ value: 'Muestra', position: 'insideBottomRight', offset: 0 }} />
                  <YAxis label={{ value: 'Distancia (m)', angle: -90, position: 'insideLeft' }} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="distancia" stroke="#28a745" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
          <button onClick={handleDisconnect}>Desconectar</button>
          <button onClick={() => setShowModal(true)}>Ver datos recibidos</button>
          <button onClick={handleStartTest} disabled={isTestRunning}>Iniciar test</button>
          <button onClick={handleEndTest} disabled={!isTestRunning}>Finalizar test</button>
          <TestList tests={tests} exportTestsToCSV={exportTestsToCSV} />
        </div>
      )}
      <RawDataLog show={showModal} onClose={() => setShowModal(false)} rawDataLogs={rawDataLogs} />
      <USBLog usbRawLogs={usbRawLogs} />
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
      <div style={{ marginBottom: 10 }}>
        <label>ID de máquina (auto): </label>
        <input type="text" value={idMachine} disabled style={{ width: 260, marginLeft: 8 }} />
      </div>
    </div>
  );
}
