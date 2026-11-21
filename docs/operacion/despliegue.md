# Integración continua y despliegue

## Integración continua

La Action `calidad` ([.github/workflows/calidad.yml](../../.github/workflows/calidad.yml)) corre en cada PR y en cada push a `development` y `main`. Revisa:

- Formato con Prettier (`npm run formato:revisar`).
- ESLint sin advertencias (`npm run lint -- --max-warnings=0`).
- Pruebas de Jest con cobertura (`npm run test:cobertura`).
- Compilación y tipos con `npm run build`.
- Pruebas del puente serial con pytest (`python -m pytest -q` en `puente-serial/`).

No necesita secretos: las pruebas simulan la base de datos y la compilación no se conecta a Neon. Si llega un push nuevo a la misma rama, la ejecución anterior se cancela.

## Despliegue

El monolito (pantallas y API) es una sola app de Next.js y se despliega en Vercel:

- Cada PR tiene su propia vista previa.
- Al fusionar en `main`, Vercel publica la versión de producción.
- `DATABASE_URL`, `AUTH_SECRET` y `CLAVE_DISPOSITIVO` se configuran en el panel de Vercel, nunca en el repo.

### Clave del dispositivo

`CLAVE_DISPOSITIVO` es la clave con la que el puente serial entra a la API (ver [autenticacion.md](../contratos/autenticacion.md#clave-del-dispositivo)). Debe ser la misma en dos lugares:

- En Vercel, en los entornos Production y Preview.
- En el equipo del taller donde corre el puente, como variable de entorno (ver `puente-serial/README.md`).

Tiene mínimo 32 caracteres. Para generarla, en Git Bash:

```bash
openssl rand -base64 32
```

Si falta en Vercel, la API rechaza al puente con `401`; si falta en el equipo del taller, el puente no arranca.

No se usa Render: la interfaz y la API son una sola app, y el puente serial no va en la nube. Corre en la PC del taller, junto al Arduino, conectado por USB, y envía las lecturas a la API por HTTP.

## Migraciones de la base

Los cambios de esquema están en [`db/migraciones/`](../../db/migraciones/README.md). Vercel no aplica migraciones: se aplican a mano, con el MCP de Neon o el SQL Editor, siempre en este orden y nunca sin la aprobación de Lauren.

1. **Rama `desarrollo` de Neon.** Se cuentan las filas que la migración violaría, se aplica ahí (`run_sql_transaction`) y se prueban los intentos que deben fallar. Si la rama está muy atrasada, se restablece antes desde la principal (`reset_from_parent`); eso borra los datos `TEST_` de esa rama.
2. **Aprobación.** El PR muestra el SQL y el resultado de las pruebas. Lauren escribe "aprobado" antes de tocar la principal.
3. **Preparar en la principal.** `prepare_database_migration` con el SQL de la migración: Neon crea una rama temporal desde la principal y aplica ahí la migración. Se revisa el resultado con las consultas del anexo de [modelo.md](../datos/modelo.md#anexo-consultas-para-confirmar-el-esquema).
4. **Completar.** Solo si todo coincide, `complete_database_migration` aplica la migración en la rama principal y borra la temporal. Si algo falla, no se completa: la principal queda como estaba.
5. **Registrar.** Se anota en el PR (o en uno nuevo) la fecha en que se aplicó en la principal y se actualiza el estado en `docs/datos/modelo.md`.

Para el desarrollo local contra la rama `desarrollo`, `.env.development.local` (ignorado por Git) lleva solo su `DATABASE_URL`; `next dev` lo lee antes que `.env.local`, de donde siguen saliendo `AUTH_SECRET` y `CLAVE_DISPOSITIVO`. `npm run build` y Vercel no lo leen.
