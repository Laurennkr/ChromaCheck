# F2 · Ver y agregar lotes

## Historia

Como operario, quiero encontrar el lote del color que voy a revisar y abrirlo con un clic, y agregar uno nuevo cuando llega otra mezcla, para empezar la revisión sin buscar.

## Relación

Pantalla `/`. API: `GET /api/lotes`, `POST /api/lotes` ([contratos/api.md](../contratos/api.md)). Historias HU-H3 y HU-H6; casos CP-06, CP-07, CP-08 y CP-09.

## Comportamiento

1. La pantalla muestra los lotes del más reciente al más antiguo, uno por tarjeta.
2. Cada tarjeta muestra el código, el estado (Activo o Pausado), el color de la muestra patrón, la desviación promedio y si el lote está usando el sensor.
3. "Agregar lote" abre un formulario con el código; al crearlo, la tarjeta nueva aparece en la lista.
4. "Abrir lote" en la tarjeta lleva a la pantalla del lote (F3, F4, F5).

## Criterios de aceptación

Ya en `development`:

- [x] Los lotes se ordenan por fecha de inicio, del más reciente al más antiguo.
- [x] El código es obligatorio, de 1 a 50 caracteres (sin contar los espacios de los extremos) y único sin distinguir mayúsculas; si se repite, el mensaje lo dice.
- [x] Un lote sin lecturas muestra la desviación como "—", no un error.
- [x] La tarjeta indica en texto "Esperando muestra" o "Recolectando lecturas" cuando el lote usa el sensor.
- [x] Crear un lote exige sesión iniciada.

Pendientes (identidad visual):

- [x] "Agregar lote" es el botón principal de la pantalla (72 px), debajo del título.
- [x] Los textos de la tarjeta usan 16 px como mínimo y sin mayúsculas sostenidas; los textos de captura usan las palabras nuevas ("Esperando muestra patrón", "Recolectando tarros").
- [x] El estado Pausado se distingue con "⚠ Pausado" en rojo, no solo con el color.
- [x] El cuadro de color tiene borde y su código hex va debajo, no encima del color.
- [x] El enlace de la tarjeta dice "Abrir lote", en texto normal (sin mayúsculas sostenidas).
- [x] Sin lotes, la pantalla dice "Todavía no hay lotes" y muestra el botón "Agregar lote".
- [x] En la tarjeta, el código, el cuadro de color y "Abrir lote" son lo más visible; la desviación promedio y el estado del sensor van en texto secundario de 16 px.

## Criterios de aceptación del back

Formato Dado / Cuando / Entonces, contra la API (sin usar el formulario). La casilla se marca cuando el criterio se verificó contra la API (Thunder Client sobre la rama `desarrollo` de Neon o prueba E2E). Los no marcados quedan pendientes de verificación. Los códigos y mensajes exactos están en [contratos/api.md](../contratos/api.md).

- [ ] Dados tres lotes creados en días distintos, cuando se pide `GET /api/lotes`, entonces responde 200 con los tres, del `fecha_inicio` más reciente al más antiguo.
- [ ] Dado un usuario con sesión y un código nuevo `TEST_#005_Azul`, cuando envía `POST /api/lotes`, entonces responde 201 con el lote en estado `Activo` y modo `Inactivo`.
- [ ] Dado que existe el lote `TEST_#005_Azul`, cuando se crea `  test_#005_azul  `, entonces responde 409 `Ya existe un lote con el código "test_#005_azul"` y no se crea un segundo lote.
- [ ] Dado un código vacío o solo con espacios, cuando se envía `POST /api/lotes`, entonces responde 400 `El campo "codigo" es obligatorio` y no se crea el lote (cierra DEF-01 y CP-07).
- [ ] Dado un código de 51 caracteres, cuando se envía `POST /api/lotes`, entonces responde 400 y no se crea el lote; con 50 caracteres responde 201.
- [ ] Dado el puente con su clave del dispositivo y sin sesión, cuando envía `POST /api/lotes`, entonces responde 401 "Inicia sesión para crear un lote".
- [ ] Dado un cuerpo que no es JSON, cuando se envía `POST /api/lotes`, entonces responde 400 "El cuerpo de la petición debe ser un objeto JSON".

## Fuera de alcance

Renombrar o borrar lotes, filtrar o buscar lotes.
