const express = require("express");
const router = express.Router();

const db = require("../config/db");

const {

    revisarIncidencia

} = require("../controllers/incidenciasController");


// ======================================================
// OBTENER INCIDENCIAS
// ======================================================

router.get("/", (req, res) => {

    const sql = `
        SELECT
            i.*,
            a.nombre
        FROM incidencias i
        INNER JOIN asesores a
            ON a.id = i.asesor_id
        ORDER BY
            i.revisada ASC,
            i.fecha_hora DESC
    `;

    db.query(sql, (err, rows) => {

        if (err) {

            console.error(err);

            return res.status(500).json({

                ok: false,

                error: "Error obteniendo incidencias."

            });

        }

        res.json(rows);

    });

});


// ======================================================
// REVISAR INCIDENCIA
// ======================================================

router.put(

    "/:id/revisar",

    revisarIncidencia

);


module.exports = router;