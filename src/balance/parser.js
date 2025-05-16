// Parser para datos de la plataforma Balance (Ivolution)
// Recibe un string hexadecimal largo y devuelve un array de objetos {fuerza1, fuerza2}

/**
 * Parsea una cadena hexadecimal recibida de la plataforma Balance.
 * Cada paquete válido es: 4c3aHH1LL1HH2LL2 (12 caracteres hex)
 * Donde HH1,LL1 = fuerza1, HH2,LL2 = fuerza2 (little endian), fuerza = valor / 10.0
 * @param {string} hexString
 * @returns {{fuerza1: number, fuerza2: number}[]} Array de pares de fuerzas
 */
export function parseBalanceHexString(hexString) {
  const pares = [];
  const cleanHex = hexString.replace(/\s+/g, '').toLowerCase();
  for (let i = 0; i < cleanHex.length - 11; i += 12) {
    const bloque = cleanHex.substr(i, 12);
    if (bloque.startsWith('4c3a')) {
      // fuerza1: h1 = bloque[4:6], l1 = bloque[6:8]
      // fuerza2: h2 = bloque[8:10], l2 = bloque[10:12]
      const h1 = bloque.substr(4, 2);
      const l1 = bloque.substr(6, 2);
      const h2 = bloque.substr(8, 2);
      const l2 = bloque.substr(10, 2);
      const valor1 = (parseInt(l1, 16) << 8) | parseInt(h1, 16);
      const valor2 = (parseInt(l2, 16) << 8) | parseInt(h2, 16);
      const fuerza1 = valor1 / 10.0;
      const fuerza2 = valor2 / 10.0;
      pares.push({ fuerza1, fuerza2 });
    }
  }
  return pares;
} 