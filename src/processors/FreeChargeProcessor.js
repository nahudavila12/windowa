// Procesador de Free Charge adaptado de Java a JS para graficar distancias

const FREQUENCY = 0.00482;
const FILTER_INITIAL = 20;
const RADIUS = 0.0334; // Radio del tambor en metros
const CHARGE = 10; // Valor de carga por defecto (puedes parametrizarlo)

class FreeChargeProcessor {
  constructor(charge = CHARGE) {
    this.charge = charge;
    this.filterInitial = FILTER_INITIAL;
    this.distanceCrude = [];
    this.velocityCrude = [];
    this.acelerationCrude = [];
    this.distanceGraphic = [];
    this.velocityLast = 0;
    this.distanceLast = 0;
    this.forceLast = 0;
    this.counter = 0;
  }

  insertNewData(newValue) {
    const dNewValue = parseFloat(newValue);
    let newDistance = (dNewValue * 2 * Math.PI * RADIUS) / 600.0;
    this.distanceCrude.push(newDistance);
    if (this.distanceCrude.length === 5) {
      newDistance = avg(this.distanceCrude);
      this.distanceCrude.shift();
      this.velocityCrude.push((newDistance - this.distanceLast) / FREQUENCY);
      if (this.velocityCrude.length === 5) {
        const newVelocity = avg(this.velocityCrude);
        this.velocityCrude.shift();
        this.acelerationCrude.push((newVelocity - this.velocityLast) / FREQUENCY);
        if (this.acelerationCrude.length === 5) {
          const newAceleration = avg(this.acelerationCrude);
          this.acelerationCrude.shift();
          // Solo graficamos distancia, pero aquí podrías calcular fuerza, potencia, etc.
          if (this.filterInitial > 0) {
            this.filterInitial--;
          } else {
            this.distanceGraphic.push(round(newDistance, 3));
            this.counter++;
          }
          this.forceLast = this.charge * (newAceleration + 9.81);
        }
        this.velocityLast = newVelocity;
      }
      this.distanceLast = newDistance;
    }
  }

  getDistances() {
    // Devuelve una copia del array de distancias para graficar
    return [...this.distanceGraphic];
  }
}

function avg(arr) {
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}
function round(num, dec) {
  return Math.round(num * Math.pow(10, dec)) / Math.pow(10, dec);
}

// Singleton para la sesión
let instance = null;
export function getFreeChargeProcessor() {
  if (!instance) {
    instance = new FreeChargeProcessor();
  }
  return instance;
} 