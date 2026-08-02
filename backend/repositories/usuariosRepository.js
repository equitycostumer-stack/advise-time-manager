// ======================================================
// EQUITY LINE PROFESSIONAL SERVICES
// TIME MANAGER
// Usuarios Repository
// ======================================================

const db = require("../config/db");

class UsuariosRepository {

    // ======================================================
    // EJECUTAR CONSULTA
    // ======================================================

    ejecutar(sql, parametros = []) {

        return new Promise((resolve, reject) => {

            db.query(
                sql,
                parametros,
                (error, resultado) => {

                    if (error) {
                        return reject(error);
                    }

                    resolve(resultado);

                }
            );

        });

    }

    // ======================================================
    // BUSCAR USUARIO POR LOGIN
    // ======================================================

    async obtenerPorUsuario(usuario) {

        const sql = `
            SELECT *
            FROM usuarios
            WHERE usuario = ?
            LIMIT 1
        `;

        const filas = await this.ejecutar(sql, [usuario]);

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
        VALUES
        (
            ?,
            ?,
            ?,
            ?,
            ?,
            ?
        )
    `;

    const resultado = await this.ejecutar(sql, [

        datos.asesor_id,

        datos.usuario,

        datos.email,

        datos.telefono,

        datos.password,

        datos.rol

    ]);

    return resultado.insertId;

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
            u.ultimo_acceso,
            u.created_at,
            a.nombre AS asesor
        FROM usuarios u
        LEFT JOIN asesores a
            ON a.id = u.asesor_id
        ORDER BY
            u.id ASC
    `;

    return await this.ejecutar(sql);

}
// ======================================================
// VALIDAR SI EXISTE USUARIO
// ======================================================

async existeUsuario(usuario) {

    const sql = `
        SELECT
            id
        FROM usuarios
        WHERE usuario = ?
        LIMIT 1
    `;

    const filas = await this.ejecutar(

        sql,

        [usuario]

    );

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
}

module.exports = new UsuariosRepository();