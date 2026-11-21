-- 0002 · Reglas de negocio en la base (brechas B1, B2, B3 y B5 de docs/datos/modelo.md)
--
-- Antes de aplicarla se contaron las filas que la violarían: 0 en todos los casos (2026-11-20).
-- Cada restricción se agrega solo si falta, así que se puede volver a ejecutar sin error.
-- El cambio a timestamptz (B4) no va aquí: queda para otra migración.

BEGIN;

-- B1 · Una sola muestra patrón por lote (R5). El servidor ya lo revisa; esto lo garantiza
-- aunque lleguen dos peticiones a la vez.
CREATE UNIQUE INDEX IF NOT EXISTS tarros_una_muestra_por_lote
  ON tarros (lote_id)
  WHERE es_muestra;

DO $$
BEGIN
  -- B2 · Cada lectura genera como máximo una alerta
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'alertas'::regclass AND contype = 'u'
      AND conkey = ARRAY[(SELECT attnum FROM pg_attribute
                          WHERE attrelid = 'alertas'::regclass AND attname = 'tarro_id')]
  ) THEN
    ALTER TABLE alertas ADD CONSTRAINT alertas_una_por_tarro UNIQUE (tarro_id);
  END IF;

  -- B3 · Valores permitidos
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'lotes_estado_valido') THEN
    ALTER TABLE lotes ADD CONSTRAINT lotes_estado_valido
      CHECK (estado IN ('Activo', 'Pausado'));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tarros_resultado_valido') THEN
    ALTER TABLE tarros ADD CONSTRAINT tarros_resultado_valido
      CHECK (resultado IN ('Muestra', 'Aprobado', 'No Aprobado'));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'alertas_nivel_valido') THEN
    ALTER TABLE alertas ADD CONSTRAINT alertas_nivel_valido
      CHECK (nivel IN ('Amarilla', 'Roja'));
  END IF;

  -- Mismo patrón que lib/validacion.ts (acepta mayúsculas y minúsculas)
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tarros_resultado_hex_formato') THEN
    ALTER TABLE tarros ADD CONSTRAINT tarros_resultado_hex_formato
      CHECK (resultado_hex ~ '^#[0-9A-Fa-f]{6}$');
  END IF;

  -- Coherencia del tarro: o es la muestra (sin ΔE) o es una lectura (con ΔE y dictamen)
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tarros_muestra_o_lectura') THEN
    ALTER TABLE tarros ADD CONSTRAINT tarros_muestra_o_lectura CHECK (
      (es_muestra AND resultado = 'Muestra' AND desviacion_delta_e IS NULL)
      OR
      (NOT es_muestra AND resultado IN ('Aprobado', 'No Aprobado') AND desviacion_delta_e IS NOT NULL)
    );
  END IF;

  -- B5 · congela_registro dice lo mismo que nivel = 'Roja'
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'alertas_congela_coherente') THEN
    ALTER TABLE alertas ADD CONSTRAINT alertas_congela_coherente
      CHECK (congela_registro = (nivel = 'Roja'));
  END IF;

  -- Claves foráneas (en la base real ya existen: tarros_lote_id_fkey y alertas_tarro_id_fkey)
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'tarros'::regclass AND contype = 'f' AND confrelid = 'lotes'::regclass
  ) THEN
    ALTER TABLE tarros ADD CONSTRAINT tarros_lote_id_fkey
      FOREIGN KEY (lote_id) REFERENCES lotes (id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'alertas'::regclass AND contype = 'f' AND confrelid = 'tarros'::regclass
  ) THEN
    ALTER TABLE alertas ADD CONSTRAINT alertas_tarro_id_fkey
      FOREIGN KEY (tarro_id) REFERENCES tarros (id_tarro);
  END IF;
END
$$;

COMMIT;
