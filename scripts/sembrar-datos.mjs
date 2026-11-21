// Crea datos de prueba por la API, siguiendo docs/contratos/api.md (nunca con SQL manual).
// Crea 3 lotes TEST_ con su muestra y varias lecturas: aprobadas, una con alerta amarilla y un lote
// pausado por alerta roja.
//
// Uso, con `npm run dev` corriendo contra la rama "desarrollo" de Neon:
//   SEMILLA_URL=... SEMILLA_USUARIO=... SEMILLA_CONTRASENA=... \
//     node --env-file=.env.local scripts/sembrar-datos.mjs
// CLAVE_DISPOSITIVO se lee de .env.local. Ningún valor secreto se escribe en este archivo.
//
// Los colores se eligieron con los umbrales que tiene hoy lib/modulos/tarros/reglas.ts
// (tolerancia 8, roja grave desde 15), que son los valores calibrados del prototipo. El umbral 0,8 de
// los documentos es la regla teórica y no se aplica en el código (diferencia B7 aceptada).
//
// Para borrar los datos al terminar: borrar la rama "desarrollo" de Neon o restablecerla desde la
// principal (reset_from_parent). No hay API para borrar lotes.

const variables = ['SEMILLA_URL', 'SEMILLA_USUARIO', 'SEMILLA_CONTRASENA', 'CLAVE_DISPOSITIVO'];
const faltantes = variables.filter((nombre) => !process.env[nombre]);
if (faltantes.length > 0) {
  console.error(`Faltan variables de entorno: ${faltantes.join(', ')}`);
  process.exit(1);
}

const URL_BASE = process.env.SEMILLA_URL.replace(/\/$/, '');
const CLAVE_DISPOSITIVO = process.env.CLAVE_DISPOSITIVO;

// Lote, color de la muestra y lecturas [r, g, b] con el resultado que se espera
const LOTES = [
  {
    codigo: 'TEST_SEMILLA_001_Terracota',
    muestra: [227, 83, 54],
    lecturas: [
      { rgb: [227, 83, 55], espera: 'Aprobado' }, // ΔE 0,51
      { rgb: [228, 84, 54], espera: 'Aprobado' }, // ΔE 0,52
      { rgb: [226, 82, 53], espera: 'Aprobado' }, // ΔE 0,36
    ],
  },
  {
    codigo: 'TEST_SEMILLA_002_Azul',
    muestra: [74, 144, 217],
    lecturas: [
      { rgb: [75, 144, 217], espera: 'Aprobado' }, // ΔE 0,18
      { rgb: [45, 120, 185], espera: 'No Aprobado' }, // ΔE 10,10 → alerta amarilla
      { rgb: [73, 143, 216], espera: 'Aprobado' }, // ΔE 0,38
    ],
  },
  {
    codigo: 'TEST_SEMILLA_003_Verde',
    muestra: [46, 139, 87],
    lecturas: [
      { rgb: [46, 140, 88], espera: 'Aprobado' }, // ΔE 0,42
      { rgb: [10, 90, 50], espera: 'No Aprobado' }, // ΔE 19,86 → alerta roja, lote pausado
    ],
    // Tras la roja, el lote no acepta más lecturas (409)
    lecturaRechazada: [46, 139, 87],
  },
];

const aHex = (rgb) =>
  '#' +
  rgb
    .map((canal) => canal.toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase();

async function pedir(metodo, ruta, { cuerpo, cookie, conClave } = {}) {
  const encabezados = { 'content-type': 'application/json' };
  if (cookie) encabezados.cookie = cookie;
  if (conClave) encabezados['x-clave-dispositivo'] = CLAVE_DISPOSITIVO;
  const respuesta = await fetch(URL_BASE + ruta, {
    method: metodo,
    headers: encabezados,
    body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo),
  });
  const json = await respuesta.json().catch(() => ({}));
  return { estado: respuesta.status, json, respuesta };
}

function exigir(resultado, estadoEsperado, descripcion) {
  if (resultado.estado !== estadoEsperado) {
    throw new Error(
      `${descripcion}: se esperaba ${estadoEsperado} y llegó ${resultado.estado} (${resultado.json.error ?? 'sin mensaje'})`
    );
  }
  return resultado.json.datos;
}

