// Configuración de las pruebas end to end (Playwright). Ver docs/pruebas/e2e.md.
// Levanta la aplicación compilada en el puerto 3100 contra la rama "e2e" de Neon. En el PC lee
// .env.e2e.local y .env.local; en GitHub Actions, process.env (secretos del repositorio). Si
// falta una variable o la base no es la de las pruebas, no corre nada: las pruebas nunca tocan la
// rama principal (production) ni Vercel
import { defineConfig, devices } from '@playwright/test';
import { PUERTO_E2E, URL_BASE_E2E, prepararEntornoE2E } from './e2e/apoyo/entorno';

// Lanza un error (sin mostrar valores) si falta algo o si la base podría ser la de producción
const variables = prepararEntornoE2E();

// Las pruebas (que corren en otros procesos) leen estas variables desde process.env
for (const [nombre, valor] of Object.entries(variables)) {
  if (nombre !== 'E2E_DATABASE_URL') process.env[nombre] = valor;
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
      DATABASE_URL: variables.E2E_DATABASE_URL,
      AUTH_SECRET: variables.AUTH_SECRET,
      CLAVE_DISPOSITIVO: variables.CLAVE_DISPOSITIVO,
    },
  },
});
