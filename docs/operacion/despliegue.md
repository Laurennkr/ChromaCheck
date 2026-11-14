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
