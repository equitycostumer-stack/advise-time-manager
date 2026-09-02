const db = require("../config/db");

class ConfiguracionEmpresaRepository {
    async obtener() {
        const result = await db.query(`
            SELECT id, nombre_empresa, nombre_corto, coach,
                   customer_service, jefe, mensaje_dia,
                   correo_contacto, telefono_contacto, updated_at
            FROM configuracion_empresa
            WHERE id = 1
            LIMIT 1
        `);
        return result.rows[0] || null;
    }

    async actualizar(datos, usuarioId) {
        const result = await db.query(`
            UPDATE configuracion_empresa
            SET nombre_empresa = $1,
                nombre_corto = $2,
                coach = $3,
                customer_service = $4,
                jefe = $5,
                mensaje_dia = $6,
                correo_contacto = $7,
                telefono_contacto = $8,
                updated_at = NOW(),
                updated_by = $9
            WHERE id = 1
            RETURNING id, nombre_empresa, nombre_corto, coach,
                      customer_service, jefe, mensaje_dia,
                      correo_contacto, telefono_contacto, updated_at
        `, [datos.nombre_empresa, datos.nombre_corto, datos.coach,
            datos.customer_service, datos.jefe, datos.mensaje_dia,
            datos.correo_contacto, datos.telefono_contacto, usuarioId || null]);
        return result.rows[0] || null;
    }
}

module.exports = new ConfiguracionEmpresaRepository();
