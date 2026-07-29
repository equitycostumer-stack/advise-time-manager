const db = require("../config/db");

const { calcularRetraso } = require("../utils/horarios");

const {registrarIncidencia} = require("./incidenciasController");

const {evaluarIncidencia} = require("../utils/incidencias");

// ============================================
// DASHBOARD EN TIEMPO REAL
// ============================================

const obtenerDashboard = (req, res) => {

    const sql = `
        SELECT
            a.id,
            a.nombre,
            a.activo,
            COALESCE(e.estado, 'DISPONIBLE') AS estado,
            e.inicio_estado,
            e.inicio_jornada
        FROM asesores a
        LEFT JOIN estados_actuales e
            ON a.id = e.asesor_id
        WHERE a.activo = 1
        ORDER BY a.nombre ASC
    `;

    db.query(sql, (err, rows) => {

        if (err) {

            console.error(err);

            return res.status(500).json({
                ok: false,
                error: "Error obteniendo dashboard."
            });

        }

        const asesores = rows.map((asesor) => {

    const retraso = calcularRetraso(
        asesor.inicio_jornada
    );
if (retraso.llego_tarde) {

    registrarIncidencia(

        asesor.id,

        "LLEGADA TARDE",

        "ALTA",

        `${retraso.minutos_retraso} minutos de retraso`

    );

}
const incidencia = evaluarIncidencia(asesor);

if (incidencia) {

    registrarIncidencia(

        asesor.id,

        incidencia.tipo,

        incidencia.nivel,

        incidencia.detalle

    );

}
    return {

        ...asesor,

        llego_tarde: retraso.llego_tarde,

        minutos_retraso: retraso.minutos_retraso

    };

});

res.json({

    ok: true,

    asesores

});

    });

};

module.exports = {
    obtenerDashboard
};