'use client';

import { useEffect, useRef, useState, useTransition, type ReactNode, type Ref } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { formatearDeltaE } from '@/lib/formato';
import { necesitaMuestraPatron, type ModoCaptura } from '@/lib/modulos/lotes/reglas';
import type { Tarro } from '@/lib/modulos/tarros/repositorio';
import Boton, { obtenerClasesBoton } from './Boton';
import CuadroColor from './CuadroColor';
import PantallaCaptura from './PantallaCaptura';

// Cada cuánto se vuelve a consultar la página mientras el lote está capturando
const INTERVALO_REFRESCO_MS = 3000;

interface CapturaDeOtroLote {
  loteId: number;
  codigo: string;
  modo: ModoCaptura;
}

interface PropiedadesControlCaptura {
  loteId: number;
  codigo: string;
  estado: string;
  modoCaptura: ModoCaptura;
  // Color de la muestra patrón; null si el lote todavía no tiene muestra
  muestraHex: string | null;
  // Última lectura del lote (sin la muestra); null si todavía no hay tarros
  ultimoTarro: Tarro | null;
  capturaDeOtroLote: CapturaDeOtroLote | null;
}

// Acción principal de la pantalla del lote: Agregar muestra → Iniciar recolección.
// Lo que hace el sensor se muestra en la pantalla completa (PantallaCaptura)
export default function ControlCaptura({
  loteId,
  codigo,
  estado,
  modoCaptura,
  muestraHex,
  ultimoTarro,
  capturaDeOtroLote,
}: PropiedadesControlCaptura) {
  const { cambiarModo, mensajeError, estaEnviando } = useCambiarModo(loteId);
  // Solo vive en memoria: al volver a entrar al lote, la pantalla del estado A sale otra vez
  const [seCerroEstadoA, setSeCerroEstadoA] = useState(false);
  const refAccionPrincipal = useRef<HTMLButtonElement>(null);

  const tieneMuestra = muestraHex !== null;
  const estaCapturando = modoCaptura !== 'Inactivo';
  useRefrescarMientrasCaptura(estaCapturando);

  // Un lote pausado no puede capturar: el aviso de pausa ya explica el motivo
  if (estado !== 'Activo') return null;

  const debePedirMuestra =
    necesitaMuestraPatron({ estado, modoCaptura, tieneMuestra }) && !seCerroEstadoA;
  // La pantalla completa está abierta mientras el sensor captura para este lote, o en el estado A
  const estaPantallaAbierta = estaCapturando || debePedirMuestra;
  const errorEnPantalla = <MensajeError mensaje={mensajeError} />;

  return (
    <div className="space-y-4">
      {tieneMuestra ? (
        <VistaConMuestra
          muestraHex={muestraHex}
          capturaDeOtroLote={capturaDeOtroLote}
          estaEnviando={estaEnviando}
          refAccion={refAccionPrincipal}
          iniciarRecoleccion={() => cambiarModo('Recoleccion')}
        />
      ) : (
        <VistaSinMuestra
          capturaDeOtroLote={capturaDeOtroLote}
          refAccion={refAccionPrincipal}
          abrirPantalla={() => setSeCerroEstadoA(false)}
        />
      )}

      {!estaPantallaAbierta && errorEnPantalla}

      {estaPantallaAbierta && (
        <PantallaCaptura
          titulo={obtenerTituloPantalla(modoCaptura, codigo)}
          estaEnviando={estaEnviando}
          elementoFocoAlCerrar={refAccionPrincipal}
          // Cerrar = detener la captura; en el estado A no hay captura que detener
          alCerrar={estaCapturando ? () => cambiarModo('Inactivo') : () => setSeCerroEstadoA(true)}
        >
          <ContenidoPantalla
            modoCaptura={modoCaptura}
            muestraHex={muestraHex}
            ultimoTarro={ultimoTarro}
            capturaDeOtroLote={capturaDeOtroLote}
            estaEnviando={estaEnviando}
            cambiarModo={cambiarModo}
          />
          {errorEnPantalla}
        </PantallaCaptura>
      )}
    </div>
  );
}

