// Módulo centralizado para manejo de USB en Node.js/Electron
const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');
const { parseLibreString } = require('../libre/parser');
const { parseDinamometroHexString } = require('../dinamometro/parser');
const { parseBalanceHexString } = require('../balance/parser');
const { parse1kHzHexString } = require('../balance/parser_1khz');
const { parseBalanceAsciiString } = require('../balance/parser_ascii');
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
          let data = line.trim();
          if (!data.endsWith('R')) data += 'R';
          const timestamp = Date.now();
          const date = new Date(timestamp);
          const timestampStr = date.toLocaleString('es-ES', { hour12: false }) + '.' + String(date.getMilliseconds()).padStart(3, '0');
          const hexString = Buffer.from(data, 'utf8').toString('hex');
          const parsed = parseLibreString(hexString);
          console.log('[USB] Recibido (Valkyria Free Charge 5):', data);
          console.log('[USB] Parseado (Free Charge 5):', parsed);
          if (onDataCallback) onDataCallback({  parsed , timestampStr });
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
        // Para la plataforma llegan líneas ASCII con "fuerza1\tfuerza2\n" a 80 Hz,
        // pero también pueden llegar ráfagas hexadecimales para 1 kHz.
        usbPort.on('data', (data) => {
          const ascii = data.toString('utf8');
          const hexString = data.toString('hex');
          console.log('[USB] Recibido (Platform) ascii:', ascii.replace(/\r|\n/g, ''));
          let parsed = [];

          // Intentar parsear como ASCII "f1\tf2"
          if (ascii.includes('\t')) {
            parsed = parseBalanceAsciiString(ascii);
            if (parsed.length) {
              console.log('[USB] Parseado (Platform ASCII):', parsed);
            }
          }

          // Si ASCII no produjo resultados, intentar parsear como hex (80 Hz o 1 kHz)
          if (!parsed.length) {
            if (hexString.length > 120) {
              parsed = parse1kHzHexString(hexString);
              console.log('[USB] Parseado (Platform 1kHz HEX):', parsed);
            } else {
              parsed = parseBalanceHexString(hexString);
              console.log('[USB] Parseado (Platform 80Hz HEX):', parsed);
            }
          }

          const rawForFront = ascii.trim() || hexString;
          if (onDataCallback) onDataCallback(rawForFront, parsed);

          // Manejo de comandos 'I' y 'R' (en ASCII)
          if (ascii.trim() === 'I') {
            usbPort.write(`X:${idMachine}\n`);
          } else if (ascii.trim() === 'R') {
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