// ======================================================
// EQUITY LINE PROFESSIONAL SERVICES
// TIME MANAGER
// Dashboard Controller
// ======================================================

const db = require("../config/db");
const resumenJornadaService = require("../services/resumenJornadaService");



// ======================================================
// DASHBOARD
// ======================================================

const obtenerDashboard = async (req, res) => {

    console.log("");
    console.log("==========================================");
    console.log("📊 OBTENER DASHBOARD");
    console.log("==========================================");

    // --------------------------------------------------
    // IMPORTANTE:
    //
    // 1. Primero usamos estados_actuales.inicio_jornada
    //    porque se actualiza directamente al hacer ENTRADA.
    //
    // 2. movimientos queda como respaldo.
    //
    // 3. Solo tomamos ENTRADA del día actual.
    // --------------------------------------------------

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

                MIN(fecha_hora)
                    AS inicio_jornada

            FROM movimientos

            WHERE

                tipo = 'ENTRADA'

                AND DATE(fecha_hora) = CURDATE()

            GROUP BY asesor_id

        ) j

            ON j.asesor_id = a.id

        WHERE

            a.activo = 1

        ORDER BY

            a.nombre ASC

    `;

    // --------------------------------------------------
    // EJECUTAR SQL
    // --------------------------------------------------

    db.query(sql, async (err, rows) => {

        if (err) {

            console.log("");
            console.log("==========================================");
            console.log("❌ ERROR SQL DASHBOARD");
            console.log("==========================================");

            console.error(err);

            return res.status(500).json({

                ok: false,

                error: err.message,

                sqlMessage:
                    err.sqlMessage,

                sql:
                    err.sql,

                code:
                    err.code

            });

        }

        console.log("");
        console.log(
            "ASESORES ENCONTRADOS:",
            rows.length
        );

        // --------------------------------------------------
        // PROCESAR ASESORES
        // --------------------------------------------------

         const asesores =
            await Promise.all(rows.map(async (asesor) => {

                console.log("");
                console.log("------------------------------------------");
                console.log(
                    "👤 ASESOR:",
                    asesor.nombre
                );
                console.log(
                    "ID:",
                    asesor.id
                );
                console.log(
                    "ESTADO:",
                    asesor.estado
                );
                console.log(
                    "INICIO ESTADO:",
                    asesor.inicio_estado
                );
                console.log(
                    "INICIO JORNADA:",
                    asesor.inicio_jornada
                );
                console.log("------------------------------------------");

                // -----------------------------------------
                // Calcular retraso (misma lógica que el
                // resumen individual: horario oficial real
                // + zona horaria Colombia)
                // -----------------------------------------

                const retraso =
                    await resumenJornadaService.calcularRetraso(
                        asesor.inicio_jornada
                    );

                // -----------------------------------------
                // Retornar asesor
                // -----------------------------------------

                return {

                    ...asesor,

                    llego_tarde:
                        !!retraso.llego_tarde,

                    minutos_retraso:
                        retraso.minutos_retraso

                };

            }));

        // --------------------------------------------------
        // RESPUESTA
        // --------------------------------------------------

        console.log("");
        console.log("==========================================");
        console.log(
            "✅ DASHBOARD GENERADO:",
            asesores.length,
            "ASESORES"
        );
        console.log("==========================================");
        console.log("");

        return res.json({

            ok: true,

            total:
                asesores.length,

            asesores

        });

    });

};

// ======================================================
// EXPORTAR
// ======================================================

module.exports = {

    obtenerDashboard

};