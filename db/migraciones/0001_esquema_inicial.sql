-- 0001 · Esquema inicial de ChromaCheck
--
-- Reproduce el esquema tal como existe en Neon el 2026-11-20 (leído con las consultas del anexo de
-- docs/datos/modelo.md). Sirve para crear la base desde cero. En una base que ya existe no cambia
-- nada: todo usa IF NOT EXISTS.
--
-- Los nombres de las restricciones (lotes_pkey, tarros_lote_id_fkey, usuarios_nombre_usuario_key…)
-- son los que PostgreSQL genera para las restricciones en línea, iguales a los de la base real.

BEGIN;

CREATE TABLE IF NOT EXISTS lotes (
  id           SERIAL PRIMARY KEY,
  codigo       VARCHAR(50) NOT NULL,
  estado       VARCHAR(20) NOT NULL DEFAULT 'Activo',
  fecha_inicio TIMESTAMP   NOT NULL DEFAULT now(),
  modo_captura VARCHAR(20) NOT NULL DEFAULT 'Inactivo'
    CONSTRAINT lotes_modo_captura_valido
      CHECK (modo_captura IN ('Inactivo', 'Muestra', 'Recoleccion'))
);

-- Código único sin distinguir mayúsculas ni espacios de los extremos (R1)
CREATE UNIQUE INDEX IF NOT EXISTS lotes_codigo_unico ON lotes (LOWER(TRIM(codigo)));

-- Solo un lote a la vez puede tener un modo distinto de 'Inactivo' (R3)
CREATE UNIQUE INDEX IF NOT EXISTS lotes_un_lote_capturando
  ON lotes ((true))
  WHERE modo_captura <> 'Inactivo';

CREATE TABLE IF NOT EXISTS tarros (
  id_tarro           SERIAL PRIMARY KEY,
  lote_id            INTEGER     NOT NULL REFERENCES lotes (id),
  resultado_hex      VARCHAR(7)  NOT NULL,
  desviacion_delta_e NUMERIC,
  resultado          VARCHAR(20) NOT NULL,
  es_muestra         BOOLEAN     NOT NULL DEFAULT false,
  "timestamp"        TIMESTAMP   NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tarros_lote ON tarros (lote_id);
CREATE INDEX IF NOT EXISTS idx_tarros_timestamp ON tarros ("timestamp");

CREATE TABLE IF NOT EXISTS alertas (
  id               SERIAL PRIMARY KEY,
  tarro_id         INTEGER     NOT NULL REFERENCES tarros (id_tarro),
  nivel            VARCHAR(10) NOT NULL,
  mensaje          TEXT        NOT NULL,
  congela_registro BOOLEAN     NOT NULL DEFAULT false,
  "timestamp"      TIMESTAMP   NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS usuarios (
  id              SERIAL PRIMARY KEY,
  nombre_usuario  VARCHAR(50)  NOT NULL UNIQUE,
  contrasena_hash VARCHAR(255) NOT NULL,
  fecha_creacion  TIMESTAMP    NOT NULL DEFAULT now()
);

COMMIT;
