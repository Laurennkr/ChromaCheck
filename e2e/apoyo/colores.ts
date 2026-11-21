// Elige los colores de las lecturas de prueba calculando el ΔE con las mismas funciones y
// constantes del servidor (lib/modulos/tarros/reglas.ts). Las pruebas no escriben umbrales fijos:
// el código aplica los valores calibrados con el sensor (decisión del 2026-11-20, brecha B7)
import {
  UMBRAL_ALERTA_ROJA_DELTA_E,
  UMBRAL_TOLERANCIA_DELTA_E,
  calcularDesviacionDeltaE,
  type ColorRgb,
} from '@/lib/modulos/tarros/reglas';

export interface ColorDePrueba {
  rgb: ColorRgb;
  hex: string;
  deltaE: number;
}

export interface ColoresDePrueba {
  muestra: ColorDePrueba;
  aprobado: ColorDePrueba;
  alertaAmarilla: ColorDePrueba;
  alertaRojaGrave: ColorDePrueba;
}

// Muestra patrón de los ejemplos de las specs: #E35336 (227, 83, 54)
export const RGB_MUESTRA_PRUEBAS: ColorRgb = [227, 83, 54];

// Convierte [r, g, b] a #RRGGBB en mayúsculas, el formato que muestra la interfaz
export function convertirRgbAHex(rgb: ColorRgb): string {
  return '#' + rgb.map((canal) => canal.toString(16).padStart(2, '0').toUpperCase()).join('');
}

// Colores candidatos: la muestra con el canal rojo y el verde cada vez más bajos
function generarCandidatos(muestra: ColorRgb): ColorRgb[] {
  const candidatos: ColorRgb[] = [];
  for (let paso = 1; paso <= 255; paso++) {
    const rojo = Math.max(0, muestra[0] - paso);
    const verde = Math.max(0, muestra[1] - Math.floor(paso / 4));
    candidatos.push([rojo, verde, muestra[2]]);
  }
  return candidatos;
}

// Entre los candidatos cuyo ΔE cumple la condición, el más cercano al ΔE objetivo
function elegirColor(
  muestra: ColorRgb,
  cumpleCondicion: (deltaE: number) => boolean,
  deltaEObjetivo: number,
  descripcion: string
): ColorDePrueba {
  const opciones = generarCandidatos(muestra)
    .map((rgb) => ({
      rgb,
      hex: convertirRgbAHex(rgb),
      deltaE: calcularDesviacionDeltaE(muestra, rgb),
    }))
    .filter((opcion) => cumpleCondicion(opcion.deltaE))
    .sort((a, b) => Math.abs(a.deltaE - deltaEObjetivo) - Math.abs(b.deltaE - deltaEObjetivo));

  if (opciones.length === 0) {
    throw new Error(`No se encontró un color de prueba para: ${descripcion}`);
  }
  return opciones[0];
}

// Un color aprobado (ΔE dentro de la tolerancia, lejos del borde), uno con alerta amarilla aislada
// (entre la tolerancia y la roja) y uno con alerta roja grave (por encima del umbral de la roja)
export function elegirColoresDePrueba(muestra: ColorRgb = RGB_MUESTRA_PRUEBAS): ColoresDePrueba {
  const aprobado = elegirColor(
    muestra,
    (deltaE) => deltaE > 0 && deltaE <= UMBRAL_TOLERANCIA_DELTA_E,
    UMBRAL_TOLERANCIA_DELTA_E / 2,
    'aprobado'
  );
  const alertaAmarilla = elegirColor(
    muestra,
    (deltaE) => deltaE > UMBRAL_TOLERANCIA_DELTA_E && deltaE < UMBRAL_ALERTA_ROJA_DELTA_E,
    (UMBRAL_TOLERANCIA_DELTA_E + UMBRAL_ALERTA_ROJA_DELTA_E) / 2,
    'alerta amarilla'
  );
  const alertaRojaGrave = elegirColor(
    muestra,
    (deltaE) => deltaE >= UMBRAL_ALERTA_ROJA_DELTA_E,
    UMBRAL_ALERTA_ROJA_DELTA_E * 1.5,
    'alerta roja grave'
  );

  return {
    muestra: { rgb: muestra, hex: convertirRgbAHex(muestra), deltaE: 0 },
    aprobado,
    alertaAmarilla,
    alertaRojaGrave,
  };
}