// Texto de la franja de la pantalla completa; nunca muestra el valor interno 'Recoleccion'
function obtenerTituloPantalla(modoCaptura: ModoCaptura, codigo: string) {
  return modoCaptura === 'Recoleccion' ? `Recolección del lote ${codigo}` : `Lote ${codigo}`;
}

// Elige el contenido de la pantalla completa según el modo guardado en la base
function ContenidoPantalla({
  modoCaptura,
  muestraHex,
  ultimoTarro,
  capturaDeOtroLote,
  estaEnviando,
  cambiarModo,
}: {
  modoCaptura: ModoCaptura;
  muestraHex: string | null;
  ultimoTarro: Tarro | null;
  capturaDeOtroLote: CapturaDeOtroLote | null;
  estaEnviando: boolean;
  cambiarModo: (modo: ModoCaptura) => void;
}) {
  if (modoCaptura === 'Muestra') {
    return (
      <EstadoEsperandoMuestra
        estaEnviando={estaEnviando}
        cancelar={() => cambiarModo('Inactivo')}
      />
    );
  }

  if (modoCaptura === 'Recoleccion') {
    return (
      <EstadoRecoleccion
        muestraHex={muestraHex}
        ultimoTarro={ultimoTarro}
        estaEnviando={estaEnviando}
        terminar={() => cambiarModo('Inactivo')}
      />
    );
  }

  return (
    <EstadoSinMuestra
      capturaDeOtroLote={capturaDeOtroLote}
      estaEnviando={estaEnviando}
      agregarMuestra={() => cambiarModo('Muestra')}
    />
  );
}

// Llama a la API para cambiar el modo de captura y refresca la página.
// estaEnviando sigue en true hasta que la página trae el modo nuevo, para evitar el doble clic
function useCambiarModo(loteId: number) {
  const router = useRouter();
  const [mensajeError, setMensajeError] = useState('');
  const [estaLlamandoApi, setEstaLlamandoApi] = useState(false);
  const [estaRefrescando, iniciarTransicion] = useTransition();

  async function cambiarModo(modo: ModoCaptura) {
    setMensajeError('');
    setEstaLlamandoApi(true);

    try {
      const respuesta = await fetch(`/api/lotes/${loteId}/captura`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ modo }),
      });
      const resultado = await respuesta.json();

      if (!resultado.exito) {
        setMensajeError(resultado.error);
        return;
      }
      iniciarTransicion(() => router.refresh());
    } catch {
      setMensajeError(
        'No se pudo conectar con el servidor. Revise la conexión e intente de nuevo.'
      );
    } finally {
      setEstaLlamandoApi(false);
    }
  }

  return { cambiarModo, mensajeError, estaEnviando: estaLlamandoApi || estaRefrescando };
}

// Mientras el sensor captura para este lote, refresca la página para ver la muestra,
// las lecturas y las alertas nuevas que envía el puente serial
function useRefrescarMientrasCaptura(estaCapturando: boolean) {
  const router = useRouter();

  useEffect(() => {
    if (!estaCapturando) return;
    const intervalo = setInterval(() => router.refresh(), INTERVALO_REFRESCO_MS);
    return () => clearInterval(intervalo);
  }, [estaCapturando, router]);
}

// Estado A: el lote no tiene muestra patrón
function EstadoSinMuestra({
  capturaDeOtroLote,
  estaEnviando,
  agregarMuestra,
}: {
  capturaDeOtroLote: CapturaDeOtroLote | null;
  estaEnviando: boolean;
  agregarMuestra: () => void;
}) {
  return (
    <>
      <TituloPantalla>Agregue la muestra patrón de este lote</TituloPantalla>
      <p className="max-w-2xl text-lg">
        Haga clic en Agregar muestra y luego coloque el tarro patrón frente al sensor.
      </p>
      <Boton
        esGrande
        autoFocus
        data-foco-inicial
        disabled={Boolean(capturaDeOtroLote)}
        estaEnviando={estaEnviando}
        textoEnviando="Abriendo…"
        onClick={agregarMuestra}
      >
        Agregar muestra
      </Boton>
      <AvisoSensorOcupado capturaDeOtroLote={capturaDeOtroLote} />
    </>
  );
}

