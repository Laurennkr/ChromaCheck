# F7 · Fondo claro u oscuro

## Historia

Como operario, quiero elegir entre fondo claro y fondo oscuro para trabajar con el brillo que me resulte más cómodo en el puesto del sensor.

## Relación

Todas las pantallas. `app/layout.tsx` (lee la cookie `tema`, pone `data-tema` en `<html>` y elige el logo), `app/componentes/SelectorTema.tsx` (el control "Fondo:"), `app/acciones/tema.ts` (Server Function que guarda la cookie), `lib/tema.ts` (nombre, duración y lectura de la cookie), `app/globals.css` (valores de los tokens para cada tema), `public/logo-negro.png` y `public/logo-blanco.png`, y el `matcher` de `proxy.ts` (los logos deben verse sin sesión). Diseño: [Tema oscuro](../diseno/identidad-visual.md#tema-oscuro). Antes de usar `cookies()`, leer la guía de Next.js 16 en `node_modules/next/dist/docs/` (ver `AGENTS.md`).

## Comportamiento

1. El encabezado muestra la etiqueta "Fondo:" y dos botones con texto: "Claro" y "Oscuro".
2. Sin cookie `tema`, la aplicación usa fondo claro (decisión del 2026-11-13).
3. Al pulsar un botón, el fondo y el logo cambian en ese momento, el botón elegido muestra "✓" y la elección se guarda en la cookie `tema` por 1 año.
4. En cada carga, el servidor lee la cookie y envía `<html data-tema="claro">` o `<html data-tema="oscuro">`, así la página llega ya con su tema y su logo y no parpadea.
5. El encabezado sigue el tema: con fondo claro usa el token `encabezado` (`#FCFBF8`) y muestra el logo de letras negras (`logo-negro.png`); con fondo oscuro usa `encabezado` (`#25282C`) y muestra el logo de letras blancas (`logo-blanco.png`). En los dos temas lleva un borde inferior de 2 px.
6. El color real de la pintura (`resultado_hex`) se muestra igual en los dos temas, sin borde y con su código hex debajo.

## Criterios de aceptación

Estado:

- [x] El encabezado muestra "Fondo:" seguido de los botones "Claro" y "Oscuro", con texto y sin mayúsculas sostenidas.
- [x] Los dos botones miden 56 px de alto.
- [x] El botón del tema activo muestra "✓" y tiene `aria-pressed="true"`; el otro tiene `aria-pressed="false"`.
- [x] Sin la cookie `tema` (ventana privada), la aplicación se ve con fondo claro.
- [x] Al pulsar "Oscuro", el fondo cambia sin recargar la página.
- [x] Después de elegir "Oscuro", la cookie `tema` vale `oscuro` y vence en 1 año.
- [x] Al recargar con fondo oscuro, la página no muestra el fondo claro ni por un instante.
- [x] El código fuente de la página (Ver código fuente) ya trae `data-tema` en `<html>`.
- [x] El control y el tema elegido se ven en `/login`, `/`, `/lotes/[id]` y `/historial`.
- [ ] La pantalla completa de captura usa el tema elegido.
- [x] Con fondo claro, el encabezado usa el token `encabezado` y muestra el logo de letras negras.
- [x] Con fondo oscuro, el encabezado usa el token `encabezado` y muestra el logo de letras blancas.
- [x] En los dos temas, el encabezado tiene un borde inferior de 2 px.
- [x] Al pulsar "Claro" u "Oscuro", el logo cambia sin recargar la página.
- [x] Al recargar, no aparece el logo del otro tema ni por un instante.
- [x] En `/login`, sin sesión, el logo se ve en los dos temas (no aparece una imagen rota).
- [x] El cuadro de color de un tarro muestra el mismo hex en los dos temas.
- [x] El cuadro de color no tiene borde en ninguno de los dos temas; su código hex, debajo, lo identifica aunque el color se parezca al fondo.
- [ ] Con la herramienta de contraste del navegador, todo el texto da 7:1 o más en los dos temas.
- [ ] A 390 px de ancho, el control no se corta ni provoca desplazamiento horizontal.

## Criterios de aceptación del back

No aplica a la API ni a la base: el tema se guarda en la cookie `tema` con la Server Function `guardarTema` (`app/acciones/tema.ts`), y `leerTema` (`lib/tema.ts`) lo interpreta. Por decisión, la preferencia no se guarda en la base (ver "Fuera de alcance"). La casilla se marca cuando el criterio se verificó (en el navegador, con prueba E2E o en la verificación registrada en [pruebas/criterios-back.md](../pruebas/criterios-back.md)). Los no marcados quedan pendientes de verificación.

- [x] Dado `guardarTema("oscuro")`, cuando se ejecuta, entonces la cookie `tema` vale `oscuro` y vence en 1 año.
- [x] Dado un valor desconocido (`guardarTema("rosado")`) o una cookie alterada, cuando se lee el tema, entonces se usa `claro` y no se produce un error.

## Fuera de alcance

Seguir el tema del sistema operativo (`prefers-color-scheme`), más de dos temas, guardar la preferencia en la base de datos.
