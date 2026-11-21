---
name: backend-seguro
description: Crear o modificar el backend de ChromaCheck sin dejar huecos de seguridad. Úsala siempre que la tarea toque tablas, cambios de esquema, Route Handlers (app/api/**/route.ts), proxy.ts o cualquier archivo de lib/ que lea o escriba datos (repositorio.ts, servicio.ts, reglas.ts, db.ts, respuestas.ts, validacion.ts).
---

# Backend seguro (Next.js + PostgreSQL en Neon)

## Antes de escribir código

1. Lee `docs/datos/modelo.md` y `docs/contratos/api.md`. Si la operación no está en el contrato, o la tabla o columna no está en el modelo, detente y propón primero el cambio a esos documentos.
2. Lee la sección "Criterios de aceptación del back" de la spec en `docs/specs/`: el cambio tiene que cumplirlos todos, incluidos los casos de error.

## Capas (no se mezclan)

- `route.ts`: valida el formato de la entrada y la sesión, llama al servicio y responde con `responderExito`, `responderError` o `responderErrorInterno`. Sin SQL ni reglas de negocio.
- `servicio.ts`: orquesta y decide. Sin SQL.
- `reglas.ts`: funciones puras. Sin base de datos, red ni fechas del sistema.
- `repositorio.ts`: solo consultas SQL parametrizadas (`$1`, `$2`, …). Nunca SQL armado pegando texto que viene de la petición.

## Base de datos

- Todo cambio de tabla se prueba primero en el SQL Editor de Neon y se documenta en `docs/datos/modelo.md` en el mismo PR. Nunca se aplica un cambio de esquema sin mostrar el SQL y esperar la aprobación de Lauren.
- Las reglas "no puede haber dos…" se garantizan con UNIQUE (también parcial) y los valores permitidos con CHECK. El servidor repite la regla solo para dar un mensaje claro.
- El error 23505 (valor repetido) se traduce a 409 con el mensaje del contrato, nunca a 500.
- Varias escrituras que deben pasar juntas van en `ejecutarEnTransaccion` o en una sola sentencia.
- No insertar datos de prueba con SQL manual: se crean con la API y llevan el prefijo `TEST_`.

## Acceso

- Toda ruta nueva fuera de `/api/auth/*` pasa por `proxy.ts`: sesión o clave del dispositivo.
- Si solo la usa la web, la ruta verifica además la sesión con `obtenerIdUsuarioDePeticion` y responde 401 sin ella, aunque llegue la clave del dispositivo.
- El usuario sale de la cookie firmada, nunca del cuerpo, de la URL ni de un encabezado que mande el cliente.
- ΔE, dictamen, estado del lote y nivel de alerta los decide el servidor; nunca se leen de la petición.

## Respuestas y errores

- Formato `{ exito, datos }` o `{ exito, error }` y los códigos exactos del contrato (200, 201, 400, 401, 404, 409, 500).
- Al cliente nunca le llegan mensajes de PostgreSQL, trazas ni nombres de tablas o índices: `responderErrorInterno` los deja en el registro del servidor.
- Mensajes en español, con trato de usted, sin valores internos como `Recoleccion` cuando los vaya a leer el operario.

## Secretos

- `DATABASE_URL`, `AUTH_SECRET` y `CLAVE_DISPOSITIVO` solo en `.env.local` (ignorado por Git) y en las variables de Vercel. Ninguno lleva el prefijo `NEXT_PUBLIC_`.
- Nunca escribir una clave, contraseña o cadena de conexión en el código, en un commit, en un PR ni en la consola.

## Al terminar

- Lista qué criterios de aceptación del back cubre el cambio y cómo probar cada uno sin usar el formulario (curl o el script de pruebas), con al menos un caso de error.
- `npm test`, `npx prettier --check .`, `npm run lint` y `npm run build` sin errores. Si cambió una ruta o el esquema, `docs/contratos/api.md` o `docs/datos/modelo.md` se actualizan en el mismo PR.
