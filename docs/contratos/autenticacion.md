# Autenticación

## Tabla `usuarios`

La crea [`db/migraciones/0001_esquema_inicial.sql`](../../db/migraciones/0001_esquema_inicial.sql), con los tipos confirmados en Neon el 2026-11-20:

```sql
CREATE TABLE usuarios (
  id SERIAL PRIMARY KEY,
  nombre_usuario VARCHAR(50) NOT NULL UNIQUE,
  contrasena_hash VARCHAR(255) NOT NULL,
  fecha_creacion TIMESTAMP NOT NULL DEFAULT NOW()
);
```

El hash `sal:hash` de scrypt ocupa 161 caracteres (32 de la sal, los dos puntos y 128 del hash), así que cabe en `VARCHAR(255)`.

La contraseña nunca se guarda en texto plano: se guarda el hash `sal:hash` generado con scrypt (`lib/modulos/auth/contrasenas.ts`).

## Variables de entorno (`.env.local`)

| Variable            | Uso                                                                     |
| ------------------- | ----------------------------------------------------------------------- |
| `AUTH_SECRET`       | Clave para firmar la cookie de sesión. Mínimo 32 caracteres.            |
| `CLAVE_DISPOSITIVO` | Clave del dispositivo que envía el puente serial. Mínimo 32 caracteres. |

## Rutas de la API

### `POST /api/auth/login`

Cuerpo: `{ "nombreUsuario": string, "contrasena": string }`

| Caso                           | Respuesta                                                                                        |
| ------------------------------ | ------------------------------------------------------------------------------------------------ |
| Credenciales correctas         | `200` `{ exito: true, datos: { id, nombreUsuario } }` y cookie `sesion` (HttpOnly)               |
| Faltan campos                  | `400` `{ exito: false, error: "Ingresa usuario y contraseña" }`                                  |
| El cuerpo no es un objeto JSON | `400` `{ exito: false, error: "El cuerpo de la petición debe ser un objeto JSON" }`              |
| Credenciales incorrectas       | `401` `{ exito: false, error: "Usuario o contraseña incorrectos" }` (no indica cuál campo falló) |

### `POST /api/auth/logout`

Elimina la cookie `sesion`. Responde `200` `{ exito: true, datos: null }`.

Los errores internos responden `500` con `"Error interno del servidor"`, igual que el resto de la API (ver `docs/contratos/api.md`).

## Protección de rutas

`proxy.ts` revisa cada página y cada ruta de la API:

- Páginas: sin sesión válida redirige a `/login`; con sesión, `/login` redirige al inicio.
- `/api/auth/*`: pasa sin revisión, porque es por donde se inicia y se cierra la sesión.
- El resto de `/api`: pasa con la cookie `sesion` válida o con la clave del dispositivo. Si no, responde `401` con `"Inicie sesión o envíe la clave del dispositivo"`. El acceso de cada ruta está en [api.md](api.md#acceso).

Los endpoints de escritura que usa solo la web verifican además la sesión por su cuenta con `verificarTokenSesion` y responden `401` sin ella, aunque traigan la clave del dispositivo; hoy es el caso de `POST /api/lotes`, `PATCH /api/lotes/[id]/captura` y `POST /api/lotes/[id]/reanudar`.

## Clave del dispositivo

El puente serial (historia 06) no inicia sesión: se identifica con una clave compartida que envía en el encabezado `x-clave-dispositivo`. El servidor la compara con la variable `CLAVE_DISPOSITIVO` en `lib/modulos/auth/claveDispositivo.ts`:

- **Falla cerrada.** Si `CLAVE_DISPOSITIVO` falta o tiene menos de 32 caracteres, ninguna clave es válida: sin clave configurada no entra nadie por esta vía, solo con sesión.
- **Comparación en tiempo constante.** Si las longitudes difieren, la clave es inválida. Si son iguales, se recorren siempre todos los caracteres acumulando el XOR de sus códigos, así el tiempo de respuesta no revela cuántos caracteres coinciden.

La misma clave se configura en Vercel y en el equipo del taller donde corre el puente (ver [despliegue.md](../operacion/despliegue.md)).

## Crear un usuario

No hay registro público. Los usuarios los crea el equipo desde la terminal:

```bash
node --env-file=.env.local --experimental-strip-types scripts/crear-usuario.ts <nombre_usuario> <contrasena>
```
