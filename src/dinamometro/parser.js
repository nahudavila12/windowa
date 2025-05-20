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
  // Si queda algo en el buffer al final
  if (buffer.length > 0) {
    const num = parseFloat(buffer);
    if (!isNaN(num)) resultados.push({ valor: num, timestamp: Date.now() });
  }
  return resultados;
}

// Si recibes un string hexadecimal concatenado, puedes usar esto:
export function parseDinamometroHexString(hexString) {
  const ascii = hexToAscii(hexString);
  return ascii.split('\r\n').filter(v => v.length > 0).map(num => ({ valor: Number(num), timestamp: Date.now() }));
} 