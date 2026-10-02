// ======================================================
// ADVISE SOLUTIONS SERVICES
// TIME MANAGER
// Usuarios Repository (PostgreSQL / Supabase)
// ======================================================

const db = require("../config/db");

class UsuariosRepository {

    // ======================================================
    // EJECUTAR CONSULTA POSTGRESQL
    // ======================================================

    async ejecutar(sql, parametros = []) {
        // Convertir signos '?' de MySQL a '$1, $2, $3...' de PostgreSQL
        let index = 1;
        const sqlPostgres = sql.replace(/\?/g, () => `$${index++}`);

        try {
            const resultado = await db.query(sqlPostgres, parametros);

            // Si es un SELECT o consulta con RETURNING, devolver resultado.rows
            if (resultado.rows) {
                return resultado.rows;
            }

            return resultado;
        } catch (error) {
            console.error("❌ Error ejecutando SQL en PostgreSQL (Usuarios):", error);
            throw error;
        }
    }

    // ======================================================
    // BUSCAR USUARIO POR LOGIN (USUARIO O EMAIL)
    // ======================================================

    async obtenerPorUsuario(usuarioOEmail) {
        const sql = `
            SELECT *
            FROM usuarios
            WHERE LOWER(usuario) = LOWER(?) OR LOWER(email) = LOWER(?)
            LIMIT 1
        `;

        const filas = await this.ejecutar(sql, [usuarioOEmail, usuarioOEmail]);

        return filas.length ? filas[0] : null;
    }

    // ======================================================
    // BUSCAR USUARIO POR ID
    // ======================================================

    async obtenerPorId(id) {
        const sql = `
            SELECT *
            FROM usuarios
            WHERE id = ?
            LIMIT 1
        `;

        const filas = await this.ejecutar(sql, [id]);

        return filas.length ? filas[0] : null;
    }

    // ======================================================
    // CREAR USUARIO
    // ======================================================

    async crear(datos) {
        const sql = `
            INSERT INTO usuarios
            (
                asesor_id,
                usuario,
                email,
                telefono,
                password,
                rol
            )
            VALUES (?, ?, ?, ?, ?, ?)
            RETURNING id
        `;

        const filas = await this.ejecutar(sql, [
            datos.asesor_id,
            datos.usuario,
            datos.email,
            datos.telefono,
            datos.password,
            datos.rol
        ]);

        return filas[0].id;
    }

    // ======================================================
    // LISTAR USUARIOS
    // ======================================================

    async listar() {
        const sql = `
            SELECT
                u.id,
                u.asesor_id,
                u.usuario,
                u.email,
                u.telefono,
                u.rol,
                u.activo,
                u.debe_cambiar_password,
                u.intentos_fallidos,
                u.bloqueado_hasta,
                u.ultimo_acceso,
                u.created_at,
                a.nombre AS asesor
            FROM usuarios u
            LEFT JOIN asesores a
                ON a.id = u.asesor_id
            ORDER BY u.id ASC
        `;

        return await this.ejecutar(sql);
    }

    // ======================================================
    // VALIDAR SI EXISTE USUARIO
    // ======================================================

    async existeUsuario(usuario, email = null) {
        const sql = `
            SELECT id
            FROM usuarios
            WHERE LOWER(usuario) = LOWER(?) OR (CAST(? AS TEXT) IS NOT NULL AND LOWER(email) = LOWER(CAST(? AS TEXT)))
            LIMIT 1
        `;

        const filas = await this.ejecutar(sql, [usuario, email, email]);

        return filas.length > 0;
    }

    async existeUsuarioExcepto(usuario, email, id) {
        const filas = await this.ejecutar(`
            SELECT id FROM usuarios
            WHERE id <> ?
              AND (LOWER(usuario) = LOWER(?) OR (CAST(? AS TEXT) IS NOT NULL AND LOWER(email) = LOWER(CAST(? AS TEXT))))
            LIMIT 1
        `, [id, usuario, email, email]);
        return filas.length > 0;
    }

    // ======================================================
    // ACTUALIZAR USUARIO
    // ======================================================

