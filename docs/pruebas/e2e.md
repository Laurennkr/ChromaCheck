# Pruebas end to end (E2E)

Las pruebas E2E recorren la aplicación como lo haría el operario: abren el navegador (Chromium), inician sesión, abren un lote, agregan la muestra, recolectan tarros y revisan el historial. Las escribimos con [Playwright](https://playwright.dev) y están en `e2e/`, un archivo por spec.

El Arduino no participa. Un **puente simulado** (`e2e/apoyo/puente.ts`) envía `POST /api/tarros` con el encabezado `x-clave-dispositivo`, igual que `puente-serial/` ([contratos/api.md](../contratos/api.md#contrato-con-el-puente-serial)).

## Cómo se ejecutan (cmd de Windows)

Una sola vez, después de `npm install`:

```cmd
npx playwright install chromium
```

Cada vez:

```cmd
npm run test:e2e
```

Para verlas paso a paso en la interfaz de Playwright:

```cmd
npm run test:e2e:ver
```

`npm run test:e2e` compila la aplicación (`npm run build`) y la levanta con `next start` en el puerto **3100**, conectada a la rama `e2e` de Neon. Si `npm run dev` está corriendo en el 3000, no hay problema: son servidores distintos. Al terminar queda el reporte en `playwright-report\index.html`:

```cmd
npx playwright show-report
```

Si una prueba falla, en `test-results\` quedan la captura, el video y la traza (`npx playwright show-trace <ruta al trace.zip>`). Ninguna de las dos carpetas se sube a Git.

## Base de datos: rama `e2e` de Neon

Las pruebas usan su propia rama de Neon, `e2e`, creada desde `desarrollo`, con un usuario de pruebas creado con `scripts/crear-usuario.ts`. Nunca corren contra la rama principal (`production`) ni contra Vercel.

- Cada prueba crea sus propios lotes por la API, con el prefijo `TEST_E2E_` y un sufijo de fecha y hora (`TEST_E2E_F3F4_20261121141616818_3`). No se inserta nada con SQL.
- Al terminar cada prueba, aunque falle, un `afterEach` deja el sensor libre: si un lote `TEST_E2E_` quedó capturando, lo pasa a modo `Inactivo` (`e2e/apoyo/ganchos.ts`).
- No hay API para borrar lotes. Para limpiar los datos de prueba se restablece la rama `e2e` desde `desarrollo` (en la consola de Neon, "Reset from parent", o con `reset_from_parent` del MCP de Neon) y después se vuelve a crear el usuario de pruebas.

## Variables (`.env.e2e.local`)

El archivo está en la raíz y Git lo ignora (`.env*` en `.gitignore`). Nunca se sube ni se copia en un PR.

| Variable           | Qué es                                                                            |
| ------------------ | --------------------------------------------------------------------------------- |
| `E2E_DATABASE_URL` | Cadena de conexión de la rama `e2e` de Neon (`get_connection_string` de esa rama) |
| `E2E_USUARIO`      | Usuario de pruebas creado en la rama `e2e`                                        |
| `E2E_CONTRASENA`   | Su contraseña (aleatoria; solo vive en este archivo)                              |

`AUTH_SECRET` y `CLAVE_DISPOSITIVO` se leen de `.env.local`. Una variable definida en la terminal tiene prioridad sobre las de los archivos. Si falta alguna de las cinco, la configuración se detiene con un error que dice cuál falta y dónde se agrega, sin mostrar ningún valor (`prepararEntornoE2E` en `e2e/apoyo/entorno.ts`).

Para crear el usuario de pruebas después de restablecer la rama (cmd, reemplazando los valores entre `< >`):

```cmd
set DATABASE_URL=<E2E_DATABASE_URL>
node --experimental-strip-types scripts/crear-usuario.ts <E2E_USUARIO> <E2E_CONTRASENA>
set DATABASE_URL=
```

## Protección contra producción

`playwright.config.ts` revisa la base antes de correr cualquier cosa y lanza un error, sin levantar el servidor, si:

1. falta `E2E_DATABASE_URL` o no es una cadena de conexión válida;
2. en el PC, su servidor (host) es el mismo que el de `DATABASE_URL` en `.env.local` o en la terminal;
3. en GitHub Actions (`CI=true`), `DATABASE_URL` está definida en el flujo: allá no existe la base de desarrollo ni la principal, así que si aparece se trata como un error.

El servidor de las pruebas recibe `DATABASE_URL = E2E_DATABASE_URL` en su entorno; Next.js no reemplaza una variable que ya llega definida, así que el `DATABASE_URL` de `.env.local` no se usa. Tampoco reutiliza un servidor que ya esté corriendo (`reuseExistingServer: false`), porque podría estar conectado a otra base.

## Por qué en fila (`workers: 1`)

Hay un solo sensor y solo un lote puede capturar a la vez (índice `lotes_un_lote_capturando`). Si dos pruebas corrieran a la vez, una le quitaría el sensor a la otra. Por eso `workers: 1` y `fullyParallel: false`.

## Esperas

La pantalla del lote se refresca cada 3 s mientras captura. Las pruebas no usan pausas fijas: esperan con `expect(...)`, que reintenta hasta 10 s (`expect.timeout`). El único tiempo más largo es el clic en "Entendido" de F5, que espera hasta 15 s porque el botón aparece 5 s después de la alerta roja.

## Colores de prueba

`e2e/apoyo/colores.ts` elige los colores a partir de la muestra `#E35336`, calculando el ΔE con `calcularDesviacionDeltaE` y las constantes `UMBRAL_TOLERANCIA_DELTA_E` y `UMBRAL_ALERTA_ROJA_DELTA_E` de `lib/modulos/tarros/reglas.ts`: uno aprobado, uno con alerta amarilla aislada y uno con roja grave. Las pruebas no escriben umbrales fijos, porque el código aplica los valores calibrados con el sensor y no el 0,8 teórico (decisión del 2026-11-20, brecha B7).

## Escenarios

| Escenario                                                                                                                                                                 | Spec                                      | Criterio que cubre                                                                                                      |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Credenciales incorrectas muestran "Usuario o contraseña incorrectos"                                                                                                      | `e2e/f1-iniciar-sesion.spec.ts`           | F1: el mensaje no dice cuál campo falló                                                                                 |
| Sin sesión, `/historial` redirige a `/login`                                                                                                                              | `e2e/f1-iniciar-sesion.spec.ts`           | F1: sin cookie `sesion` toda página redirige a `/login`                                                                 |
| Con credenciales correctas entra a "Lotes en producción"; "Cerrar sesión" vuelve a `/login`                                                                               | `e2e/f1-iniciar-sesion.spec.ts`           | F1: comportamiento 3 y 4; logout borra la cookie                                                                        |
| "Agregar lote" → "Crear lote": la tarjeta aparece en la lista                                                                                                             | `e2e/f2-lotes.spec.ts`                    | F2: al crear el lote, la tarjeta nueva aparece                                                                          |
| Un código repetido con otras mayúsculas muestra `Ya existe un lote con el código "…"` y no crea otro                                                                      | `e2e/f2-lotes.spec.ts`                    | F2: código único sin distinguir mayúsculas (409, R1)                                                                    |
| Abrir lote → "Agregar muestra" → el puente envía la muestra → la pantalla se cierra sola con "✓ Muestra patrón guardada" → "Iniciar recolección"                          | `e2e/f3-f4-muestra-y-recoleccion.spec.ts` | F3: estados A y B, cierre automático al guardar la muestra, acción principal "Iniciar recolección"                      |
| Lectura aprobada → "✓ Aprobado"; lectura fuera de tolerancia → "✕ No aprobado" y "Alerta amarilla" en la lista; "Terminar recolección" → una lectura posterior recibe 409 | `e2e/f3-f4-muestra-y-recoleccion.spec.ts` | F4: dictamen y ΔE a la vista; F5: alerta amarilla aislada; F4 back: tras `Inactivo` las lecturas responden 409          |
| Roja grave → "⚠ Lote pausado" con el motivo → "Entendido" lo deja pausado (409 a las lecturas) → "Reanudar recolección" vuelve a recolectar y acepta lecturas             | `e2e/f5-alertas-y-pausa.spec.ts`          | F5: la roja pausa el lote, "Entendido" no lo reanuda, el lote pausado rechaza lecturas, reanudar vuelve a `Recoleccion` |
| La última lectura aparece primera en `/historial` con el código de su lote                                                                                                | `e2e/f6-historial.spec.ts`                | F6: el primer tarro es el más reciente y trae `lote_codigo`                                                             |
| `POST /api/tarros` sin clave ni sesión → 401                                                                                                                              | `e2e/seguridad.spec.ts`                   | R15 y F4 back: sin sesión ni clave no se guarda nada                                                                    |
| `POST /api/lotes` solo con la clave del dispositivo → 401 "Inicia sesión para crear un lote"                                                                              | `e2e/seguridad.spec.ts`                   | R14 y F2 back: crear un lote exige sesión                                                                               |

## En GitHub Actions

El flujo `.github/workflows/e2e.yml` (aparte de `calidad.yml`) corre `npm run test:e2e` en cada PR hacia `development` o `main`, y también a mano desde la pestaña Actions ("Run workflow").

- **Secretos del repositorio** (Settings → Secrets and variables → Actions → New repository secret): `E2E_DATABASE_URL`, `E2E_USUARIO` y `E2E_CONTRASENA`, con los mismos valores de `.env.e2e.local`. Si falta uno, el primer paso falla y dice cuál falta y dónde se agrega, sin mostrar valores.
- **`AUTH_SECRET` y `CLAVE_DISPOSITIVO`** no son secretos guardados: el flujo los genera al azar en cada ejecución (`openssl rand`, 48 bytes) y los enmascara en el registro. No son los de Vercel ni los de ningún PC.
- **Una ejecución a la vez**: todas comparten el grupo de concurrencia `e2e-neon` sin cancelar la que va corriendo, porque hay una sola rama `e2e` y un solo sensor. Si dos PR se actualizan juntos, el segundo espera su turno.
- **Si falla**, el artefacto `reporte-e2e` trae `playwright-report/` y `test-results/` durante 7 días. La traza guarda lo que se escribió en los formularios, incluido el usuario y la contraseña de pruebas: solo sirven en la rama `e2e`, pero si la contraseña queda expuesta se cambia creando de nuevo el usuario de pruebas y actualizando el secreto.
- Tiempo máximo: 30 minutos.
- Los PR que vienen de un fork no reciben los secretos, así que en ellos el flujo falla en el primer paso.
