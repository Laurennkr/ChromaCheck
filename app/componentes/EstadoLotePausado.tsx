'use client';

import { formatearFechaHora } from '@/lib/formato';
import Boton from './Boton';

// Alerta roja que pausó el lote: su mensaje y cuándo ocurrió
export interface MotivoPausa {
  mensaje: string;
  timestamp: Date | string;
}

interface PropiedadesEstadoLotePausado {
  motivoPausa: MotivoPausa | null;
  // false durante los primeros 5 s: solo se ve el aviso, para que el operario lea el motivo
  puedeResponder: boolean;
  estaEnviando: boolean;
  reanudar: () => void;
  entender: () => void;
}

// Contenido de la pantalla completa cuando una alerta roja pausa el lote: "⚠ Lote pausado", el
// motivo y la hora. A los 5 s aparecen "Reanudar recolección" (principal) y "Entendido"
export default function EstadoLotePausado({
  motivoPausa,
  puedeResponder,
  estaEnviando,
  reanudar,
  entender,
}: PropiedadesEstadoLotePausado) {
  return (
    <>
      <div role="alert" className="flex flex-col items-center gap-4">
        <p className="max-w-4xl font-titulo text-5xl font-bold text-peligro">
          <span aria-hidden="true">⚠ </span>Lote pausado
        </p>
        <p className="max-w-2xl text-lg">
          Motivo: {motivoPausa?.mensaje ?? 'alerta roja por desviación de color'}.
        </p>
        {motivoPausa && (
          <p className="text-lg">Alerta roja del {formatearFechaHora(motivoPausa.timestamp)}</p>
        )}
        <p className="max-w-2xl text-lg">El lote no acepta lecturas hasta que se reanude.</p>
      </div>

      {puedeResponder && (
        <div className="flex flex-wrap justify-center gap-4">
          <Boton
            esGrande
            autoFocus
            data-foco-inicial
            estaEnviando={estaEnviando}
            textoEnviando="Reanudando…"
            onClick={reanudar}
          >
            Reanudar recolección
          </Boton>
          <Boton variante="secundario" esGrande disabled={estaEnviando} onClick={entender}>
            Entendido
          </Boton>
        </div>
      )}
    </>
  );
}
