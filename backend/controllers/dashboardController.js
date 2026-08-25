// ======================================================
// ADVISE SOLUTIONS SERVICES
// TIME MANAGER
// Dashboard Controller (PostgreSQL / Supabase)
// ======================================================
const resumenJornadaService = require("../services/resumenJornadaService");
const db = require("../config/db");


// ======================================================
// DASHBOARD
// ======================================================

const obtenerDashboard = async (req, res) => {

    console.log("");
    console.log("==========================================");
    console.log("📊 OBTENER DASHBOARD");
    console.log("==========================================");

    const sql = `
        SELECT
            a.id,
            a.nombre,
            a.activo,

            COALESCE(
                e.estado,
                'DISPONIBLE'
            ) AS estado,

            e.inicio_estado,

            COALESCE(
                e.inicio_jornada,
                j.inicio_jornada
            ) AS inicio_jornada

        FROM asesores a

        LEFT JOIN estados_actuales e
            ON a.id = e.asesor_id

        LEFT JOIN (
            SELECT
                asesor_id,
                MIN(fecha_hora) AS inicio_jornada
            FROM movimientos
            WHERE
                tipo = 'ENTRADA'
                AND fecha_hora::date = (NOW() AT TIME ZONE 'America/Bogota')::date
            GROUP BY asesor_id
        ) j
            ON j.asesor_id = a.id

        WHERE
            a.activo = 1

        ORDER BY
            a.nombre ASC
    `;

    try {
        // Ejecutar consulta usando async/await compatible con 'pg'
        const resultado = await db.query(sql);
        const rows = resultado.rows || [];

        console.log("");
        console.log("ASESORES ENCONTRADOS:", rows.length);

        // --------------------------------------------------
        // PROCESAR ASESORES
        // --------------------------------------------------

        const asesores = await Promise.all(rows.map(async (asesor) => {

            console.log("");
            console.log("------------------------------------------");
            console.log("👤 ASESOR:", asesor.nombre);
            console.log("ID:", asesor.id);
            console.log("ESTADO:", asesor.estado);
            console.log("INICIO ESTADO:", asesor.inicio_estado);
            console.log("INICIO JORNADA:", asesor.inicio_jornada);
            console.log("------------------------------------------");

            const retraso = await resumenJornadaService.calcularRetraso(
                asesor.inicio_jornada
            );

            return {
                ...asesor,
                llego_tarde: !!retraso.llego_tarde,
                minutos_retraso: retraso.minutos_retraso
            };

        }));

        console.log("");
        console.log("==========================================");
        console.log("✅ DASHBOARD GENERADO:", asesores.length, "ASESORES");
        console.log("==========================================");
        console.log("");

        return res.json({
            ok: true,
            total: asesores.length,
            asesores
        });

    } catch (err) {
        console.log("");
        console.log("==========================================");
        console.log("❌ ERROR SQL DASHBOARD");
        console.log("==========================================");
        console.error(err);

        return res.status(500).json({
            ok: false,
            error: err.message,
            code: err.code
        });
    }

};

// ======================================================
// EXPORTAR
// ======================================================

module.exports = {
    obtenerDashboard
};