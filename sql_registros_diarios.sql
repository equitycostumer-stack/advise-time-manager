-- ======================================================
-- EQUITY LINE - REGISTROS DIARIOS DE DATOS Y ANÁLISIS
-- Ejecutar una sola vez en Supabase SQL Editor.
-- ======================================================

CREATE TABLE IF NOT EXISTS registros_diarios_analistas (
    id BIGSERIAL PRIMARY KEY,
    asesor_id INTEGER NOT NULL REFERENCES asesores(id) ON DELETE RESTRICT,
    fecha DATE NOT NULL,
    datos_cantidad INTEGER NOT NULL DEFAULT 0 CHECK (datos_cantidad >= 0),
    datos_ids TEXT NOT NULL DEFAULT '',
    analisis_cantidad INTEGER NOT NULL DEFAULT 0 CHECK (analisis_cantidad >= 0),
    analisis_ids TEXT NOT NULL DEFAULT '',
    creado_por INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
    actualizado_por INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT registros_diarios_analistas_unicos UNIQUE (asesor_id, fecha)
);

CREATE INDEX IF NOT EXISTS idx_registros_diarios_fecha
    ON registros_diarios_analistas (fecha);

CREATE INDEX IF NOT EXISTS idx_registros_diarios_asesor_fecha
    ON registros_diarios_analistas (asesor_id, fecha DESC);

CREATE OR REPLACE FUNCTION actualizar_updated_at_registros_diarios()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_registros_diarios_updated_at
    ON registros_diarios_analistas;

CREATE TRIGGER trg_registros_diarios_updated_at
    BEFORE UPDATE ON registros_diarios_analistas
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_updated_at_registros_diarios();