// Estado B: el sensor espera la lectura de la muestra
function EstadoEsperandoMuestra({
  estaEnviando,
  cancelar,
}: {
  estaEnviando: boolean;
  cancelar: () => void;
}) {
  return (
    <>
      <TituloPantalla>Coloque la muestra en el sensor</TituloPantalla>
      <EstadoSensor texto="Esperando la muestra…" />
      <Boton
        variante="secundario"
        esGrande
        autoFocus
        data-foco-inicial
        estaEnviando={estaEnviando}
        textoEnviando="Cancelando…"
        onClick={cancelar}
      >
        Cancelar
      </Boton>
    </>
  );
}

// Pantalla del lote sin muestra, con la pantalla completa cerrada
function VistaSinMuestra({
  capturaDeOtroLote,
  refAccion,
  abrirPantalla,
}: {
  capturaDeOtroLote: CapturaDeOtroLote | null;
  refAccion: Ref<HTMLButtonElement>;
  abrirPantalla: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-4 py-6 text-center">
      <p className="text-lg">Este lote todavía no tiene muestra patrón</p>
      <BotonAccionPrincipal
        ref={refAccion}
        estaDeshabilitado={Boolean(capturaDeOtroLote)}
        onClick={abrirPantalla}
      >
        Agregar muestra
      </BotonAccionPrincipal>
      <AvisoSensorOcupado capturaDeOtroLote={capturaDeOtroLote} />
    </div>
  );
}

// Recolección: la muestra y el último tarro lado a lado, con el dictamen en grande
function EstadoRecoleccion({
  muestraHex,
  ultimoTarro,
  estaEnviando,
  terminar,
}: {
  muestraHex: string | null;
  ultimoTarro: Tarro | null;
  estaEnviando: boolean;
  terminar: () => void;
}) {
  return (
    <>
      <EstadoSensor texto="Recolectando tarros…" />
      <div className="flex flex-wrap justify-center gap-8">
        <ColorRotulado etiqueta="Muestra patrón" hex={muestraHex} />
        <ColorRotulado etiqueta="Último tarro" hex={ultimoTarro?.resultado_hex ?? null} />
      </div>
      {/* Cada tarro nuevo se anuncia a los lectores de pantalla */}
      <div aria-live="polite" className="flex flex-col items-center gap-4">
        {ultimoTarro ? (
          <DictamenTarro tarro={ultimoTarro} />
        ) : (
          <p className="text-lg">Esperando el primer tarro…</p>
        )}
      </div>
      <Boton
        variante="peligro"
        esGrande
        autoFocus
        data-foco-inicial
        estaEnviando={estaEnviando}
        textoEnviando="Terminando…"
        onClick={terminar}
      >
        Terminar recolección
      </Boton>
    </>
  );
}

// Cuadro de color de 160 px con su etiqueta encima y el hex debajo
function ColorRotulado({ etiqueta, hex }: { etiqueta: string; hex: string | null }) {
  return (
    <div className="flex flex-col items-start gap-2 text-left">
      <p className="font-titulo text-lg font-semibold">{etiqueta}</p>
      <CuadroColor hex={hex} tamano="mediano" />
    </div>
  );
}

const DICTAMENES: Record<string, { simbolo: string; texto: string; clases: string }> = {
  Aprobado: { simbolo: '✓', texto: 'Aprobado', clases: 'bg-aprobado text-texto-sobre-aprobado' },
  'No Aprobado': {
    simbolo: '✕',
    texto: 'No aprobado',
    clases: 'bg-peligro text-texto-sobre-peligro',
  },
};

const DICTAMEN_SIN_CALCULAR = {
  simbolo: '–',
  texto: 'Sin calcular',
  clases: 'border-2 border-borde text-texto-secundario',
};

