// Apoyos para preparar los datos de cada prueba por la API (nunca con SQL manual) y para dejar el
// sensor libre al terminar. Los lotes llevan el prefijo TEST_E2E_ y un sufijo único con fecha y hora
import {
  expect,
  request,
  type APIRequestContext,
  type BrowserContext,
  type Page,
} from '@playwright/test';
import type { ModoCaptura } from '@/lib/modulos/lotes/reglas';
import type { ColorRgb } from '@/lib/modulos/tarros/reglas';
import { URL_BASE_E2E, obtenerVariableObligatoria } from './entorno';
import type { PuenteSimulado } from './puente';

export const PREFIJO_LOTES_E2E = 'TEST_E2E_';

export interface LoteCreado {
  id: number;
  codigo: string;
  estado: string;
  modo_captura: ModoCaptura;
}

let lotesGenerados = 0;

// Código único: TEST_E2E_<nombre>_<AAAAMMDDhhmmssmmm>_<n>. La fecha y hora lo separan de las
// ejecuciones anteriores y el contador, de otro lote creado en el mismo milisegundo
export function generarCodigoLote(nombre: string): string {
  const fechaHora = new Date().toISOString().replace(/\D/g, '').slice(0, 17);
  lotesGenerados++;
  return `${PREFIJO_LOTES_E2E}${nombre}_${fechaHora}_${lotesGenerados}`;
}

function obtenerCredenciales() {
  return {
    nombreUsuario: obtenerVariableObligatoria('E2E_USUARIO'),
    contrasena: obtenerVariableObligatoria('E2E_CONTRASENA'),
  };
}

// Inicia sesión por la API dentro de un contexto (el del navegador o uno propio): la cookie queda
// guardada en ese contexto y la usan las páginas y las peticiones siguientes
export async function iniciarSesionPorApi(contexto: APIRequestContext): Promise<void> {
  const respuesta = await contexto.post('/api/auth/login', { data: obtenerCredenciales() });
  expect(respuesta.status(), 'el usuario de pruebas debe poder iniciar sesión').toBe(200);
}

// Inicia sesión en el navegador de la prueba sin pasar por el formulario (F1 prueba el formulario)
export async function iniciarSesionEnNavegador(page: Page | BrowserContext): Promise<void> {
  await iniciarSesionPorApi(page.request);
}

// Contexto HTTP con sesión, para preparar datos y limpiar desde afterEach
export async function crearSesionApi(): Promise<APIRequestContext> {
  const contexto = await request.newContext({ baseURL: URL_BASE_E2E });
  await iniciarSesionPorApi(contexto);
  return contexto;
}

export async function crearLote(sesion: APIRequestContext, codigo: string): Promise<LoteCreado> {
  const respuesta = await sesion.post('/api/lotes', { data: { codigo } });
  expect(respuesta.status(), `crear el lote ${codigo}`).toBe(201);
  return (await respuesta.json()).datos;
}

export async function cambiarModoCaptura(
  sesion: APIRequestContext,
  loteId: number,
  modo: ModoCaptura
): Promise<void> {
  const respuesta = await sesion.patch(`/api/lotes/${loteId}/captura`, { data: { modo } });
  expect(respuesta.status(), `cambiar el lote ${loteId} a ${modo}`).toBe(200);
}

// Lote con su muestra patrón ya guardada y en modo Inactivo, listo para "Iniciar recolección"
export async function crearLoteConMuestra(
  sesion: APIRequestContext,
  puente: PuenteSimulado,
  nombre: string,
  rgbMuestra: ColorRgb
): Promise<LoteCreado> {
  const lote = await crearLote(sesion, generarCodigoLote(nombre));
  await cambiarModoCaptura(sesion, lote.id, 'Muestra');
  const respuesta = await puente.enviarMuestra(lote.id, rgbMuestra);
  expect(respuesta.status(), 'registrar la muestra patrón').toBe(201);
  return lote;
}

// Deja el sensor libre: si un lote de pruebas está capturando, lo pasa a Inactivo. Se llama en
// afterEach, así que corre aunque la prueba haya fallado. No toca lotes que no sean de pruebas
export async function liberarSensor(sesion: APIRequestContext): Promise<void> {
  const respuesta = await sesion.get('/api/captura/activa');
  if (!respuesta.ok()) return;

  const captura: { loteId: number; codigo: string } | null = (await respuesta.json()).datos;
  if (!captura || !captura.codigo.startsWith(PREFIJO_LOTES_E2E)) return;

  await sesion.patch(`/api/lotes/${captura.loteId}/captura`, { data: { modo: 'Inactivo' } });
}
