import {
  esClaveDispositivoValida,
  esPeticionDeDispositivo,
  LONGITUD_MINIMA_CLAVE,
  NOMBRE_ENCABEZADO_CLAVE,
} from './claveDispositivo';

// Clave solo para las pruebas: no depende de .env.local
const CLAVE_DE_PRUEBA = 'clave-de-prueba-del-dispositivo-con-mas-de-32-caracteres';

test('acepta la clave correcta', () => {
  expect(esClaveDispositivoValida(CLAVE_DE_PRUEBA, CLAVE_DE_PRUEBA)).toBe(true);
});

test('rechaza una clave de la misma longitud pero distinta', () => {
  const distinta = `${CLAVE_DE_PRUEBA.slice(0, -1)}X`;
  expect(esClaveDispositivoValida(distinta, CLAVE_DE_PRUEBA)).toBe(false);
});

test.each([`${CLAVE_DE_PRUEBA}x`, CLAVE_DE_PRUEBA.slice(0, -1)])(
  'rechaza la clave de otra longitud %p',
  (clave) => {
    expect(esClaveDispositivoValida(clave, CLAVE_DE_PRUEBA)).toBe(false);
  }
);

test.each([null, undefined, ''])('rechaza la petición sin clave (%p)', (clave) => {
  expect(esClaveDispositivoValida(clave, CLAVE_DE_PRUEBA)).toBe(false);
});

test('falla cerrada: sin la variable de entorno no acepta ninguna clave', () => {
  expect(esClaveDispositivoValida(CLAVE_DE_PRUEBA, undefined)).toBe(false);
  expect(esClaveDispositivoValida('', '')).toBe(false);
});

test('falla cerrada: una variable de menos de 32 caracteres no sirve', () => {
  const corta = 'a'.repeat(LONGITUD_MINIMA_CLAVE - 1);
  expect(esClaveDispositivoValida(corta, corta)).toBe(false);

  const justa = 'a'.repeat(LONGITUD_MINIMA_CLAVE);
  expect(esClaveDispositivoValida(justa, justa)).toBe(true);
});

describe('esPeticionDeDispositivo', () => {
  let claveOriginal: string | undefined;

  beforeEach(() => {
    claveOriginal = process.env.CLAVE_DISPOSITIVO;
    process.env.CLAVE_DISPOSITIVO = CLAVE_DE_PRUEBA;
  });

  afterEach(() => {
    // Asignar undefined a process.env guarda el texto "undefined": por eso se borra
    if (claveOriginal === undefined) {
      delete process.env.CLAVE_DISPOSITIVO;
    } else {
      process.env.CLAVE_DISPOSITIVO = claveOriginal;
    }
  });

  function crearPeticion(clave?: string) {
    const encabezados: Record<string, string> = clave ? { [NOMBRE_ENCABEZADO_CLAVE]: clave } : {};
    return new Request('http://localhost/api/tarros', { headers: encabezados });
  }

  test('acepta la petición con la clave en el encabezado', () => {
    expect(esPeticionDeDispositivo(crearPeticion(CLAVE_DE_PRUEBA))).toBe(true);
  });

  test('rechaza la petición sin el encabezado o con otra clave', () => {
    expect(esPeticionDeDispositivo(crearPeticion())).toBe(false);
    expect(esPeticionDeDispositivo(crearPeticion(`${CLAVE_DE_PRUEBA}x`))).toBe(false);
  });

  test('rechaza la petición si falta CLAVE_DISPOSITIVO en el servidor', () => {
    delete process.env.CLAVE_DISPOSITIVO;
    expect(esPeticionDeDispositivo(crearPeticion(CLAVE_DE_PRUEBA))).toBe(false);
  });
});
