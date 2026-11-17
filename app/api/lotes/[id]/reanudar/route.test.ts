import { NextRequest } from 'next/server';
import { obtenerIdUsuarioDePeticion } from '@/lib/modulos/auth/sesion';
import type { Lote } from '@/lib/modulos/lotes/repositorio';
import { reanudarLote } from '@/lib/modulos/lotes/servicio';
import { POST } from './route';

jest.mock('@/lib/modulos/auth/sesion');
jest.mock('@/lib/modulos/lotes/servicio');

const mockObtenerIdUsuario = jest.mocked(obtenerIdUsuarioDePeticion);
const mockReanudarLote = jest.mocked(reanudarLote);

const LOTE_REANUDADO: Lote = {
  id: 1,
  codigo: 'TEST_A',
  estado: 'Activo',
  modo_captura: 'Recoleccion',
  fecha_inicio: new Date('2026-11-16T10:00:00Z'),
};

// Llama al endpoint como lo haría Next.js, con el id de la ruta
async function reanudar(id: string) {
  const peticion = new NextRequest(`http://localhost/api/lotes/${id}/reanudar`, {
    method: 'POST',
  });
  const respuesta = await POST(peticion, { params: Promise.resolve({ id }) });
  return { estado: respuesta.status, cuerpo: await respuesta.json() };
}

beforeEach(() => {
  mockObtenerIdUsuario.mockResolvedValue(7);
});

describe('POST /api/lotes/[id]/reanudar', () => {
  test('200 con el lote actualizado', async () => {
    mockReanudarLote.mockResolvedValue({ tipo: 'reanudado', lote: LOTE_REANUDADO });

    const { estado, cuerpo } = await reanudar('1');

    expect(estado).toBe(200);
    expect(cuerpo).toEqual({
      exito: true,
      datos: { ...LOTE_REANUDADO, fecha_inicio: '2026-11-16T10:00:00.000Z' },
    });
    expect(mockReanudarLote).toHaveBeenCalledWith(1);
  });

  test('401 sin sesión, sin tocar el lote', async () => {
    mockObtenerIdUsuario.mockResolvedValue(null);

    const { estado, cuerpo } = await reanudar('1');

    expect(estado).toBe(401);
    expect(cuerpo).toEqual({ exito: false, error: 'Inicia sesión para reanudar el lote' });
    expect(mockReanudarLote).not.toHaveBeenCalled();
  });

  test.each(['abc', '0', '-1', '1.5'])('400 con el id inválido %s', async (id) => {
    const { estado, cuerpo } = await reanudar(id);

    expect(estado).toBe(400);
    expect(cuerpo).toEqual({
      exito: false,
      error: 'El id del lote debe ser un entero positivo',
    });
    expect(mockReanudarLote).not.toHaveBeenCalled();
  });

  test('404 si el lote no existe', async () => {
    mockReanudarLote.mockResolvedValue({ tipo: 'loteInexistente' });
    const { estado, cuerpo } = await reanudar('99');
    expect(estado).toBe(404);
    expect(cuerpo).toEqual({ exito: false, error: 'El lote 99 no existe' });
  });

  test('409 con el motivo del rechazo (por ejemplo, otro lote capturando)', async () => {
    const mensaje =
      'El lote "TEST_B" ya está capturando en modo Recoleccion; detén esa captura antes de iniciar otra';
    mockReanudarLote.mockResolvedValue({ tipo: 'rechazado', mensaje });

    const { estado, cuerpo } = await reanudar('1');

    expect(estado).toBe(409);
    expect(cuerpo).toEqual({ exito: false, error: mensaje });
  });

  test('500 genérico si falla la base, sin exponer el detalle', async () => {
    const consolaError = jest.spyOn(console, 'error').mockImplementation(() => {});
    mockReanudarLote.mockRejectedValue(new Error('conexión perdida'));

    const { estado, cuerpo } = await reanudar('1');

    expect(estado).toBe(500);
    expect(cuerpo).toEqual({ exito: false, error: 'Error interno del servidor' });
    consolaError.mockRestore();
  });
});
