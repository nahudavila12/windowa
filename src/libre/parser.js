// Encoder Libre 
// Recibe un string con muestras tipo '3054R' o '123.45R' y devuelve un array de objetos { valor, timestamp }

/**
 * Parsea una cadena recibida del encoder Libre (formato: valorR, puede haber varios valores juntos).
 * Devuelve un array de objetos { valor, timestamp }.
 * @param {string} dataString
 * @returns {{valor: number, timestamp: number}[]} Array de muestras con timestamp
 */
export function parseLibreString(dataString) {
  console.log('[parseLibreString] dataString recibido:', dataString);
  // Busca todos los valores que terminen en 'R' (ej: 3054R, 123.45R, -56.7R)
  const regex = /(-?\d+(?:\.\d+)?)R/g;
  const resultados = [];
  let match;
  while ((match = regex.exec(dataString)) !== null) {
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
