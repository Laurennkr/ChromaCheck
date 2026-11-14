# Identidad visual · ChromaCheck

## Principio rector

**Menos es más: entre menos tenga que preguntarse el usuario, mejor funciona el sistema. Cada pantalla dice qué hacer sin que el usuario pregunte nada.**

Todas las reglas de esta guía salen de este principio.

## Para quién diseñamos

Personas mayores de 55 años que trabajan de pie en el taller, junto al sensor, a veces con guantes o con las manos ocupadas, y que no usan aplicaciones a diario. De ahí salen estas reglas:

1. Letra grande y contraste alto.
2. Botones grandes, separados y con texto, nunca solo un icono.
3. Una sola acción principal por pantalla, siempre en el mismo lugar.
4. Nada se comunica solo con color: siempre símbolo y palabra.
5. Lo que hace el sensor se ve sin buscarlo (pantalla completa de captura).

Equipo supuesto: el computador del taller (pantalla de 1366 × 768 o más) a unos 60 cm; también debe funcionar en una tablet. Confirmar con el taller (ver [Preguntas abiertas](#preguntas-abiertas)).

## Tono

- Respetuoso y directo. Trata de **usted**.
- Frases cortas que dicen qué hacer: "Coloque el tarro patrón frente al sensor".
- Palabras del taller (tarro, lote, muestra patrón, color), no del sistema (modo, captura, `Recoleccion`, `modo_captura`).
- La acción conserva su nombre en todo el flujo: el botón "Agregar muestra" termina en "✓ Muestra patrón guardada", y "Iniciar recolección" termina con "Terminar recolección".
- El ΔE se presenta como "Diferencia de color: 3,42 ΔE".
- Los errores dicen qué pasó y qué hacer, sin disculpas: "El sensor está ocupado con el lote #003. Termine esa recolección para usarlo aquí."

## Marca

Colores de marca. Se usan **puros solo en el logo y en piezas gráficas** (presentaciones, afiches, portadas):

| Nombre    | Hex       |
| --------- | --------- |
| Firebug   | `#C95A55` |
| Luxurious | `#D5B45A` |
| Bay View  | `#6686A3` |
| Vulcan    | `#34383D` |

En la interfaz se usan tonos de esos mismos colores, ajustados para lograr un contraste de 7:1 (WCAG 2.2, criterio 1.4.6). Esos tonos son los tokens de la [Paleta](#paleta).

## Paleta

Este es el tema claro, el de por defecto y el recomendado: fondo claro y cálido, y texto oscuro. El encabezado sigue el tema elegido (ver [Tema oscuro](#tema-oscuro)). Los tokens tienen los mismos nombres en los dos temas; solo cambian sus valores.

| Token                        | Hex       | Uso                                                | Contraste                                             |
| ---------------------------- | --------- | -------------------------------------------------- | ----------------------------------------------------- |
| `fondo`                      | `#F5F2EC` | Fondo de las pantallas                             | —                                                     |
| `superficie`                 | `#FCFBF8` | Tarjetas, tablas, pantalla completa                | —                                                     |
| `encabezado`                 | `#FCFBF8` | Fondo del encabezado (logo de letras negras)       | —                                                     |
| `texto`                      | `#34383D` | Texto principal (Vulcan)                           | 11,4:1 sobre `superficie` y 10,6:1 sobre `fondo`      |
| `texto-secundario`           | `#42474E` | Etiquetas, fechas, ayudas                          | 9,1:1 sobre `superficie` y 8,4:1 sobre `fondo`        |
| `borde`                      | `#898376` | Bordes de tarjetas e inputs                        | 3,6:1 sobre `superficie` y 3,4:1 sobre `fondo`        |
| `accion`                     | `#3D5266` | Botón principal, enlaces, foco, estado "Esperando" | 7,8:1 sobre `superficie` y 7,2:1 sobre `fondo`        |
| `texto-sobre-accion`         | `#FFFFFF` | Texto sobre `accion`                               | 8,1:1 sobre `accion`                                  |
| `aprobado`                   | `#155C33` | Dictamen Aprobado, "Muestra patrón guardada"       | 8,0:1 con `texto-sobre-aprobado`                      |
| `texto-sobre-aprobado`       | `#FFFFFF` | Texto sobre `aprobado`                             | —                                                     |
| `aprobado-suave`             | `#E3F4E8` | Fondo de avisos de éxito                           | —                                                     |
| `texto-sobre-aprobado-suave` | `#14532D` | Texto sobre `aprobado-suave`                       | 8,0:1                                                 |
| `alerta`                     | `#A38229` | Borde y franja de la alerta amarilla               | 3,1:1 sobre `alerta-suave` y 3,5:1 sobre `superficie` |
| `alerta-suave`               | `#F5EDD6` | Fondo de la alerta amarilla                        | —                                                     |
| `texto-sobre-alerta-suave`   | `#5A4817` | Texto sobre `alerta-suave`                         | 7,6:1                                                 |
| `peligro`                    | `#8D312D` | No aprobado, alerta roja, lote pausado, "Detener"  | 7,8:1 sobre `superficie` y 7,2:1 sobre `fondo`        |
| `texto-sobre-peligro`        | `#FFFFFF` | Texto sobre `peligro`                              | 8,1:1 sobre `peligro`                                 |

`alerta` nunca se usa para texto: es un elemento gráfico (borde y franja) y cumple el mínimo de 3:1 que pide WCAG 2.2 para elementos gráficos (criterio 1.4.11). El texto de la alerta amarilla va en `texto-sobre-alerta-suave`.

Origen de los tonos: `accion` es Bay View oscurecido, `alerta` es Luxurious oscurecido, `peligro` es Firebug oscurecido y `texto` es Vulcan. El verde de `aprobado` no es de la marca: se conserva porque significa "aprobado" en cualquier taller.

Significado fijo de los colores:

| Color  | Significa                                    | Siempre va con         |
| ------ | -------------------------------------------- | ---------------------- |
| Azul   | Acción disponible o el sensor está esperando | Texto del botón o "●"  |
| Verde  | Aprobado o guardado                          | "✓" y la palabra       |
| Dorado | Alerta amarilla: desviación aislada          | "⚠" y la palabra       |
| Rojo   | No aprobado, alerta roja, lote pausado       | "✕" o "⚠" y la palabra |

### Cuadro de color

El color de la pintura (`resultado_hex`) es el único color que no viene de la paleta.

- El cuadro con el color de la pintura **no lleva borde**: el color se muestra tal cual, sin marco que cambie cómo se percibe.
- El código hex va **debajo** del cuadro, nunca encima del color; así se lee siempre, sea cual sea la pintura, y nombra el cuadro aunque su color se parezca al fondo.
- El cuadro vacío ("Sin lectura") conserva su línea punteada `borde`, porque no es un color de pintura.

## Tema oscuro

El operario puede elegir fondo oscuro con el control "Fondo:" del encabezado ([F7](../specs/F7-fondo-claro-oscuro.md)). El tema claro es el de por defecto y sigue siendo el recomendado.

| Token                        | Hex       | Uso                                                | Contraste                 |
| ---------------------------- | --------- | -------------------------------------------------- | ------------------------- |
| `fondo`                      | `#25282C` | Fondo de las pantallas                             | —                         |
| `superficie`                 | `#34383D` | Tarjetas, tablas, pantalla completa (Vulcan)       | —                         |
| `encabezado`                 | `#25282C` | Fondo del encabezado (logo de letras blancas)      | —                         |
| `texto`                      | `#F5F2EC` | Texto principal                                    | 10,6:1 sobre `superficie` |
| `texto-secundario`           | `#CBCFD3` | Etiquetas, fechas, ayudas                          | 7,5:1 sobre `superficie`  |
| `borde`                      | `#8B8579` | Bordes de tarjetas e inputs                        | 3,2:1 sobre `superficie`  |
| `accion`                     | `#BECCD8` | Botón principal, enlaces, foco, estado "Esperando" | 7,2:1 sobre `superficie`  |
| `texto-sobre-accion`         | `#25282C` | Texto sobre `accion`                               | 9,0:1 sobre `accion`      |
| `aprobado`                   | `#7EE2A8` | Dictamen Aprobado, "Muestra patrón guardada"       | 7,5:1 sobre `superficie`  |
| `texto-sobre-aprobado`       | `#25282C` | Texto sobre `aprobado`                             | 9,4:1                     |
| `aprobado-suave`             | `#12301F` | Fondo de avisos de éxito                           | —                         |
| `texto-sobre-aprobado-suave` | `#A7F3C1` | Texto sobre `aprobado-suave`                       | 11,1:1                    |
| `alerta`                     | `#CBA334` | Borde y franja de la alerta amarilla               | 5,0:1                     |
| `alerta-suave`               | `#413411` | Fondo de la alerta amarilla                        | —                         |
| `texto-sobre-alerta-suave`   | `#E1CA8A` | Texto sobre `alerta-suave`                         | 7,6:1                     |
| `peligro`                    | `#EBC1BF` | No aprobado, alerta roja, lote pausado, "Detener"  | 7,3:1 sobre `superficie`  |
| `texto-sobre-peligro`        | `#25282C` | Texto sobre `peligro`                              | 9,1:1                     |

- El encabezado sigue el tema: en el claro es `encabezado` (`#FCFBF8`) con `logo-negro.png` (letras negras); en el oscuro, `#25282C` con `logo-blanco.png` (letras blancas). En los dos lleva un borde inferior de 2 px `borde`. El logo cambia al pulsar "Claro" u "Oscuro", sin recargar y sin parpadeo.
- El color de la pintura (`resultado_hex`) no cambia con el tema. El cuadro no lleva borde en ninguno de los dos temas; el código hex debajo lo identifica aunque la pintura se parezca al fondo.
- El significado de cada color (azul, verde, dorado, rojo) es el mismo en los dos temas, siempre con símbolo y palabra.
- Contrastes calculados con la fórmula de WCAG 2.2.

## Archivos del logo

| Versión        | Tema         | Archivo que usa la app   |
| -------------- | ------------ | ------------------------ |
| Letras negras  | Fondo claro  | `public/logo-negro.png`  |
| Letras blancas | Fondo oscuro | `public/logo-blanco.png` |

- La app usa las copias de `public/`; no se mueven ni se renombran.
- Las fuentes originales del logo van en `docs/diseno/logos/`: las de letras negras en `docs/diseno/logos/negro/` y las de letras blancas en `docs/diseno/logos/blanco/`, con nombres en español, en minúsculas y con guiones (por ejemplo, `logo-chromacheck-negro.png`).
- El logo usa los colores de marca puros (ver [Marca](#marca)).

## Tipografía

Dos familias, cada una con un papel:

- **Montserrat Bold (700)**: títulos de pantalla, títulos de sección, título de la pantalla completa, dictamen y ΔE grandes.
- **Montserrat SemiBold (600)**: subtítulos, botones, enlaces de navegación, encabezados de tabla, etiquetas de campos e insignias de resultado.
- **Inter Regular (400)**: texto y datos (párrafos, celdas, fechas, ayudas, mensajes, códigos hex).

Inter solo se carga en 400. Ningún texto en Inter lleva negrita.

| Uso                                   | Tamaño | Fuente y peso             | Tailwind    |
| ------------------------------------- | ------ | ------------------------- | ----------- |
| Texto base                            | 18 px  | Inter Regular (400)       | `text-lg`   |
| Mínimo absoluto (fechas, ayudas)      | 16 px  | Inter Regular (400)       | `text-base` |
| Encabezados de tabla y etiquetas      | 16 px  | Montserrat SemiBold (600) | `text-base` |
| Títulos de sección                    | 24 px  | Montserrat Bold (700)     | `text-2xl`  |
| Título de pantalla                    | 30 px  | Montserrat Bold (700)     | `text-3xl`  |
| Título de la pantalla completa        | 48 px  | Montserrat Bold (700)     | `text-5xl`  |
| Dictamen y ΔE en la pantalla completa | 60 px  | Montserrat Bold (700)     | `text-6xl`  |

- Los números de ΔE usan `tabular-nums` para que no bailen al cambiar.
- Nunca `text-xs` ni `text-sm`.
- Sin mayúsculas sostenidas (`uppercase`) ni espaciado entre letras (`tracking-*`): se escribe "Lotes en producción", no "LOTES EN PRODUCCIÓN". Las mayúsculas sostenidas se leen más lento.
- Interlineado de 1,5 en párrafos; líneas de máximo 70 caracteres.

## Botones y controles

| Tipo       | Aspecto                                                               | Alto mínimo                                                             | Ejemplo                        |
| ---------- | --------------------------------------------------------------------- | ----------------------------------------------------------------------- | ------------------------------ |
| Principal  | Relleno `accion`, texto `texto-sobre-accion` en Montserrat SemiBold   | 56 px (`h-14`); 72 px (`h-18`) si es la acción principal de la pantalla | "Agregar muestra"              |
| Secundario | Fondo `superficie`, borde 2 px `texto`, Montserrat SemiBold           | 56 px                                                                   | "Cancelar", "Página siguiente" |
| Peligro    | Relleno `peligro`, texto `texto-sobre-peligro` en Montserrat SemiBold | 56 px                                                                   | "Terminar recolección"         |

- Texto del botón: verbo + objeto. Nada de "Aceptar" o "Enviar" sueltos.
- Solo un botón principal por pantalla.
- Separación mínima de 16 px (`gap-4`) entre botones.
- El icono va con palabra: "✕ Cerrar", no solo "✕".
- Estados del botón: normal, encima (se oscurece), foco (contorno de 4 px `accion` separado 3 px), enviando (cambia el texto: "Abriendo…") y deshabilitado (con una frase al lado que explica por qué).
- Campos de texto: alto 56 px, texto 18 px, etiqueta visible encima (el `placeholder` no reemplaza la etiqueta).

## Pantalla completa de captura

Es el elemento que define a ChromaCheck: muestra lo que hace el sensor, a pantalla completa. El flujo del lote, en el orden en que lo vive el usuario, es **Agregar muestra → Iniciar recolección**.

### Estado A · El lote no tiene muestra patrón

Al abrir un lote Activo, en modo `Inactivo` y sin muestra, la pantalla completa se abre sola. Vuelve a salir cada vez que se entra al lote mientras no tenga muestra.

```text
┌───────────────────────────────────────────────────────────────┐
│ Lote #005_Azul_Cielo                               ✕ Cerrar   │ ← franja azul
├───────────────────────────────────────────────────────────────┤
│                                                               │
│   Agregue la muestra patrón de este lote            (48 px)   │
│                                                               │
│   Haga clic en Agregar muestra y luego coloque el tarro       │
│   patrón frente al sensor.                                    │
│                                                               │
│              ┌───────────────────────────┐                    │
│              │      Agregar muestra      │  (72 px, centrado) │
│              └───────────────────────────┘                    │
└───────────────────────────────────────────────────────────────┘
```

- "✕ Cerrar" y Esc cierran la pantalla **sin llamar a la API**: el lote sigue en `Inactivo`.
- Al cerrarla, la pantalla del lote muestra el texto "Este lote todavía no tiene muestra patrón" y el botón centrado "Agregar muestra".

### Estado B · Esperando la muestra

Al pulsar "Agregar muestra", el lote pasa a modo `Muestra`.

```text
┌───────────────────────────────────────────────────────────────┐
│ Lote #005_Azul_Cielo                               ✕ Cerrar   │ ← franja azul
├───────────────────────────────────────────────────────────────┤
│                                                               │
│   Coloque la muestra en el sensor                   (48 px)   │
│                                                               │
│   ● Esperando la muestra…                                     │
│                                                               │
│              ┌───────────────────────────┐                    │
│              │         Cancelar          │  (72 px de alto)   │
│              └───────────────────────────┘                    │
└───────────────────────────────────────────────────────────────┘
```

- "Cancelar", "✕ Cerrar" y Esc hacen lo mismo: devuelven el lote a `Inactivo` y la pantalla vuelve al Estado A, sin cerrarse.

### Muestra guardada

Cuando el puente envía la lectura de la muestra:

- La pantalla completa se cierra sola.
- La acción principal pasa a ser "Iniciar recolección", en el mismo lugar: arriba, debajo del título del lote.
- El color de la muestra (cuadro sin borde, hex debajo) se ve una sola vez, en "Comparación de colores", con el aviso "✓ Muestra patrón guardada" debajo y el último tarro al lado.

```text
  ┌───────────────────────────┐
  │    Iniciar recolección    │  (72 px)
  └───────────────────────────┘

  Comparación de colores
  ───────────────────────────────────────────────
  Muestra patrón              Último tarro
  ┌──────────────────┐        ┌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌┐
  │      color       │        ╎                  ╎
  └──────────────────┘        └╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌┘
  #E35336                     Todavía no hay tarros revisados
  ✓ Muestra patrón guardada
```

### Recolección

Al pulsar "Iniciar recolección", el lote pasa a modo `Recoleccion` y se abre la pantalla completa. Mismo diseño y comportamiento que la antigua pantalla de revisión; solo cambian los textos.

```text
┌───────────────────────────────────────────────────────────────┐
│ Recolección del lote #005_Azul_Cielo               ✕ Cerrar   │
├───────────────────────────────────────────────────────────────┤
│   ● Recolectando tarros…                                      │
│                                                               │
│   Muestra patrón                 Último tarro                 │
│   ┌──────────────┐               ┌──────────────┐             │
│   │    color     │               │    color     │             │
│   └──────────────┘               └──────────────┘             │
│   #E35336                        #E35337                      │
│                                                               │
│   ✓ Aprobado                                        (60 px)   │
│   Diferencia de color: 3,42 ΔE                                │
│   Tarros revisados: 12. No aprobados: 1                       │
│                                                               │
│              ┌───────────────────────────┐                    │
│              │   Terminar recolección    │                    │
│              └───────────────────────────┘                    │
└───────────────────────────────────────────────────────────────┘
```

- Nunca se muestra el valor interno `Recoleccion`.

### Resumen de estados

| Estado                       | Franja | Título                                 | Botón                                       |
| ---------------------------- | ------ | -------------------------------------- | ------------------------------------------- |
| A · Sin muestra              | Azul   | Agregue la muestra patrón de este lote | Agregar muestra                             |
| B · Esperando la muestra     | Azul   | Coloque la muestra en el sensor        | Cancelar                                    |
| Recolección, último aprobado | Azul   | Recolección del lote …                 | Terminar recolección                        |
| Último con alerta amarilla   | Dorado | ⚠ Alerta amarilla: desviación aislada  | Terminar recolección                        |
| Lote pausado (alerta roja)   | Rojo   | ⚠ Lote pausado                         | Reanudar recolección y Entendido, a los 5 s |

Reglas:

- Cubre toda la pantalla con fondo opaco `superficie`; no es una ventanita que se pierde.
- Se abre sola en el estado A; en los demás casos se abre cuando el usuario pulsa el botón, o al recargar la página si el lote ya estaba capturando: lo que se ve depende del modo guardado en la base.
- Se cierra con un botón con texto o con la tecla Esc. La única vez que se cierra sola es al guardarse la muestra patrón.
- Con el lote pausado, durante los primeros 5 segundos no hay botones y Esc no hace nada: el operario lee el motivo. Después aparecen "Reanudar recolección" (principal) y "Entendido" (secundario).
- Cerrar = detener la captura (en el estado A no hay captura que detener). Si la pantalla completa está cerrada, el sensor no está capturando para ese lote.
- Al cerrar, el foco vuelve al botón principal de la pantalla del lote.
- Mientras está abierta, el encabezado y la navegación no se ven.
- Aparece con un fundido de 150 ms; sin animación si el sistema pide movimiento reducido (`prefers-reduced-motion`).

## Navegación

El flujo principal es **Abrir lote → Agregar muestra → Iniciar recolección**. La navegación no compite con él.

```text
┌───────────────────────────────────────────────────────────────┐
│ [logo] ChromaCheck     Lotes    Historial      Cerrar sesión  │ ← encabezado (sigue el tema)
└───────────────────────────────────────────────────────────────┘
```

| Elemento        | Lugar                                | Aspecto                                                                                                                        |
| --------------- | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------ |
| "Lotes"         | Encabezado, junto al logo            | Pantalla de inicio después de entrar; enlace de 56 px en Montserrat SemiBold                                                   |
| "Historial"     | Encabezado, después de Lotes         | Enlace secundario: 18 px, Montserrat SemiBold, sin relleno; alto de 56 px                                                      |
| "Fondo:"        | Encabezado, antes de "Cerrar sesión" | Etiqueta y dos botones con texto, "Claro" y "Oscuro", de 56 px; el elegido lleva "✓" ([F7](../specs/F7-fondo-claro-oscuro.md)) |
| "Cerrar sesión" | Encabezado, a la derecha             | Enlace secundario de 56 px, separado de los demás                                                                              |

- El enlace de la pantalla actual se marca con subrayado de 4 px y Montserrat Bold (700), no solo con color.
- La pantalla del lote tiene "← Volver a lotes" encima del título; no hay más niveles.
- Dentro de la pantalla completa de captura no hay navegación (ver arriba).

## Distribución de las pantallas

- Ancho máximo del contenido: 1200 px, centrado en la pantalla (`mx-auto`); el texto dentro va alineado a la izquierda.
- Debajo del título de la pantalla va la acción principal, siempre en el mismo lugar.
- 24 px entre bloques; tarjetas y botones con esquinas de 8 px; bordes de 1 a 2 px en lugar de sombras (salvo el cuadro de color, que no lleva borde).
- Diseñar primero para 1366 × 768, verificar en 768 px (tablet) y que nada se corte en 390 px.

## Referencias

Pantallas de referencia de F7 y de la pantalla completa de captura. Son anteriores al 14/11/2026: muestran la paleta, la tipografía, los bordes de los cuadros y los textos antiguos; valen solo como referencia de distribución.

- [Pantalla del lote con fondo claro](referencias/vista-previa-claro.png)
- [Pantalla del lote con fondo oscuro](referencias/vista-previa-oscuro.png)
- [Pantalla completa de captura con fondo claro](referencias/pantalla-completa-claro.png)
- [Pantalla completa de captura con fondo oscuro](referencias/pantalla-completa-oscuro.png)

## Fuentes

- W3C (2023). WCAG 2.2: criterios 1.4.6 (contraste mejorado, 7:1) y 2.5.5 (tamaño del objetivo, 44 px).
- Piepenbrock, C., Mayr, S., Mund, I. y Buchner, A. (2013). Positive display polarity is advantageous for both younger and older adults. _Ergonomics, 56_(7), 1116–1124.

## Preguntas abiertas

- ¿En qué equipo se usa la aplicación en el taller (computador, portátil, tablet) y a qué distancia del operario?
