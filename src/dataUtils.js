// dataUtils.js
// Módulo centralizado para parseo y filtrado de datos de dispositivos Ivolution
// Cada importación tiene un comentario explicativo

// --- PARSEADORES ---

// Parser para el dinamómetro Valkyria
// Convierte datos hexadecimales (array o string) en objetos {valor, timestamp}
// Usar para graficar fuerza de dinamómetro
import { parseDinamometroData, parseDinamometroHexString } from './dinamometro/parser.js';

// Parser para la plataforma Valkyria (80Hz)
// Convierte string hexadecimal en objetos {fuerza1, fuerza2, timestamp}
// Usar para graficar fuerza de plataforma
import { parseBalanceHexString } from './balance/parser.js';

// Parser para el encoder Libre (Free Charge 5)
// Convierte string hexadecimal o texto en objetos {valor, timestamp}
// Usar para graficar distancia recorrida
import { parseLibreString } from './libre/parser.js';

// --- FILTROS DE DATOS ---

// Filtra valores planos al final de un array de muestras (dinamómetro/libre)
// Útil para limpiar datos repetidos al final de un test
export function filtrarPlanosAlFinal(arr, key = 'valor', N = 10) {
  if (!arr.length) return arr;
  let count = 1;
  let i = arr.length - 1;
  while (i > 0 && count < N + 1) {
    if (arr[i][key] === arr[i - 1][key]) {
      count++;
      i--;
    } else {
      break;
    }
  }
  if (count > N) {
    return arr.slice(0, arr.length - count + N);
  }
  return arr;
}

// Filtra valores planos al final para la plataforma (fuerza1 y fuerza2)
export function filtrarPlanosAlFinalPlataforma(arr, N = 10) {
  if (!arr.length) return arr;
  let count = 1;
  let i = arr.length - 1;
  while (
    i > 0 &&
    count < N + 1 &&
    arr[i].fuerza1 === arr[i - 1].fuerza1 &&
    arr[i].fuerza2 === arr[i - 1].fuerza2
  ) {
    count++;
    i--;
  }
  if (count > N) {
    return arr.slice(0, arr.length - count + N);
  }
  return arr;
}

// --- FUNCIÓN GENERAL DE PARSEO ---
// Dado un tipo de dispositivo y datos crudos, retorna los datos parseados listos para graficar
// type puede ser: 'Valkyria Dynamometer', 'Valkyria Platform', 'Valkyria Free Charge 5'
export function parsearDatosPorTipo(type, data) {
  switch (type) {
    case 'Valkyria Dynamometer':
      if (Array.isArray(data)) return parseDinamometroData(data);
      if (typeof data === 'string') return parseDinamometroHexString(data);
      return [];
    case 'Valkyria Platform':
      if (typeof data === 'string') return parseBalanceHexString(data);
      return [];
    case 'Valkyria Free Charge 5':
      if (typeof data === 'string') return parseLibreString(data);
      return [];
    default:
      return [];
  }
}

// --- EXPORTACIONES INDIVIDUALES ---
// Exporta los parseadores individuales por si se quieren usar directamente
export {
  parseDinamometroData, // Dinamómetro: array de hexadecimales
  parseDinamometroHexString, // Dinamómetro: string hexadecimal
  parseBalanceHexString, // Plataforma: string hexadecimal
  parseLibreString // Libre: string o hexadecimal
}; 