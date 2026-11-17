import {
  calcularDesviacionDeltaE,
  construirAlerta,
  convertirHexARgb,
  convertirRgbALab,
  crearMensajeSinModoMuestra,
  esDesviacionGrave,
  excedeToleranciaDeltaE,
  formanPatronAcumulativo,
  obtenerCausaAlerta,
  obtenerMotivoRechazoLectura,
  obtenerMotivoRechazoMuestra,
  obtenerNivelAlerta,
  obtenerResultadoLectura,
  sonLecturasRepetidasFueraDeTolerancia,
  UMBRAL_ALERTA_ROJA_DELTA_E,
  UMBRAL_TOLERANCIA_DELTA_E,
} from './reglas';

// Causa y nivel de la alerta de la última lectura de una secuencia (de la más antigua a la más
// reciente), como la decide el servicio con las lecturas del lote
function evaluarUltimaLectura(desviacionesCronologicas: number[]) {
  const ultima = desviacionesCronologicas[desviacionesCronologicas.length - 1];
  const causa = obtenerCausaAlerta(ultima, desviacionesCronologicas);
  return { causa, nivel: causa ? obtenerNivelAlerta(causa) : null };
}

// Margen aceptado entre el deltaE calculado y el documentado en CP-03
const MARGEN_DELTA_E = 0.5;

describe('casos de prueba documentados (CP)', () => {
  test('CP-01: muestra (120,80,200) y lectura (120,88,195) dan ΔE 8,00 y se aprueba', () => {
    const desviacion = calcularDesviacionDeltaE([120, 80, 200], [120, 88, 195]);
    expect(desviacion).toBe(8);
    expect(obtenerResultadoLectura(desviacion)).toBe('Aprobado');
    expect(obtenerCausaAlerta(desviacion, [desviacion])).toBeNull();
  });

  test('CP-02: lectura (120,73,207) da ΔE 8,01 y no se aprueba', () => {
    const desviacion = calcularDesviacionDeltaE([120, 80, 200], [120, 73, 207]);
    expect(desviacion).toBe(8.01);
    expect(obtenerResultadoLectura(desviacion)).toBe('No Aprobado');
  });

  test.each([
    { muestra: [255, 0, 0], lectura: [250, 0, 0], esperado: 1.87 },
    { muestra: [100, 100, 100], lectura: [110, 100, 100], esperado: 4.31 },
    { muestra: [0, 0, 0], lectura: [255, 255, 255], esperado: 100 },
  ] as const)(
    'CP-03: $muestra frente a $lectura da ΔE $esperado (margen < 0,5)',
    ({ muestra, lectura, esperado }) => {
      const desviacion = calcularDesviacionDeltaE([...muestra], [...lectura]);
      expect(Math.abs(desviacion - esperado)).toBeLessThan(MARGEN_DELTA_E);
    }
  );

  test('CP-04: ΔE 3,0 → 5,5 → 8,5 forma un patrón acumulativo y da alerta Roja', () => {
    expect(formanPatronAcumulativo([3.0, 5.5, 8.5])).toBe(true);
    expect(evaluarUltimaLectura([3.0, 5.5, 8.5])).toEqual({ causa: 'acumulativa', nivel: 'Roja' });
  });

  test('CP-05: ΔE 3,0 → 3,0 → 8,5 no forma patrón y da solo alerta Amarilla', () => {
    expect(formanPatronAcumulativo([3.0, 3.0, 8.5])).toBe(false);
    expect(evaluarUltimaLectura([3.0, 3.0, 8.5])).toEqual({ causa: 'aislada', nivel: 'Amarilla' });
  });
});

describe('calcularDesviacionDeltaE', () => {
  test('dos colores iguales tienen ΔE 0', () => {
    expect(calcularDesviacionDeltaE([227, 83, 55], [227, 83, 55])).toBe(0);
  });

  test('redondea a 2 decimales', () => {
    const desviacion = calcularDesviacionDeltaE([128, 128, 128], [131, 131, 131]);
    expect(desviacion).toBe(Math.round(desviacion * 100) / 100);
  });
});

describe('convertirRgbALab', () => {
  test('el blanco es L=100 y el negro L=0, ambos sin color', () => {
    const blanco = convertirRgbALab(255, 255, 255);
    expect(blanco.l).toBeCloseTo(100, 1);
    expect(blanco.a).toBeCloseTo(0, 1);
    expect(blanco.b).toBeCloseTo(0, 1);
    expect(convertirRgbALab(0, 0, 0).l).toBeCloseTo(0, 5);
  });

  test('usa la aproximación lineal en canales muy oscuros', () => {
    expect(convertirRgbALab(5, 5, 5).l).toBeGreaterThan(0);
  });
});

