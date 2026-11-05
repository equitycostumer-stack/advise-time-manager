-- Campo opcional usado para elegir entre “Mejor asesor” y “Mejor asesora”.
-- El backend también ejecuta esta operación idempotente al usar las rutas correspondientes.
ALTER TABLE asesores
    ADD COLUMN IF NOT EXISTS genero VARCHAR(12);
