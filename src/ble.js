const noble = require('noble-winrt');
let mainWindow = null;

function setMainWindow(win) {
  mainWindow = win;
}

// Iniciar escaneo BLE
async function startScan() {
  console.log('Iniciando escaneo BLE...');
  noble.on('stateChange', (state) => {
    console.log('Estado del adaptador BLE:', state);
    if (state === 'poweredOn') {
      noble.startScanning([], true);
      console.log('Escaneo iniciado');
    } else {
      noble.stopScanning();
      console.log('Escaneo detenido');
    }
  });

  noble.on('discover', (peripheral) => {
    console.log('Dispositivo encontrado:', peripheral.advertisement.localName, peripheral.id);
    if (peripheral.advertisement && peripheral.advertisement.localName && mainWindow) {
      mainWindow.webContents.send('ble-device-found', {
        id: peripheral.id,
        name: peripheral.advertisement.localName
      });
    }
  });

  if (noble.state === 'poweredOn') {
    noble.startScanning([], true);
    console.log('Escaneo iniciado (adaptador ya encendido)');
  }
  return { success: true };
}

// Detener escaneo BLE
async function stopScan() {
  noble.stopScanning();
  return { success: true };
}

// Conectar a dispositivo BLE
async function connectDevice(event, deviceId) {
  const peripheral = noble._peripherals[deviceId];
  if (!peripheral) return { success: false, error: 'Dispositivo no encontrado' };

  console.log(`Intentando conectar a: ${peripheral.id}`);

  peripheral.connect((err) => {
    if (err) {
      console.error(`Error al conectar a ${deviceId}:`, err);
      if (mainWindow) mainWindow.webContents.send('ble-device-disconnected', deviceId);
      return;
    }
    console.log(`Conectado a ${deviceId}`);
    noble.stopScanning();
    console.log('Escaneo detenido automáticamente después de la conexión.');

    if (mainWindow) mainWindow.webContents.send('ble-device-connected', {
      id: deviceId,
      name: peripheral.advertisement.localName
    });

    peripheral.discoverAllServicesAndCharacteristics((err, services, characteristics) => {
      if (err) {
        console.error(`Error al descubrir servicios/características para ${deviceId}:`, err);
        return;
      }

      console.log(`Servicios y características descubiertos para ${deviceId}`);

      characteristics.forEach((char) => {
        console.log('  Característica UUID:', char.uuid, 'Propiedades:', char.properties.join(', '));

        if (char.properties.includes('notify') || char.properties.includes('indicate')) {
          console.log(`  Suscribiendo a característica: ${char.uuid}`);
          char.subscribe((err) => {
            if (err) {
              console.error(`Error al suscribir a ${char.uuid} para ${deviceId}:`, err);
            } else {
              console.log(`  Suscrito exitosamente a: ${char.uuid}`);
            }
          });

          char.on('data', (data, isNotification) => {
            const rawDataString = data.toString('hex');
            console.log(`Datos recibidos de ${char.uuid} (${isNotification ? 'notificación' : 'indicación'}): ${rawDataString}`);
            if (mainWindow) mainWindow.webContents.send('ble-raw-data-update', {
              deviceId: peripheral.id,
              characteristicId: char.uuid,
              data: rawDataString,
              timestamp: new Date().toLocaleTimeString()
            });

            // Lógica específica para Heart Rate (si es la característica de HR)
            if (char.uuid === '2a37') { // UUID de Heart Rate Measurement
              let hr = 0;
              if (data.length > 1) {
                if ((data[0] & 0x01) === 0) {
                  hr = data[1];
                } else {
                  if (data.length >= 3) {
                    hr = data.readUInt16LE(1);
                  } else {
                    console.warn("Datos de HR en formato UINT16 pero longitud insuficiente.");
                  }
                }
              } else if (data.length === 1) {
                hr = data[0];
              }
              if (hr > 0 && mainWindow) {
                mainWindow.webContents.send('ble-hr-update', hr);
              }
            }
          });
        }
      });
    });
  });
  return { success: true };
}

// Desconectar dispositivo BLE
async function disconnectDevice(event, deviceId) {
  const peripheral = noble._peripherals[deviceId];
  if (peripheral) {
    peripheral.disconnect();
  }
  return { success: true };
}

module.exports = {
  setMainWindow,
  startScan,
  stopScan,
  connectDevice,
  disconnectDevice
}; 