describe('tolerancia y resultado (umbral 8,0)', () => {
  test('el umbral es 8,0 (ACQ-04)', () => {
    expect(UMBRAL_TOLERANCIA_DELTA_E).toBe(8);
  });

  test('8,0 está dentro de la tolerancia; 8,01 la supera', () => {
    expect(excedeToleranciaDeltaE(8)).toBe(false);
    expect(excedeToleranciaDeltaE(8.01)).toBe(true);
  });

  test('acepta otro límite', () => {
    expect(excedeToleranciaDeltaE(1, 2)).toBe(false);
  });
});

describe('convertirHexARgb', () => {
  test('convierte con o sin #', () => {
    expect(convertirHexARgb('#E35336')).toEqual([227, 83, 54]);
    expect(convertirHexARgb('0005ff')).toEqual([0, 5, 255]);
  });
});

describe('formanPatronAcumulativo', () => {
  test('con menos de 3 lecturas no hay patrón', () => {
    expect(formanPatronAcumulativo([])).toBe(false);
    expect(formanPatronAcumulativo([5.5, 8.5])).toBe(false);
  });

  test('crecientes pero con la última dentro de tolerancia no es patrón', () => {
    expect(formanPatronAcumulativo([3.0, 5.5, 8.0])).toBe(false);
  });

  test('una bajada rompe el patrón', () => {
    expect(formanPatronAcumulativo([5.5, 3.0, 8.5])).toBe(false);
  });

  test('solo cuentan las 3 lecturas más recientes', () => {
    expect(formanPatronAcumulativo([9.0, 3.0, 5.5, 8.5])).toBe(true);
  });
});

describe('esDesviacionGrave (umbral rojo 15)', () => {
  test('el umbral rojo es 15', () => {
    expect(UMBRAL_ALERTA_ROJA_DELTA_E).toBe(15);
  });

  test('14,99 no es grave; 15,00 sí', () => {
    expect(esDesviacionGrave(14.99)).toBe(false);
    expect(esDesviacionGrave(15)).toBe(true);
  });
});

describe('sonLecturasRepetidasFueraDeTolerancia', () => {
  test('con menos de 3 lecturas no hay repetición', () => {
    expect(sonLecturasRepetidasFueraDeTolerancia([9, 10])).toBe(false);
  });

  test('3 lecturas fuera de tolerancia, aunque bajen o sean iguales, se repiten', () => {
    expect(sonLecturasRepetidasFueraDeTolerancia([12, 9, 10])).toBe(true);
    expect(sonLecturasRepetidasFueraDeTolerancia([9, 9, 9])).toBe(true);
  });

  test('una lectura en tolerancia en medio corta la repetición', () => {
    expect(sonLecturasRepetidasFueraDeTolerancia([9, 3, 10])).toBe(false);
  });

  test('solo cuentan las 3 lecturas más recientes', () => {
    expect(sonLecturasRepetidasFueraDeTolerancia([3, 9, 9, 9])).toBe(true);
    expect(sonLecturasRepetidasFueraDeTolerancia([9, 9, 3, 9])).toBe(false);
  });
});

describe('alerta de la última lectura (tabla de decisión de F5)', () => {
  test.each([
    { desviaciones: [8], causa: null, nivel: null },
    { desviaciones: [8.01], causa: 'aislada', nivel: 'Amarilla' },
    { desviaciones: [14.99], causa: 'aislada', nivel: 'Amarilla' },
    { desviaciones: [15], causa: 'grave', nivel: 'Roja' },
    { desviaciones: [20], causa: 'grave', nivel: 'Roja' },
  ] as const)('una lectura con ΔE $desviaciones da $nivel', ({ desviaciones, causa, nivel }) => {
    expect(evaluarUltimaLectura([...desviaciones])).toEqual({ causa, nivel });
  });

  test.each([
    // Antes: Amarilla, porque no eran estrictamente crecientes. 16 ≥ 15 ya es grave por sí sola
    { desviaciones: [16, 16, 16], causa: 'grave', nivel: 'Roja' },
    { desviaciones: [9, 20], causa: 'grave', nivel: 'Roja' },
    { desviaciones: [9, 3, 10], causa: 'aislada', nivel: 'Amarilla' },
    { desviaciones: [2, 5, 9], causa: 'acumulativa', nivel: 'Roja' },
    // Antes: Amarilla. Tres seguidas fuera de tolerancia, aunque suban y bajen
    { desviaciones: [12, 9, 10], causa: 'repetida', nivel: 'Roja' },
    { desviaciones: [9, 9, 9], causa: 'repetida', nivel: 'Roja' },
  ] as const)('la última de $desviaciones da $nivel ($causa)', ({ desviaciones, causa, nivel }) => {
    expect(evaluarUltimaLectura([...desviaciones])).toEqual({ causa, nivel });
  });

  test('si aplican varias causas de Roja gana la más grave: grave > repetida > acumulativa', () => {
    // Crecientes y las 3 fuera de tolerancia: repetida le gana a acumulativa
    expect(evaluarUltimaLectura([9, 10, 11]).causa).toBe('repetida');
    // Además la última ≥ 15: grave le gana a las dos
    expect(evaluarUltimaLectura([9, 10, 16]).causa).toBe('grave');
  });

  test('una lectura en tolerancia no da alerta aunque las anteriores estén fuera', () => {
    expect(evaluarUltimaLectura([16, 16, 8])).toEqual({ causa: null, nivel: null });
  });
});

