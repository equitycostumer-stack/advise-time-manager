const db = require("../config/db");

// Se activará nuevamente cuando terminemos el módulo de notificaciones.
// const { enviarNotificacion } = require("../utils/notificaciones");

const registrarIncidencia = (

    asesorId,

    tipo,

    nivel,

    detalle

) => {

    const sql = `

        INSERT INTO incidencias

        (

            asesor_id,

            tipo,

            nivel,

            detalle

        )

        VALUES (?, ?, ?, ?)

    `;

    db.query(

        sql,

        [

            asesorId,

            tipo,

            nivel,

            detalle

        ],

        (err) => {

            if (err) {

                if (err.code === "ER_DUP_ENTRY") {

                    return;

                }

                console.error(

                    "Error registrando incidencia:",

                    err

                );

                return;

            }

            // Aquí volveremos a activar las notificaciones.
            /*
            enviarNotificacion({

                asesor_id: asesorId,

                nombre: `Asesor #${asesorId}`,

                tipo,

                nivel,

                detalle

            });
            */

        }

    );

};

const revisarIncidencia = (req, res) => {

    const { id } = req.params;

    const {

        coach,

        comentario

    } = req.body;

    const sql = `

        UPDATE incidencias

        SET

            revisada = 1,

            revisada_por = ?,

            comentario = ?,

            fecha_revision = NOW()

        WHERE id = ?

    `;

    db.query(

        sql,

        [

            coach,

            comentario,

            id

        ],

        (err) => {

            if (err) {

                console.error(err);

                return res.status(500).json({

                    ok: false,

                    error: "No fue posible revisar la incidencia."

                });

            }

            return res.json({

                ok: true,

                mensaje: "Incidencia revisada correctamente."

            });

        }

    );

};

module.exports = {

    registrarIncidencia,

    revisarIncidencia

};