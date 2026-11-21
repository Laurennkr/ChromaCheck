// Configuración de las pruebas end to end (Playwright). Ver docs/pruebas/e2e.md.
// Levanta la aplicación compilada en el puerto 3100 contra la rama "e2e" de Neon. Si la base de
// las pruebas falta o es la misma de .env.local, no corre nada: las pruebas nunca tocan la rama
// principal (production) ni Vercel
import { defineConfig, devices } from '@playwright/test';
import {
  ARCHIVO_ENTORNO_E2E,
  ARCHIVO_ENTORNO_LOCAL,
  PUERTO_E2E,
  URL_BASE_E2E,
  leerArchivoEntorno,
  obtenerHostBaseDatos,
} from './e2e/apoyo/entorno';

const entornoE2E = leerArchivoEntorno(ARCHIVO_ENTORNO_E2E);
const entornoLocal = leerArchivoEntorno(ARCHIVO_ENTORNO_LOCAL);

// Las variables ya definidas en la terminal tienen prioridad sobre los archivos
function leerVariable(nombre: string, ...fuentes: Record<string, string>[]): string | undefined {
  return process.env[nombre] || fuentes.find((fuente) => fuente[nombre])?.[nombre];
}

const urlBaseDatosE2E = leerVariable('E2E_DATABASE_URL', entornoE2E);
const hostBaseDatosE2E = obtenerHostBaseDatos(urlBaseDatosE2E);
const hostBaseDatosLocal = obtenerHostBaseDatos(entornoLocal.DATABASE_URL);

// Protección contra producción: sin base E2E propia no se corre nada
if (!hostBaseDatosE2E) {
  throw new Error(
    `Falta E2E_DATABASE_URL (o no es una cadena de conexión válida) en ${ARCHIVO_ENTORNO_E2E}. ` +
      'Las pruebas E2E solo corren contra la rama "e2e" de Neon (docs/pruebas/e2e.md).'
  );
}
if (hostBaseDatosE2E === hostBaseDatosLocal) {
  throw new Error(
    `E2E_DATABASE_URL apunta al mismo servidor que DATABASE_URL de ${ARCHIVO_ENTORNO_LOCAL}. ` +
      'Use la cadena de conexión de la rama "e2e" de Neon, nunca la de desarrollo ni la principal.'
  );
}

// Las pruebas (que corren en otros procesos) leen estas variables desde process.env
const VARIABLES_PRUEBAS = {
  E2E_USUARIO: leerVariable('E2E_USUARIO', entornoE2E),
  E2E_CONTRASENA: leerVariable('E2E_CONTRASENA', entornoE2E),
  AUTH_SECRET: leerVariable('AUTH_SECRET', entornoLocal),
  CLAVE_DISPOSITIVO: leerVariable('CLAVE_DISPOSITIVO', entornoLocal),
};
for (const [nombre, valor] of Object.entries(VARIABLES_PRUEBAS)) {
  if (valor) process.env[nombre] = valor;
}

export default defineConfig({
  testDir: './e2e',
  // Hay un solo sensor: solo un lote puede capturar a la vez, así que las pruebas van en fila
  workers: 1,
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: 0,
  timeout: 60_000,
  // La pantalla del lote se refresca cada 3 s: las esperas con expect llegan hasta 10 s
  expect: { timeout: 10_000 },
  reporter: [['list'], ['html', { outputFolder: 'playwright-report', open: 'never' }]],
  outputDir: 'test-results',
  use: {
    baseURL: URL_BASE_E2E,
    locale: 'es-CO',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: `npm run build && npx next start -p ${PUERTO_E2E}`,
    url: `${URL_BASE_E2E}/login`,
    // Nunca reutiliza un servidor que ya esté corriendo: podría estar conectado a otra base
    reuseExistingServer: false,
    timeout: 300_000,
    stdout: 'ignore',
    stderr: 'pipe',
    env: {
      DATABASE_URL: urlBaseDatosE2E as string,
      AUTH_SECRET: VARIABLES_PRUEBAS.AUTH_SECRET ?? '',
      CLAVE_DISPOSITIVO: VARIABLES_PRUEBAS.CLAVE_DISPOSITIVO ?? '',
    },
  },
});
