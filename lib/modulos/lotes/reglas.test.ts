import {
  crearMensajeLoteNoPausado,
  crearMensajeOtroLoteCapturando,
  esModoCapturaValido,
  necesitaMuestraPatron,
  obtenerMotivoRechazoModoCaptura,
  obtenerMotivoRechazoReanudar,
  puedeRegistrarLectura,
  puedeRegistrarMuestra,
} from './reglas';

describe('esModoCapturaValido', () => {
  test.each(['Inactivo', 'Muestra', 'Recoleccion'])('acepta %s', (modo) => {
    expect(esModoCapturaValido(modo)).toBe(true);
  });

  test.each(['inactivo', 'Otro', '', null, 3])('rechaza %p', (valor) => {
    expect(esModoCapturaValido(valor)).toBe(false);
  });
});

describe('puedeRegistrarMuestra y puedeRegistrarLectura', () => {
  test('la muestra solo se acepta en modo Muestra', () => {
    expect(puedeRegistrarMuestra('Muestra')).toBe(true);
    expect(puedeRegistrarMuestra('Recoleccion')).toBe(false);
    expect(puedeRegistrarMuestra('Inactivo')).toBe(false);
  });

  test('las lecturas solo se aceptan en modo Recoleccion', () => {
    expect(puedeRegistrarLectura('Recoleccion')).toBe(true);
    expect(puedeRegistrarLectura('Muestra')).toBe(false);
    expect(puedeRegistrarLectura('Inactivo')).toBe(false);
  });
});

describe('obtenerMotivoRechazoModoCaptura', () => {
  const activoSinMuestra = { estado: 'Activo', tieneMuestra: false };
  const activoConMuestra = { estado: 'Activo', tieneMuestra: true };
  const pausado = { estado: 'Pausado', tieneMuestra: true };

  test('detener la captura siempre está permitido, incluso pausado', () => {
    expect(obtenerMotivoRechazoModoCaptura('Inactivo', pausado)).toBeNull();
    expect(obtenerMotivoRechazoModoCaptura('Inactivo', activoSinMuestra)).toBeNull();
  });

  test('un lote pausado no puede capturar', () => {
    expect(obtenerMotivoRechazoModoCaptura('Recoleccion', pausado)).toBe(
      'El lote está Pausado y no puede capturar lecturas'
    );
  });

  test('Muestra solo si el lote aún no tiene muestra', () => {
    expect(obtenerMotivoRechazoModoCaptura('Muestra', activoSinMuestra)).toBeNull();
    expect(obtenerMotivoRechazoModoCaptura('Muestra', activoConMuestra)).toBe(
      'El lote ya tiene muestra registrada; usa el modo Recoleccion'
    );
  });

  test('Recoleccion solo si el lote ya tiene muestra', () => {
    expect(obtenerMotivoRechazoModoCaptura('Recoleccion', activoConMuestra)).toBeNull();
    expect(obtenerMotivoRechazoModoCaptura('Recoleccion', activoSinMuestra)).toBe(
      'El lote no tiene muestra registrada; captura primero la muestra con el modo Muestra'
    );
  });
});

test('crearMensajeOtroLoteCapturando nombra el lote y su modo', () => {
  expect(crearMensajeOtroLoteCapturando('#001_Terracota', 'Muestra')).toBe(
    'El lote "#001_Terracota" ya está capturando en modo Muestra; detén esa captura antes de iniciar otra'
  );
});

describe('necesitaMuestraPatron', () => {
  const activoInactivoSinMuestra = {
    estado: 'Activo',
    modoCaptura: 'Inactivo',
    tieneMuestra: false,
  } as const;

  test('un lote Activo, en modo Inactivo y sin muestra necesita la muestra patrón', () => {
    expect(necesitaMuestraPatron(activoInactivoSinMuestra)).toBe(true);
  });

  test('un lote que ya tiene muestra no la necesita', () => {
    expect(necesitaMuestraPatron({ ...activoInactivoSinMuestra, tieneMuestra: true })).toBe(false);
  });

  test('un lote pausado no la pide', () => {
    expect(necesitaMuestraPatron({ ...activoInactivoSinMuestra, estado: 'Pausado' })).toBe(false);
  });

  test.each(['Muestra', 'Recoleccion'] as const)('un lote en modo %s no la pide', (modo) => {
    expect(necesitaMuestraPatron({ ...activoInactivoSinMuestra, modoCaptura: modo })).toBe(false);
  });
});

describe('obtenerMotivoRechazoReanudar', () => {
  const OTRO_LOTE = { codigo: 'TEST_B', modoCaptura: 'Recoleccion' };

  test('un lote Pausado con el sensor libre se puede reanudar', () => {
    expect(obtenerMotivoRechazoReanudar('Pausado', null)).toBeNull();
  });

  test('un lote Activo no se reanuda', () => {
    expect(obtenerMotivoRechazoReanudar('Activo', null)).toBe(
      'El lote está Activo; solo se puede reanudar un lote Pausado'
    );
    expect(crearMensajeLoteNoPausado('Activo')).toBe(
      'El lote está Activo; solo se puede reanudar un lote Pausado'
    );
  });

  test('si otro lote usa el sensor, el motivo dice cuál', () => {
    expect(obtenerMotivoRechazoReanudar('Pausado', OTRO_LOTE)).toBe(
      crearMensajeOtroLoteCapturando('TEST_B', 'Recoleccion')
    );
  });

  test('el estado se revisa antes que el sensor', () => {
    expect(obtenerMotivoRechazoReanudar('Activo', OTRO_LOTE)).toBe(
      crearMensajeLoteNoPausado('Activo')
    );
  });
});