    async actualizar(id, datos) {
        const sql = `
            UPDATE usuarios
            SET
                asesor_id = ?,
                email = ?,
                telefono = ?,
                rol = ?,
                activo = ?
            WHERE id = ?
        `;

        await this.ejecutar(sql, [
            datos.asesor_id,
            datos.email,
            datos.telefono,
            datos.rol,
            datos.activo,
            id
        ]);

        if (datos.rol === "ASESOR" && datos.asesor_id) {
            await this.ejecutar(
                "UPDATE asesores SET activo = ? WHERE id = ?",
                [datos.activo ? 1 : 0, datos.asesor_id]
            );
        }

        return true;
    }

    async eliminarAsesor(id, usuarioId, motivo) {
        const client = await db.pool.connect();
        try {
            await client.query("BEGIN");
            const actual = await client.query(`
                SELECT u.id, u.usuario, u.rol, u.asesor_id, u.activo,
                       a.nombre AS asesor_nombre, a.activo AS asesor_activo
                FROM usuarios u
                LEFT JOIN asesores a ON a.id = u.asesor_id
                WHERE u.id = $1
                FOR UPDATE
            `, [id]);
            if (!actual.rows.length) throw new Error("El usuario no existe.");
            const anterior = actual.rows[0];
            if (anterior.rol !== "ASESOR") throw new Error("Solo se puede eliminar un usuario con rol ASESOR.");
            if (!anterior.asesor_id) throw new Error("El usuario no tiene un asesor vinculado.");
            const nuevoUsuario = await client.query("UPDATE usuarios SET activo = 0 WHERE id = $1 RETURNING id, usuario, rol, asesor_id, activo", [id]);
            const nuevoAsesor = await client.query("UPDATE asesores SET activo = 0 WHERE id = $1 RETURNING id, nombre, activo", [anterior.asesor_id]);
            await client.query(`
                INSERT INTO auditoria_administrativa
                    (usuario_id, accion, entidad, entidad_id, motivo, datos_anteriores, datos_nuevos)
                VALUES ($1, 'BAJA_LOGICA', 'ASESOR', $2, $3, $4::jsonb, $5::jsonb)
            `, [usuarioId || null, anterior.asesor_id, motivo, JSON.stringify(anterior), JSON.stringify({ usuario: nuevoUsuario.rows[0], asesor: nuevoAsesor.rows[0] })]);
            await client.query("COMMIT");
            return { usuario: nuevoUsuario.rows[0], asesor: nuevoAsesor.rows[0] };
        } catch (error) {
            await client.query("ROLLBACK");
            throw error;
        } finally {
            client.release();
        }
    }

    // ======================================================
    // ACTUALIZAR PASSWORD
    // ======================================================

    async actualizarPassword(id, passwordHash) {
        const sql = `
            UPDATE usuarios
            SET
                password = ?,
                debe_cambiar_password = true,
                ultimo_cambio_password = NOW(),
                intentos_fallidos = 0,
                bloqueado_hasta = NULL
            WHERE id = ?
        `;

        await this.ejecutar(sql, [
            passwordHash,
            id
        ]);

        return true;
    }

    // ======================================================
    // ACTUALIZAR PASSWORD (CAMBIO PROPIO DEL USUARIO)
    // ======================================================

    async actualizarPasswordPropia(id, passwordHash) {
        const sql = `
            UPDATE usuarios
            SET
                password = ?,
                debe_cambiar_password = false,
                ultimo_cambio_password = NOW(),
                intentos_fallidos = 0,
                bloqueado_hasta = NULL
            WHERE id = ?
        `;

        await this.ejecutar(sql, [
            passwordHash,
            id
        ]);

        return true;
    }

    // ======================================================
    // ACTUALIZAR ÚLTIMO ACCESO
    // ======================================================

    async actualizarUltimoAcceso(id) {
        const sql = `
            UPDATE usuarios
            SET ultimo_acceso = NOW()
            WHERE id = ?
        `;

        await this.ejecutar(sql, [id]);

        return true;
    }

    async registrarFalloLogin(id, intentosFallidos, bloqueadoHasta) {
        await this.ejecutar(`
            UPDATE usuarios
            SET intentos_fallidos = ?, bloqueado_hasta = ?
            WHERE id = ?
        `, [intentosFallidos, bloqueadoHasta, id]);
    }

    async limpiarFallosLogin(id) {
        await this.ejecutar(`
            UPDATE usuarios
            SET intentos_fallidos = 0, bloqueado_hasta = NULL
            WHERE id = ?
        `, [id]);
    }
}

module.exports = new UsuariosRepository();
