// Parser para datos del encoder Libre (formato antiguo tipo Valkyria)
// Recibe un string con muestras tipo '123.45R' y devuelve un array de objetos { timestamp, valor }

/**
 * Parsea una cadena recibida del encoder Libre (formato: valorR).
 * Devuelve un array de objetos { timestamp, valor }.
 * @param {string} dataString
 * @returns {{timestamp: number, valor: number}[]} Array de muestras con timestamp
 */
export function parseLibreString(dataString) {
  // Busca todos los valores que terminen en 'R' (ej: 123.45R, -56.7R)
  const regex = /(-?\d+(?:\.\d+)?)R/g;
  const resultados = [];
  let match;
  while ((match = regex.exec(dataString)) !== null) {
    resultados.push({
      timestamp: Date.now(),
      valor: parseFloat(match[1])
    });
  }
  return resultados;
  }

// Ejemplo de uso del parser:
// (Descomenta para probar en tu entorno Node.js)
/*
const ejemploDatos = "123.45R-56.7R0.22RerrorDatoR";
const resultados = parseLibreString(ejemploDatos);
console.log(resultados);
// Salida esperada: array de objetos { timestamp, valor }
*/ 