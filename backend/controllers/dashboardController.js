// ======================================================
// EQUITY LINE PROFESSIONAL SERVICES
// TIME MANAGER
// Dashboard Controller
// ======================================================

const db = require("../config/db");

// ======================================================
// CALCULAR RETRASO
// ======================================================

function calcularRetraso(inicioJornada) {

    if (!inicioJornada) {

        return {
            llego_tarde: false,
            minutos_retraso: 0
        };

    }

    const fecha = new Date(inicioJornada);

    const horaEntrada = new Date(inicioJornada);

    // Hora oficial de entrada: 08:00 AM
    horaEntrada.setHours(8);
    horaEntrada.setMinutes(0);
    horaEntrada.setSeconds(0);
    horaEntrada.setMilliseconds(0);

    const diferencia = Math.floor(
        (fecha.getTime() - horaEntrada.getTime()) / 60000
    );

    return {

        llego_tarde: diferencia > 0,

        minutos_retraso: diferencia > 0
            ? diferencia
            : 0

    };

}

// ======================================================
// DASHBOARD
// ======================================================

const obtenerDashboard = (req, res) => {

    const sql = `
        SELECT
            a.id,
            a.nombre,
            a.activo,
            COALESCE(e.estado,'DISPONIBLE') AS estado,
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

                mensaje: "Error obteniendo dashboard."

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

        return res.json({

            ok: true,

            total: asesores.length,

            asesores

        });

    });

};

module.exports = {

    obtenerDashboard

};