-- Equity Line: prioridades 1, 2 y 3
-- Ejecutar una sola vez en Supabase SQL Editor.

CREATE TABLE IF NOT EXISTS metas_asesores (
    id BIGSERIAL PRIMARY KEY,
    asesor_id INTEGER NOT NULL REFERENCES asesores(id) ON DELETE CASCADE,
    periodo_tipo VARCHAR(12) NOT NULL DEFAULT 'MES' CHECK (periodo_tipo IN ('MES', 'QUINCENA')),
    periodo_inicio DATE NOT NULL,
    periodo_fin DATE NOT NULL,
    meta_ventas NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (meta_ventas >= 0),
    meta_recaudo NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (meta_recaudo >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
    CONSTRAINT metas_asesores_periodo_valido CHECK (periodo_fin >= periodo_inicio),
    CONSTRAINT metas_asesores_unica_periodo UNIQUE (asesor_id, periodo_tipo, periodo_inicio, periodo_fin)
);

CREATE INDEX IF NOT EXISTS idx_metas_asesores_periodo
    ON metas_asesores (periodo_inicio, periodo_fin, asesor_id);

CREATE INDEX IF NOT EXISTS idx_ventas_activas_fecha_asesor
    ON ventas (fecha_hora, asesor_id)
    WHERE estado = 'ACTIVA';

-- El índice de incidencias se omite deliberadamente porque las instalaciones
-- antiguas pueden usar fecha_hora o created_at. Verifica el nombre real antes.
