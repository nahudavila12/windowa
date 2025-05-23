// Parser plataforma Balance ASCII
// Datos de USB: línea con "fuerza1\tfuerza2" (números en texto) por ejemplo "123.45\t67.89"
// Devuelve array de objetos { fuerza1, fuerza2, timestamp }

/**
 * Parsea una línea ASCII recibida de la plataforma Balance.
 * @param {string} asciiLine Línea completa con 2 números separados por tabulación o espacio
 * @returns {{fuerza1:number, fuerza2:number, timestamp:number}[]} Array con un solo elemento si es válido, vacío si no
 */
export function parseBalanceAsciiString(asciiLine) {
  if (!asciiLine || typeof asciiLine !== 'string') return [];
  const clean = asciiLine.trim();
  // Separar por tabulador, coma o espacio
  const partes = clean.split(/\t|,|\s+/).filter(Boolean);
  if (partes.length < 2) return [];
  const num1 = parseFloat(partes[0]);
  const num2 = parseFloat(partes[1]);
  const umbralOutlier = 200; // igual que parser hex
  if (isNaN(num1) || isNaN(num2)) return [];
  if (Math.abs(num1) > umbralOutlier || Math.abs(num2) > umbralOutlier) return [];
  return [{ fuerza1: num1, fuerza2: num2, timestamp: Date.now() }];
} 