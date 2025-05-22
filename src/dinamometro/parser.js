// Pushpull
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
  console.log('[parseDinamometroData] datosHex:', datosHex);
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
  console.log('[parseDinamometroData] resultados:', resultados);
  return resultados;
}

// Recibe un string hexadecimal largo
export function parseDinamometroHexString(hexString) {
  let resultados = [];
  let buffer = '';
  console.log('[parseDinamometroHexString] hexString:', hexString);
  const ascii = hexToAscii(hexString);
  console.log('[parseDinamometroHexString] ascii:', ascii);
  for (let i = 0; i < ascii.length; i++) {
    const c = ascii[i];
    if (c === '\r' || c === '\n') {
      if (buffer.length > 0) {
        const num = parseFloat(buffer);
        if (!isNaN(num)) {
          resultados.push({ valor: num, timestamp: Date.now() });
          console.log('[parseDinamometroHexString] valor parseado:', num);
        }
        buffer = '';
      }
    } else {
      buffer += c;
    }
  }
  // Si queda un valor pendiente al final
  if (buffer.length > 0) {
    const num = parseFloat(buffer);
    if (!isNaN(num)) {
      resultados.push({ valor: num, timestamp: Date.now() });
      console.log('[parseDinamometroHexString] valor final parseado:', num);
    }
  }
  console.log('[parseDinamometroHexString] resultados:', resultados);
  return resultados;
} 