const db = require("../config/db");
const { calcularRetraso } = require("../utils/horarios");

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