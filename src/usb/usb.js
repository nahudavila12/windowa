// Módulo centralizado para manejo de USB en Node.js/Electron
const { SerialPort } = require('serialport');
const Readline = require('@serialport/parser-readline');
const { parseLibreString } = require('../libre/parser');
const { parseDinamometroHexString } = require('../dinamometro/parser');
const { parseBalanceHexString } = require('../balance/parser');
const { parse1kHzHexString } = require('../balance/parser_1khz');
const { v4: uuidv4 } = require('uuid');

let usbPort = null;
let usbParser = null;
let tipoDispositivo = 'Valkyria Free Charge 5'; // Valor por defecto
let idMachine = 1; // Iniciar en 1, como en los archivos viejos
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
        usbParser = usbPort.pipe(new Readline({ delimiter: 'R' }));
        usbParser.on('data', (line) => {
          const data = line.trim() + 'R';
          if (onDataCallback) onDataCallback(data, parseLibreString(data));
          if (data === 'I') {
            usbPort.write(`X:${idMachine}\n`);
          } else if (data === 'R') {
            contador = 0;
          }
        });
      } else if (tipoDispositivo === 'Valkyria Dynamometer') {
        usbPort.on('data', (data) => {
          const hexString = data.toString('hex');
          if (onDataCallback) onDataCallback(hexString, parseDinamometroHexString(hexString));
          if (hexString === '49') { // 'I'
            usbPort.write(Buffer.from(`X:${idMachine}\n`));
          } else if (hexString === '52') { // 'R'
            contador = 0;
          }
        });
      } else if (tipoDispositivo === 'Valkyria Platform') {
        usbPort.on('data', (data) => {
          const hexString = data.toString('hex');
          // Detectar si es 1kHz o 80Hz por la frecuencia de llegada o el tamaño del paquete
          // Aquí, si el string es muy largo y llegan muchos paquetes por segundo, asumimos 1kHz
          // Si no, 80Hz
          let parsed = [];
          if (hexString.length > 120) {
            parsed = parse1kHzHexString(hexString);
          } else {
            parsed = parseBalanceHexString(hexString);
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