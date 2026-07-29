const db = require("../config/db");

// =========================================
// OBTENER ASESORES
// =========================================

exports.obtenerAsesores = (req, res) => {

    const sql = `
        SELECT
            id,
            nombre,
            activo
        FROM asesores
        WHERE activo = 1
        ORDER BY nombre
    `;

    db.query(sql, (err, resultados) => {

        if (err) {

            console.error(err);

            return res.status(500).json({
                mensaje: "Error obteniendo asesores."
            });

        }

        res.json(resultados);

    });

};

// =========================================
// OBTENER ESTADO ACTUAL
// =========================================

exports.obtenerEstado = (req, res) => {

    const asesor = req.params.id;

    const sql = `

        SELECT

            estado,
            inicio_estado

        FROM estados_actuales

        WHERE asesor_id = ?

    `;

    db.query(sql, [asesor], (err, datos) => {

        if (err) {

            console.error(err);

            return res.status(500).json({
                mensaje: "Error obteniendo estado."
            });

        }

        if (datos.length === 0) {

            return res.json({
                estado: "Disponible"
            });

        }

        res.json(datos[0]);

    });

};

// =========================================
// REGISTRAR MOVIMIENTO
// =========================================

exports.registrarMovimiento = (req, res) => {

    const {

        asesor_id,
        tipo

    } = req.body;

    if (!asesor_id || !tipo) {

        return res.status(400).json({
            mensaje: "Datos incompletos."
        });

    }

    const sql = `

        INSERT INTO movimientos
        (
            asesor_id,
            tipo,
            fecha_hora
        )

        VALUES
        (
            ?,
            ?,
            NOW()
        )

    `;

    db.query(

        sql,

        [

            asesor_id,
            tipo

        ],

        (err) => {

            if (err) {

                console.error(err);

                return res.status(500).json({

                    mensaje: "No fue posible registrar."

                });

            }

            actualizarEstado(

                asesor_id,

                tipo,

                res

            );

        }

    );

};

// =========================================
// ACTUALIZAR ESTADO
// =========================================

function actualizarEstado(

    asesor,

    estado,

    res

) {

    const sql = `

        INSERT INTO estados_actuales
        (
            asesor_id,
            estado,
            inicio_estado
        )

        VALUES
        (
            ?,
            ?,
            NOW()
        )

        ON DUPLICATE KEY UPDATE

        estado = VALUES(estado),

        inicio_estado = NOW()

    `;

    db.query(

        sql,

        [

            asesor,
            estado

        ],

        (err) => {

            if (err) {

                console.error(err);

                return res.status(500).json({

                    mensaje: "Error actualizando estado."

                });

            }

            res.json({

                ok: true

            });

        }

    );

}