// Módulo centralizado para manejo de USB en Node.js/Electron
const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');
const { parseLibreString } = require('../libre/parser');
const { parseDinamometroHexString } = require('../dinamometro/parser');
const { parseBalanceHexString } = require('../balance/parser');
const { parse1kHzHexString } = require('../balance/parser_1khz');
const { v4: uuidv4 } = require('uuid');

let usbPort = null;
let usbParser = null;
let tipoDispositivo = 'Valkyria Free Charge 5'; // Valor por defecto
let idMachine = 1; 
let contador = 0;
let onDataCallback = null;

function setTipoDispositivo(tipo) {
  tipoDispositivo = tipo;
}

function setIdMachine(id) {
  idMachine = Number(id);
}

function setOnDataCallback(cb) {
  onDataCallback = cb;
}

function abrirPuertoUSB(path, baudRate = 115200) {
  return new Promise((resolve, reject) => {
    if (usbPort) {
      usbPort.close();
      usbPort = null;
      usbParser = null;
    }
    usbPort = new SerialPort({ path, baudRate }, (err) => {
      if (err) return reject(err);
      // Selección dinámica de parser según tipo de dispositivo
      if (tipoDispositivo === 'Valkyria Free Charge 5') {
        usbParser = usbPort.pipe(new ReadlineParser({ delimiter: 'R' }));
        usbParser.on('data', (line) => {
          const data = line.trim() + 'R';
          console.log('[USB] Recibido (Free Charge 5):', data);
          if (onDataCallback) onDataCallback(data, parseLibreString(data));
          if (data === 'I') {
            usbPort.write(`X:${idMachine}\n`);
          } else if (data === 'R') {
            contador = 0;
          }
        });
      } else if (tipoDispositivo === 'Valkyria Dynamometer') {
        usbPort.on('data', (data) => {
          console.log('[USB] Recibido (Dynamometer) buffer:', data);
          const hexString = data.toString('hex');
          console.log('[USB] Recibido (Dynamometer) hexString:', hexString);
          const parsed = parseDinamometroHexString(hexString);
          console.log('[USB] Parseado (Dynamometer):', parsed);
          if (onDataCallback) onDataCallback(hexString, parsed);
          if (hexString === '49') { // 'I'
            usbPort.write(Buffer.from(`X:${idMachine}\n`));
          } else if (hexString === '52') { // 'R'
            contador = 0;
          }
        });
      } else if (tipoDispositivo === 'Valkyria Platform') {
        usbPort.on('data', (data) => {
          console.log('[USB] Recibido (Platform) buffer:', data);
          const hexString = data.toString('hex');
          console.log('[USB] Recibido (Platform) hexString:', hexString);
          // Detectar si es 1kHz o 80Hz por la frecuencia de llegada o el tamaño del paquete
          let parsed = [];
          if (hexString.length > 120) {
            parsed = parse1kHzHexString(hexString);
            console.log('[USB] Parseado (Platform 1kHz):', parsed);
          } else {
            parsed = parseBalanceHexString(hexString);
            console.log('[USB] Parseado (Platform 80Hz):', parsed);
          }
          if (onDataCallback) onDataCallback(hexString, parsed);
          if (hexString === '49') { // 'I'
            usbPort.write(Buffer.from(`X:${idMachine}\n`));
          } else if (hexString === '52') { // 'R'
            contador = 0;
          }
        });
      }
      resolve();
    });
    usbPort.on('error', (err) => {
      console.error('Error en el puerto USB:', err);
    });
  });
}

function cerrarPuertoUSB() {
  if (usbPort) {
    usbPort.close();
    usbPort = null;
    usbParser = null;
  }
}

module.exports = {
  abrirPuertoUSB,
  cerrarPuertoUSB,
  setTipoDispositivo,
  setIdMachine,
  setOnDataCallback,
  get idMachine() { return idMachine; }
}; 