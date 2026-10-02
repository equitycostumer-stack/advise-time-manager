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

-- Auditoría de anulaciones: no se elimina la venta original ni su historial.
CREATE TABLE IF NOT EXISTS ventas_anulaciones_auditoria (
    id BIGSERIAL PRIMARY KEY,
    venta_id BIGINT NOT NULL REFERENCES ventas(id) ON DELETE RESTRICT,
    asesor_id INTEGER REFERENCES asesores(id) ON DELETE SET NULL,
    cliente_id VARCHAR(100),
    valor NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (valor >= 0),
    recaudo NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (recaudo >= 0),
    motivo VARCHAR(500) NOT NULL CHECK (char_length(btrim(motivo)) >= 5),
    anulado_por INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
    anulado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT ventas_anulaciones_auditoria_venta_unica UNIQUE (venta_id)
);
CREATE INDEX IF NOT EXISTS idx_ventas_anulaciones_fecha
    ON ventas_anulaciones_auditoria (anulado_en DESC);
CREATE INDEX IF NOT EXISTS idx_ventas_anulaciones_asesor
    ON ventas_anulaciones_auditoria (asesor_id, anulado_en DESC);

-- Unificar tipos usados por la aplicación. La conversión usa texto para ser
-- compatible tanto con instalaciones antiguas INTEGER/SMALLINT como BOOLEAN.
ALTER TABLE resumen_jornada
    ALTER COLUMN llego_tarde DROP DEFAULT,
    ALTER COLUMN llego_tarde TYPE BOOLEAN
    USING (LOWER(BTRIM(llego_tarde::text)) IN ('1', 'true', 't', 'yes', 'si'));
ALTER TABLE resumen_jornada ALTER COLUMN llego_tarde SET DEFAULT FALSE;
ALTER TABLE incidencias
    ALTER COLUMN revisada DROP DEFAULT,
    ALTER COLUMN revisada TYPE BOOLEAN
    USING (LOWER(BTRIM(revisada::text)) IN ('1', 'true', 't', 'yes', 'si'));
ALTER TABLE incidencias ALTER COLUMN revisada SET DEFAULT FALSE;
ALTER TABLE metas_asesores
    ALTER COLUMN meta_ventas TYPE INTEGER
    USING ROUND(meta_ventas::numeric)::integer;

ALTER TABLE metas_asesores
    DROP CONSTRAINT IF EXISTS metas_asesores_meta_ventas_check;
ALTER TABLE metas_asesores
    ADD CONSTRAINT metas_asesores_meta_ventas_check CHECK (meta_ventas >= 0);
