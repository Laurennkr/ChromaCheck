// Ganchos comunes de las pruebas que usan el sensor: antes de cada prueba abren una sesión por la
// API y el puente simulado; después de cada una (aunque falle) dejan el sensor en modo Inactivo
import { test, type APIRequestContext } from '@playwright/test';
import { crearSesionApi, liberarSensor } from './lotes';
import { crearPuenteSimulado, type PuenteSimulado } from './puente';

export interface ApoyosPrueba {
  sesion: APIRequestContext;
  puente: PuenteSimulado;
}

export function registrarSensorLimpio(): ApoyosPrueba {
  const apoyos = {} as ApoyosPrueba;

  test.beforeEach(async () => {
    apoyos.sesion = await crearSesionApi();
    apoyos.puente = await crearPuenteSimulado();
    // Por si una ejecución anterior se interrumpió con un lote de pruebas capturando
    await liberarSensor(apoyos.sesion);
  });

  test.afterEach(async () => {
    await liberarSensor(apoyos.sesion);
    await apoyos.sesion.dispose();
    await apoyos.puente.cerrar();
  });

  return apoyos;
}
