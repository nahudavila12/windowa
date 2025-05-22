// Encoder Libre 
// Recibe un string hexadecimal o texto con muestras tipo '3054R' o '123.45R' y devuelve un array de objetos { valor, timestamp }

/**
 * Parsea una cadena recibida del encoder Libre (puede venir en hexadecimal ASCII o texto plano).
 * Devuelve un array de objetos { valor, timestamp }.
 * @param {string} dataString
 * @returns {{valor: number, timestamp: number}[]} Array de muestras con timestamp
 */
function hexToAscii(hex) {
  let str = '';
  for (let i = 0; i < hex.length; i += 2) {
    str += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
  }
  return str;
}

export function parseLibreString(dataString) {
  console.log('[parseLibreString] dataString recibido:', dataString);
  // Si el string parece hexadecimal, lo convierto a ASCII
  let ascii = dataString;
  if (/^[0-9a-fA-F]+$/.test(dataString) && dataString.length % 2 === 0) {
    ascii = hexToAscii(dataString);
    console.log('[parseLibreString] Convertido de HEX a ASCII:', ascii);
  }
  // Busca todos los valores que terminen en 'T' o 'R'
  const regex = /(-?\d+(?:\.\d+)?)[TR]/g;
  const resultados = [];
  let match;
  while ((match = regex.exec(ascii)) !== null) {
    const valor = parseFloat(match[1]);
    if (!isNaN(valor)) {
      const obj = { valor, timestamp: Date.now() };
      resultados.push(obj);
      console.log('[parseLibreString] objeto parseado:', obj);
    } else {
      console.log('[parseLibreString] valor no numérico:', match[1]);
    }
  }
  console.log('[parseLibreString] resultado final:', resultados);
  return resultados;
}
