'use client';

import {
  useEffect,
  useId,
  useRef,
  type ReactNode,
  type RefObject,
  type SyntheticEvent,
} from 'react';

interface PropiedadesPantallaCaptura {
  // Texto de la franja superior, por ejemplo "Lote #005_Azul_Cielo"
  titulo: string;
  children: ReactNode;
  // Se llama con "✕ Cerrar" y con Esc; quien la usa decide qué hacer y si la desmonta
  alCerrar: () => void;
  // Elemento que recibe el foco al cerrarse; si no se indica, vuelve al que tenía el foco al abrir
  elementoFocoAlCerrar?: RefObject<HTMLElement | null>;
  // Mientras se envía un cambio, "✕ Cerrar" y Esc no hacen nada para evitar una doble llamada
  estaEnviando?: boolean;
}

// Selector del elemento que recibe el foco al abrir (por ejemplo, el botón principal)
const SELECTOR_FOCO_INICIAL = '[data-foco-inicial]';

// Diálogo a pantalla completa, opaco, sobre la superficie. Usa <dialog> con showModal:
// lo que hay detrás queda inerte y el navegador lo pone por encima de todo
export default function PantallaCaptura({
  titulo,
  children,
  alCerrar,
  elementoFocoAlCerrar,
  estaEnviando = false,
}: PropiedadesPantallaCaptura) {
  const refDialogo = useRef<HTMLDialogElement>(null);
  const idTitulo = useId();

  useEffect(() => {
    const dialogo = refDialogo.current;
    if (!dialogo) return;

    const elementoQueAbrio =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    if (!dialogo.open) dialogo.showModal();
    dialogo.querySelector<HTMLElement>(SELECTOR_FOCO_INICIAL)?.focus();

    return () => {
      if (dialogo.open) dialogo.close();
      const destino = elementoFocoAlCerrar?.current ?? elementoQueAbrio;
      if (destino?.isConnected) destino.focus();
    };
  }, [elementoFocoAlCerrar]);

  // Esc dispara "cancel": se evita el cierre nativo para que el estado lo maneje quien la usa
  function cancelarConEsc(evento: SyntheticEvent<HTMLDialogElement>) {
    evento.preventDefault();
    if (!estaEnviando) alCerrar();
  }

  return (
    <dialog
      ref={refDialogo}
      aria-modal="true"
      aria-labelledby={idTitulo}
      onCancel={cancelarConEsc}
      className="fixed inset-0 m-0 h-dvh max-h-none w-full max-w-none flex-col overflow-y-auto border-0 bg-superficie p-0 text-texto opacity-100 open:flex transition-opacity duration-150 backdrop:bg-superficie motion-reduce:transition-none starting:opacity-0"
    >
      <div className="flex flex-wrap items-center justify-between gap-4 bg-accion px-4 py-3 text-texto-sobre-accion sm:px-8">
        <h2 id={idTitulo} className="font-titulo text-2xl font-bold break-all">
          {titulo}
        </h2>
        <button
          type="button"
          onClick={alCerrar}
          disabled={estaEnviando}
          className="inline-flex h-14 items-center gap-2 rounded-lg border-2 border-texto-sobre-accion px-5 font-titulo text-lg font-semibold focus-visible:outline-4 focus-visible:outline-offset-3 focus-visible:outline-texto-sobre-accion disabled:cursor-not-allowed disabled:opacity-60"
        >
          <span aria-hidden="true">✕</span> Cerrar
        </button>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center gap-4 px-4 py-10 text-center sm:px-8">
        {children}
      </div>
    </dialog>
  );
}