async function iniciarSesion() {
  const resultado = await pedir('POST', '/api/auth/login', {
    cuerpo: {
      nombreUsuario: process.env.SEMILLA_USUARIO,
      contrasena: process.env.SEMILLA_CONTRASENA,
    },
  });
  exigir(resultado, 200, 'Iniciar sesión');
  const cookie = resultado.respuesta.headers
    .getSetCookie()
    .map((linea) => linea.split(';')[0])
    .find((par) => par.startsWith('sesion='));
  if (!cookie) throw new Error('El login no devolvió la cookie de sesión');
  return cookie;
}

// Si una ejecución anterior se cortó después de crear el lote, lo reutiliza (solo si no tiene tarros)
async function crearOReutilizarLote(codigo, cookie) {
  const creado = await pedir('POST', '/api/lotes', { cuerpo: { codigo }, cookie });
  if (creado.estado === 201) return creado.json.datos.id;
  if (creado.estado !== 409) exigir(creado, 201, `Crear ${codigo}`);

  const lotes = exigir(await pedir('GET', '/api/lotes', { cookie }), 200, 'Listar lotes');
  const existente = lotes.find((l) => l.codigo.toLowerCase() === codigo.toLowerCase());
  const tarros = exigir(
    await pedir('GET', `/api/tarros?loteId=${existente.id}`, { cookie }),
    200,
    `Tarros de ${codigo}`
  );
  if (tarros.length > 0) {
    throw new Error(`${codigo} ya existe con tarros; los datos semilla ya se habían creado`);
  }
  console.log(`  (reutiliza el lote ${existente.id}, que quedó sin tarros)`);
  return existente.id;
}

async function sembrarLote(lote, cookie) {
  const id = await crearOReutilizarLote(lote.codigo, cookie);
  const captura = (modo) =>
    pedir('PATCH', `/api/lotes/${id}/captura`, { cuerpo: { modo }, cookie });

  // Muestra: la web activa el modo y el puente envía el tarro con su clave
  exigir(await captura('Muestra'), 200, `${lote.codigo}: modo Muestra`);
  exigir(
    await pedir('POST', '/api/tarros', {
      cuerpo: { loteId: id, resultadoHex: aHex(lote.muestra), esMuestra: true },
      conClave: true,
    }),
    201,
    `${lote.codigo}: muestra`
  );

  // Lecturas
  exigir(await captura('Recoleccion'), 200, `${lote.codigo}: modo Recoleccion`);
  for (const lectura of lote.lecturas) {
    const tarro = exigir(
      await pedir('POST', '/api/tarros', {
        cuerpo: { loteId: id, resultadoHex: aHex(lectura.rgb), rgb: lectura.rgb },
        conClave: true,
      }),
      201,
      `${lote.codigo}: lectura ${aHex(lectura.rgb)}`
    );
    const coincide = tarro.resultado === lectura.espera ? 'ok' : `se esperaba ${lectura.espera}`;
    console.log(
      `  ${aHex(lectura.rgb)}  ΔE ${tarro.desviacion_delta_e}  ${tarro.resultado} (${coincide})`
    );
  }

  if (lote.lecturaRechazada) {
    const rechazo = await pedir('POST', '/api/tarros', {
      cuerpo: {
        loteId: id,
        resultadoHex: aHex(lote.lecturaRechazada),
        rgb: lote.lecturaRechazada,
      },
      conClave: true,
    });
    console.log(`  Lectura tras la roja: ${rechazo.estado} · ${rechazo.json.error}`);
  }

  // Detener la captura (en el lote pausado ya está en Inactivo; pedirlo de nuevo se permite)
  const final = exigir(await captura('Inactivo'), 200, `${lote.codigo}: modo Inactivo`);
  console.log(`  Estado final: ${final.estado}, modo ${final.modo_captura}`);
}

try {
  const cookie = await iniciarSesion();
  for (const lote of LOTES) {
    console.log(lote.codigo);
    await sembrarLote(lote, cookie);
  }
  console.log('Datos semilla creados');
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
