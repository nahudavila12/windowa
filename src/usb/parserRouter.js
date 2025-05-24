import { parseBalanceHexString } from '../balance/parser';
import { parseDinamometroHexString } from '../dinamometro/parser';
import { parseLibreString } from '../libre/parser';
import { getFreeChargeProcessor } from '../processors/FreeChargeProcessor';

// Mantener una instancia global del processor para la sesión
let freeChargeProcessor = null;

export function routeParser(data, idMachine) {
  switch (idMachine) {
    case '10':
      return parseDinamometroHexString(data);
    case '11':
      // Free Charge: usar el processor avanzado para USB y Bluetooth (solo Electron ahora)
      if (!freeChargeProcessor) {
        freeChargeProcessor = getFreeChargeProcessor();
      }
      // El processor espera solo el valor numérico como string
      // Extraer el número del string recibido
      const match = data.match(/(-?\d+(?:\.\d+)?)/);
      if (match) {
        freeChargeProcessor.insertNewData(match[1]);
        // Devuelve el buffer de distancias para graficar
        return freeChargeProcessor.getDistances();
      }
      return null;
    case '12':
      return parseBalanceHexString(data);
    default:
      return null;
  }
} 