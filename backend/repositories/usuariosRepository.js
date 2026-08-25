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

    async existeUsuario(usuario) {
        const sql = `
            SELECT id
            FROM usuarios
            WHERE LOWER(usuario) = LOWER(?) OR LOWER(email) = LOWER(?)
            LIMIT 1
        `;

        const filas = await this.ejecutar(sql, [usuario, usuario]);

        return filas.length > 0;
    }

    // ======================================================
    // ACTUALIZAR USUARIO
    // ======================================================

    async actualizar(id, datos) {
        const sql = `
            UPDATE usuarios
            SET
                email = ?,
                telefono = ?,
                rol = ?,
                activo = ?
            WHERE id = ?
        `;

        await this.ejecutar(sql, [
            datos.email,
            datos.telefono,
            datos.rol,
            datos.activo,
            id
        ]);

        return true;
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
}

module.exports = new UsuariosRepository();