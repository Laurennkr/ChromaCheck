import type { NextRequest } from 'next/server';
import { obtenerIdUsuarioDePeticion } from '@/lib/modulos/auth/sesion';
import { reanudarLote } from '@/lib/modulos/lotes/servicio';
import { responderError, responderErrorInterno, responderExito } from '@/lib/respuestas';
import { esEnteroPositivo } from '@/lib/validacion';

// Reanuda un lote pausado por una alerta roja (Activo y en Recoleccion). Solo lo usa la web,
// así que exige sesión. No lleva cuerpo
export async function POST(
  peticion: NextRequest,
  contexto: RouteContext<'/api/lotes/[id]/reanudar'>
) {
  try {
    const idUsuario = await obtenerIdUsuarioDePeticion(peticion);
    if (!idUsuario) {
      return responderError('Inicia sesión para reanudar el lote', 401);
    }

    const { id } = await contexto.params;
    const loteId = Number(id);
    if (!esEnteroPositivo(loteId)) {
      return responderError('El id del lote debe ser un entero positivo', 400);
    }

    const resultado = await reanudarLote(loteId);
    if (resultado.tipo === 'loteInexistente') {
      return responderError(`El lote ${loteId} no existe`, 404);
    }
    if (resultado.tipo === 'rechazado') {
      return responderError(resultado.mensaje, 409);
    }
    return responderExito(resultado.lote);
  } catch (error) {
    return responderErrorInterno(error);
  }
}
