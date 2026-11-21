# F1 · Iniciar sesión

## Historia

Como usuario del taller, quiero entrar con mi usuario y contraseña para que solo el personal autorizado maneje los lotes y el sensor.

## Relación

Pantalla `/login`. API: `POST /api/auth/login`, `POST /api/auth/logout` ([contratos/autenticacion.md](../contratos/autenticacion.md)). Responsable: Lauren.

## Comportamiento

1. Sin sesión, cualquier pantalla lleva a `/login`.
2. El usuario escribe usuario y contraseña y pulsa "Ingresar".
3. Si son correctos, llega a la pantalla de lotes (F2).
4. "Cerrar sesión", en el encabezado, lo devuelve a `/login`.

## Criterios de aceptación

Ya en `development`:

- [x] Sin cookie `sesion` válida, toda página redirige a `/login`; con sesión, `/login` redirige a `/`.
- [x] Con credenciales incorrectas el mensaje no dice cuál campo falló.
- [x] La contraseña se guarda como hash (scrypt), nunca en texto plano.

Pendientes (identidad visual):

- [x] Campos de 56 px de alto con etiqueta visible "Usuario" y "Contraseña" (sin mayúsculas sostenidas).
- [x] Botón "Mostrar contraseña" con texto, para revisar lo escrito.
- [x] Botón "Ingresar" principal de 72 px de alto y ancho completo del formulario.
- [x] El error aparece debajo del botón, en texto de 18 px con "⚠", y no se borra solo.

## Criterios de aceptación del back

Formato Dado / Cuando / Entonces, contra la API (sin usar el formulario). La casilla se marca cuando el criterio se verificó contra la API (Thunder Client sobre la rama `desarrollo` de Neon, prueba E2E o la verificación registrada en [pruebas/criterios-back.md](../pruebas/criterios-back.md)). Los no marcados quedan pendientes de verificación. Los códigos y mensajes exactos están en [contratos/api.md](../contratos/api.md).

- [x] Dado un usuario creado con `scripts/crear-usuario.ts`, cuando envía `POST /api/auth/login` con su usuario y contraseña, entonces responde 200 con `{ id, nombreUsuario }` y deja la cookie `sesion` HttpOnly por 8 horas.
- [x] Dado un usuario con la contraseña equivocada, cuando inicia sesión, entonces responde 401 "Usuario o contraseña incorrectos" y no deja cookie.
- [x] Dado un nombre de usuario que no existe, cuando inicia sesión, entonces responde el mismo 401 y el mismo mensaje que con la contraseña equivocada, sin revelar cuál campo falló.
- [x] Dado un cuerpo sin `nombreUsuario` o sin `contrasena`, cuando se envía el login, entonces responde 400 "Ingresa usuario y contraseña".
- [x] Dada una petición sin cookie y sin clave del dispositivo, cuando llama a `GET /api/lotes`, entonces responde 401 "Inicie sesión o envíe la clave del dispositivo".
- [x] Dada una cookie `sesion` con la firma alterada o vencida, cuando llama a cualquier ruta fuera de `/api/auth/*`, entonces responde 401 igual que sin cookie.
- [x] Dado que `CLAVE_DISPOSITIVO` falta o tiene menos de 32 caracteres en el servidor, cuando llega una petición con cualquier `x-clave-dispositivo`, entonces responde 401 (la clave falla cerrada).
- [x] Dado un usuario con sesión, cuando envía `POST /api/auth/logout`, entonces responde 200 con `datos: null` y borra la cookie; su siguiente petición a la API responde 401.
- [x] Dado un usuario creado, cuando se consulta `usuarios`, entonces `contrasena_hash` tiene la forma `sal:hash` y no contiene la contraseña.

## Fuera de alcance

Registro público, recuperar contraseña por correo, roles distintos.
