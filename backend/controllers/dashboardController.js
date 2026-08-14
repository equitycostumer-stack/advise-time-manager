// ======================================================
// EQUITY LINE PROFESSIONAL SERVICES
// TIME MANAGER
// Dashboard Controller
// ======================================================

const db = require("../config/db");

// ======================================================
// CALCULAR RETRASO SEGÚN EL DÍA
// ======================================================

function calcularRetraso(inicioJornada) {

    if (!inicioJornada) {

        return {
            llego_tarde: false,
            minutos_retraso: 0
        };

    }

    // -----------------------------------------
    // Crear fecha de entrada
    // -----------------------------------------

    const entrada = new Date(inicioJornada);

    if (isNaN(entrada.getTime())) {

        console.error(
            "❌ FECHA DE ENTRADA INVÁLIDA:",
            inicioJornada
        );

        return {
            llego_tarde: false,
            minutos_retraso: 0
        };

    }

    // -----------------------------------------
    // Día de la semana
    //
    // 0 = Domingo
    // 1 = Lunes
    // 2 = Martes
    // 3 = Miércoles
    // 4 = Jueves
    // 5 = Viernes
    // 6 = Sábado
    // -----------------------------------------

    const dia = entrada.getDay();

    // -----------------------------------------
    // Hora oficial de ingreso
    // -----------------------------------------

    const horaOficial = new Date(entrada);

    switch (dia) {

        // Lunes a Jueves
        case 1:
        case 2:
        case 3:
        case 4:

            horaOficial.setHours(10, 0, 0, 0);

            break;

        // Viernes
        case 5:

            horaOficial.setHours(11, 0, 0, 0);

            break;

        // Sábado
        case 6:

            horaOficial.setHours(9, 0, 0, 0);

            break;

        // Domingo
        default:

            return {
                llego_tarde: false,
                minutos_retraso: 0
            };

    }

    // -----------------------------------------
    // Diferencia en minutos
    // -----------------------------------------

    const diferencia = Math.floor(
        (
            entrada.getTime() -
            horaOficial.getTime()
        ) / 60000
    );

    const minutosRetraso =
        Math.max(0, diferencia);

    // -----------------------------------------
    // LOG
    // -----------------------------------------

    console.log("================================");
    console.log("CÁLCULO DE RETRASO");
    console.log("Entrada:", entrada.toLocaleString("es-CO"));
    console.log(
        "Hora oficial:",
        horaOficial.toLocaleString("es-CO")
    );
    console.log("Día:", dia);
    console.log("Retraso:", minutosRetraso);
    console.log("================================");

    // -----------------------------------------
    // RESPUESTA
    // -----------------------------------------

    return {

        llego_tarde:
            minutosRetraso > 0,

        minutos_retraso:
            minutosRetraso

    };

}

// ======================================================
// DASHBOARD
// ======================================================

const obtenerDashboard = (req, res) => {

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

    db.query(sql, (err, rows) => {

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
            rows.map((asesor) => {

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
                // Calcular retraso
                // -----------------------------------------

                const retraso =
                    calcularRetraso(
                        asesor.inicio_jornada
                    );

                // -----------------------------------------
                // Retornar asesor
                // -----------------------------------------

                return {

                    ...asesor,

                    llego_tarde:
                        retraso.llego_tarde,

                    minutos_retraso:
                        retraso.minutos_retraso

                };

            });

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