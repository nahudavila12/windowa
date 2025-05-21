// Parser para datos del dinamómetro Pushpull
// Convierte un array de strings hexadecimales a un array de objetos {valor, timestamp}

function hexToAscii(hex) {
  let str = '';
  for (let i = 0; i < hex.length; i += 2) {
    str += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
  }
  return str;
}

// Recibe un array de strings hexadecimales
export function parseDinamometroData(datosHex) {
  let buffer = '';
  let resultados = [];

  for (const hex of datosHex) {
    const ascii = hexToAscii(hex);
    if (ascii === '\r\n') {
      if (buffer.length > 0) {
        const num = parseFloat(buffer);
        if (!isNaN(num)) resultados.push({ valor: num, timestamp: Date.now() });
        buffer = '';
      }
    } else {
      buffer += ascii;
    }
  }
  return resultados;
}

// Recibe un string hexadecimal largo
export function parseDinamometroHexString(hexString) {
  let resultados = [];
  let buffer = '';
  const ascii = hexToAscii(hexString);
  for (let i = 0; i < ascii.length; i++) {
    const c = ascii[i];
    if (c === '\r' || c === '\n') {
      if (buffer.length > 0) {
        const num = parseFloat(buffer);
        if (!isNaN(num)) resultados.push({ valor: num, timestamp: Date.now() });
        buffer = '';
      }
    } else {
      buffer += c;
    }
  }
  return resultados;
} 