// Puente serial simulado: envía POST /api/tarros con el encabezado x-clave-dispositivo, como lo
// hace puente-serial/ con el Arduino (docs/contratos/api.md, "Contrato con el puente serial").
// No inicia sesión: solo usa la clave del dispositivo. El Arduino no participa en las pruebas
import { request, type APIRequestContext, type APIResponse } from '@playwright/test';
import type { ColorRgb } from '@/lib/modulos/tarros/reglas';
import { convertirRgbAHex } from './colores';
import { URL_BASE_E2E, obtenerVariableObligatoria } from './entorno';

export const ENCABEZADO_CLAVE_DISPOSITIVO = 'x-clave-dispositivo';

export interface PuenteSimulado {
  // Envía la muestra patrón del lote (el lote debe estar en modo Muestra)
  enviarMuestra(loteId: number, rgb: ColorRgb): Promise<APIResponse>;
  // Envía una lectura del sensor (el lote debe estar en modo Recolección)
  enviarLectura(loteId: number, rgb: ColorRgb): Promise<APIResponse>;
  cerrar(): Promise<void>;
}

// Crea un puente con su propio contexto HTTP, sin cookies de sesión
export async function crearPuenteSimulado(): Promise<PuenteSimulado> {
  const contexto: APIRequestContext = await request.newContext({
    baseURL: URL_BASE_E2E,
    extraHTTPHeaders: {
      [ENCABEZADO_CLAVE_DISPOSITIVO]: obtenerVariableObligatoria('CLAVE_DISPOSITIVO'),
    },
  });

  return {
    enviarMuestra: (loteId, rgb) =>
      contexto.post('/api/tarros', {
        data: { loteId, resultadoHex: convertirRgbAHex(rgb), esMuestra: true },
      }),
    enviarLectura: (loteId, rgb) =>
      contexto.post('/api/tarros', {
        data: { loteId, resultadoHex: convertirRgbAHex(rgb), rgb },
      }),
    cerrar: () => contexto.dispose(),
  };
}