// Dictamen del último tarro a 60 px (48 px en teléfonos), con símbolo y palabra, y su ΔE.
// Sin ΔE no hay dictamen, igual que en InsigniaResultado
function DictamenTarro({ tarro }: { tarro: Tarro }) {
  const tieneDeltaE = tarro.desviacion_delta_e !== null;
  const dictamen = (tieneDeltaE && DICTAMENES[tarro.resultado]) || DICTAMEN_SIN_CALCULAR;

  return (
    <>
      <p
        className={`rounded-lg px-6 py-2 font-titulo text-5xl font-bold sm:text-6xl ${dictamen.clases}`}
      >
        <span aria-hidden="true">{dictamen.simbolo} </span>
        {dictamen.texto}
      </p>
      <p className="text-lg tabular-nums">
        Diferencia de color: {formatearDeltaE(tarro.desviacion_delta_e)} ΔE
      </p>
    </>
  );
}

// Pantalla del lote con la muestra guardada: su color y la acción "Iniciar recolección"
function VistaConMuestra({
  muestraHex,
  capturaDeOtroLote,
  estaEnviando,
  refAccion,
  iniciarRecoleccion,
}: {
  muestraHex: string;
  capturaDeOtroLote: CapturaDeOtroLote | null;
  estaEnviando: boolean;
  refAccion: Ref<HTMLButtonElement>;
  iniciarRecoleccion: () => void;
}) {
  return (
    <div className="flex flex-col items-start gap-4">
      <ColorRotulado etiqueta="Muestra patrón" hex={muestraHex} />
      <p
        role="status"
        className="rounded-lg bg-aprobado-suave px-4 py-2 font-titulo text-lg font-semibold text-texto-sobre-aprobado-suave"
      >
        <span aria-hidden="true">✓ </span>Muestra patrón guardada
      </p>
      <BotonAccionPrincipal
        ref={refAccion}
        estaDeshabilitado={Boolean(capturaDeOtroLote)}
        estaEnviando={estaEnviando}
        onClick={iniciarRecoleccion}
      >
        Iniciar recolección
      </BotonAccionPrincipal>
      <AvisoSensorOcupado capturaDeOtroLote={capturaDeOtroLote} />
    </div>
  );
}

// Botón de 72 px de la pantalla del lote. Es un <button> propio (no Boton) porque necesita
// ref: la pantalla completa le devuelve el foco al cerrarse
function BotonAccionPrincipal({
  ref,
  estaDeshabilitado,
  estaEnviando = false,
  onClick,
  children,
}: {
  ref: Ref<HTMLButtonElement>;
  estaDeshabilitado: boolean;
  estaEnviando?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      ref={ref}
      type="button"
      disabled={estaDeshabilitado || estaEnviando}
      aria-busy={estaEnviando || undefined}
      onClick={onClick}
      className={obtenerClasesBoton({ esGrande: true })}
    >
      {estaEnviando ? 'Abriendo…' : children}
    </button>
  );
}

// Texto principal de la pantalla completa, de 48 px
function TituloPantalla({ children }: { children: ReactNode }) {
  return <p className="max-w-4xl font-titulo text-5xl font-bold">{children}</p>;
}

// Estado del sensor en texto; el símbolo solo lo refuerza
function EstadoSensor({ texto }: { texto: string }) {
  return (
    <p role="status" className="text-lg">
      <span aria-hidden="true" className="text-accion">
        ●{' '}
      </span>
      {texto}
    </p>
  );
}

// El botón deshabilitado lleva al lado la frase que explica por qué
function AvisoSensorOcupado({
  capturaDeOtroLote,
}: {
  capturaDeOtroLote: CapturaDeOtroLote | null;
}) {
  if (!capturaDeOtroLote) return null;

  return (
    <p className="text-lg">
      <span aria-hidden="true">⚠ </span>El sensor está ocupado con el lote{' '}
      <Link
        href={`/lotes/${capturaDeOtroLote.loteId}`}
        className="font-titulo font-semibold text-accion underline underline-offset-4 focus-visible:outline-4 focus-visible:outline-offset-3 focus-visible:outline-accion"
      >
        {capturaDeOtroLote.codigo}
      </Link>
      . Termine esa recolección para usarlo aquí.
    </p>
  );
}

// Motivo del rechazo de la API, con "⚠" y lo que hay que hacer
function MensajeError({ mensaje }: { mensaje: string }) {
  if (!mensaje) return null;

  return (
    <p role="alert" className="text-lg text-peligro">
      <span aria-hidden="true">⚠ </span>
      {mensaje}
    </p>
  );
}
