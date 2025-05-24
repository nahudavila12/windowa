const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const noble = require('noble-winrt');
const usb = require('./src/usb/usb');
const ble = require('./src/ble');

let mainWindow;
let usbPort = null;
let usbParser = null;
let idMachine = '9'; // Valor configurable, puedes cambiarlo desde la UI si lo deseas
let contador = 0;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 700,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      enableRemoteModule: false,
      nodeIntegration: false
    }
  });

  mainWindow.loadFile('dist/index.html');
  // mainWindow.webContents.openDevTools();

  // Pasar la referencia de mainWindow al módulo BLE
  ble.setMainWindow(mainWindow);
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Escaneo BLE real
ipcMain.handle('ble-start-scan', ble.startScan);
ipcMain.handle('ble-stop-scan', ble.stopScan);
ipcMain.handle('ble-connect-device', ble.connectDevice);
ipcMain.handle('ble-disconnect-device', ble.disconnectDevice);

// Listar puertos serie disponibles
ipcMain.handle('listar-puertos-usb', async () => {
  const ports = await require('serialport').SerialPort.list();
  return ports.map(p => ({ path: p.path, manufacturer: p.manufacturer }));
});

// Cambiar tipo de dispositivo USB
ipcMain.handle('set-usb-tipo-dispositivo', async (event, tipo) => {
  usb.setTipoDispositivo(tipo);
  return true;
});

// Cambiar idMachine USB
ipcMain.handle('set-id-machine', async (event, newId) => {
  usb.setIdMachine(newId);
  return true;
});

// Abrir puerto USB
ipcMain.handle('abrir-puerto-usb', async (event, path, baudRate = 115200) => {
  usb.setOnDataCallback((raw, parsed) => {
    // Mostrar siempre los datos crudos
    console.log('[USB][CRUDO]', raw);
    // Mostrar los datos parseados solo si el tipo es encoder
    if (usb.idMachine && usb.tipoDispositivo === 'Valkyria Free Charge 5') {
      console.log('[USB][PARSEADO]', parsed);
    }
    mainWindow.webContents.send('usb-datos-crudos', { raw, parsed, timestamp: Date.now() });
  });
  await usb.abrirPuertoUSB(path, baudRate);
  return true;
});

// Cerrar puerto USB
ipcMain.handle('cerrar-puerto-usb', async () => {
  usb.cerrarPuertoUSB();
  return true;
});

ipcMain.handle('get-id-machine', async () => {
  const usb = require('./src/usb/usb');
  return usb.idMachine || '';
});