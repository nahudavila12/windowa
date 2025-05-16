// Parser para datos del encoder Libre (Ivolution)
// Recibe un string hexadecimal largo y devuelve un array de distancias lineales

/**
 * Parsea una cadena hexadecimal recibida del encoder Libre.
 * Convierte a ASCII, separa por 'T' y parsea los valores a float.
 * @param {string} hexString
 * @returns {number[]} Array de distancias
 */
export function parseLibreHexString(hexString) {
  // Elimina espacios y pasa a minúsculas
  const cleanHex = hexString.replace(/\s+/g, '').toLowerCase();
  // Convierte de hex a ASCII
  let ascii = '';
  for (let i = 0; i < cleanHex.length; i += 2) {
    ascii += String.fromCharCode(parseInt(cleanHex.substr(i, 2), 16));
  }
  // Divide por 'T' y parsea los valores
  return ascii.split('T')
    .map(v => v.replace(/[^0-9\.-]/g, ''))
    .filter(v => v.length > 0)
    .map(parseFloat)
    .filter(v => !isNaN(v));
} 