describe('construirAlerta', () => {
  test.each([
    {
      causa: 'grave',
      deltaE: 20,
      mensaje: 'Desviación grave de 20 ΔE (límite 15)',
      nivel: 'Roja',
    },
    {
      causa: 'repetida',
      deltaE: 10,
      mensaje: 'Desviación repetida: 3 lecturas seguidas fuera de tolerancia',
      nivel: 'Roja',
    },
    {
      causa: 'acumulativa',
      deltaE: 8.5,
      mensaje: 'Desviación acumulativa detectada: revisar mezclador o posibles fugas',
      nivel: 'Roja',
    },
  ] as const)('la causa $causa da Roja, congela el registro y su mensaje', (caso) => {
    expect(construirAlerta(caso.causa, caso.deltaE)).toEqual({
      nivel: caso.nivel,
      mensaje: caso.mensaje,
      congelaRegistro: true,
    });
  });

  test('la aislada da Amarilla, no congela e incluye el deltaE', () => {
    expect(construirAlerta('aislada', 8.5)).toEqual({
      nivel: 'Amarilla',
      mensaje: 'Desviación aislada de 8.5 ΔE',
      congelaRegistro: false,
    });
  });
});

describe('obtenerMotivoRechazoMuestra', () => {
  const loteEnMuestra = { estado: 'Activo', modoCaptura: 'Muestra', tieneMuestra: false };

  test('acepta la muestra en modo Muestra si aún no tiene', () => {
    expect(obtenerMotivoRechazoMuestra(loteEnMuestra)).toBeNull();
  });

  test('rechaza una segunda muestra', () => {
    expect(obtenerMotivoRechazoMuestra({ ...loteEnMuestra, tieneMuestra: true })).toBe(
      'El lote ya tiene un tarro muestra registrado'
    );
  });

  test.each(['Inactivo', 'Recoleccion'])('rechaza la muestra en modo %s', (modoCaptura) => {
    expect(obtenerMotivoRechazoMuestra({ ...loteEnMuestra, modoCaptura })).toBe(
      crearMensajeSinModoMuestra(modoCaptura)
    );
  });

  test('el mensaje indica el modo actual', () => {
    expect(crearMensajeSinModoMuestra('Inactivo')).toBe(
      'El lote no está en modo Muestra (modo actual: Inactivo); actívalo desde la web antes de registrar la muestra'
    );
  });
});

describe('obtenerMotivoRechazoLectura', () => {
  const loteRecolectando = { estado: 'Activo', modoCaptura: 'Recoleccion', tieneMuestra: true };

  test('acepta la lectura de un lote activo, con muestra y en Recoleccion', () => {
    expect(obtenerMotivoRechazoLectura(loteRecolectando)).toBeNull();
  });

  test('rechaza la lectura sin muestra', () => {
    expect(obtenerMotivoRechazoLectura({ ...loteRecolectando, tieneMuestra: false })).toBe(
      'El lote no tiene tarro muestra registrado'
    );
  });

  test('rechaza la lectura de un lote pausado', () => {
    expect(obtenerMotivoRechazoLectura({ ...loteRecolectando, estado: 'Pausado' })).toBe(
      'El lote está pausado por una alerta roja y no acepta lecturas'
    );
  });

  test.each(['Inactivo', 'Muestra'])('rechaza la lectura en modo %s', (modoCaptura) => {
    expect(obtenerMotivoRechazoLectura({ ...loteRecolectando, modoCaptura })).toBe(
      `El lote no está en modo Recoleccion (modo actual: ${modoCaptura}); actívalo desde la web antes de enviar lecturas`
    );
  });
});
