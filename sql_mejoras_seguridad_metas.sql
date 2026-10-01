-- Ejecutar una sola vez en Supabase SQL Editor.
-- Auditoría de cada cambio de meta, incluyendo quién y cuándo.
CREATE TABLE IF NOT EXISTS metas_asesores_auditoria (
    id BIGSERIAL PRIMARY KEY,
    meta_id BIGINT REFERENCES metas_asesores(id) ON DELETE SET NULL,
    asesor_id INTEGER NOT NULL REFERENCES asesores(id) ON DELETE CASCADE,
    periodo_tipo VARCHAR(12) NOT NULL CHECK (periodo_tipo = 'QUINCENA'),
    periodo_inicio DATE NOT NULL,
    periodo_fin DATE NOT NULL,
    meta_ventas INTEGER NOT NULL DEFAULT 0 CHECK (meta_ventas >= 0),
    meta_recaudo NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (meta_recaudo >= 0),
    cambiado_por INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
    cambiado_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_metas_auditoria_periodo
    ON metas_asesores_auditoria (periodo_inicio, periodo_fin, asesor_id, cambiado_at DESC);
-- Índices seguros para consultas por asesor y fecha en ventas.
CREATE INDEX IF NOT EXISTS idx_ventas_asesor_fecha_estado
    ON ventas (asesor_id, fecha_hora, estado);
