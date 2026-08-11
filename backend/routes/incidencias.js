const express = require("express");
const router = express.Router();

const db = require("../config/db");

const {
    revisarIncidencia
} = require("../controllers/incidenciasController");

// ======================================================
// INCIDENCIAS PENDIENTES (Dashboard)
// ======================================================

router.get("/", (req, res) => {

    const sql = `
        SELECT
            i.*,
            a.nombre
        FROM incidencias i
        INNER JOIN asesores a
            ON a.id = i.asesor_id
        WHERE
            i.revisada = 0
            AND DATE(i.fecha_hora) = CURDATE()
        ORDER BY
            i.fecha_hora DESC
    `;

    db.query(sql, (err, rows) => {

        if (err) {

            console.error(err);

            return res.status(500).json({

                ok: false,

                mensaje: "Error obteniendo incidencias."

            });

        }

        res.json(rows);

    });

});

// ======================================================
// HISTORIAL COMPLETO DE INCIDENCIAS DEL DÍA
// ======================================================

router.get("/asesor/:asesorId", (req, res) => {

    const sql = `
        SELECT
            id,
            tipo,
            descripcion,
            fecha_hora,
            revisada
        FROM incidencias
        WHERE
            asesor_id = ?
            AND DATE(fecha_hora)=CURDATE()
        ORDER BY fecha_hora DESC
    `;

    db.query(

        sql,

        [req.params.asesorId],

        (err, rows) => {

            if (err) {

                console.error(err);

                return res.status(500).json({

                    ok:false,

                    mensaje:"Error obteniendo historial."

                });

            }

            res.json({

                ok:true,

                incidencias:rows

            });

        }

    );

});

// ======================================================
// REVISAR INCIDENCIA
// ======================================================

router.put(

    "/:id/revisar",

    revisarIncidencia

);

module.exports = router;