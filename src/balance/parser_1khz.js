// Parser exclusivo para datos de la plataforma Balance 1kHz (Ivolution)
// Recibe un string hexadecimal largo y devuelve un array de objetos {fuerza1, fuerza2, timestamp}

/**
 * Parsea una cadena hexadecimal recibida de la plataforma 1kHz.
 * Cada paquete válido es: 4c3aHH1LL1HH2LL2 (12 caracteres hex)
 * Donde HH1,LL1 = fuerza1, HH2,LL2 = fuerza2 (little endian), fuerza = valor / 10.0
 * Este parser es exclusivo para la versión 1kHz (alta frecuencia).
 * Ignora bloques corruptos o incompletos.
 * @param {string} hexString
 * @returns {{fuerza1: number, fuerza2: number, timestamp: number}[]} Array de pares de fuerzas con timestamp
 */
export function parse1kHzHexString(hexString) {
  const pares = [];
  if (!hexString || typeof hexString !== 'string') return pares;
  const cleanHex = hexString.replace(/\s+/g, '').toLowerCase();
  for (let i = 0; i <= cleanHex.length - 12; i += 12) {
    const bloque = cleanHex.substr(i, 12);
    if (bloque.length === 12 && bloque.startsWith('4c3a')) {
      try {
        const h1 = bloque.substr(4, 2);
        const l1 = bloque.substr(6, 2);
        const h2 = bloque.substr(8, 2);
        const l2 = bloque.substr(10, 2);
        const valor1 = (parseInt(l1, 16) << 8) | parseInt(h1, 16);
        const valor2 = (parseInt(l2, 16) << 8) | parseInt(h2, 16);
        const fuerza1 = valor1 / 10.0;
        const fuerza2 = valor2 / 10.0;
        pares.push({ fuerza1, fuerza2, timestamp: Date.now() });
      } catch (e) {
        // Ignorar bloque corrupto
      }
    }
  }
  return pares;
} 