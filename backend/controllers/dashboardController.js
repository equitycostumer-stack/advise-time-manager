// ======================================================
// EQUITY LINE PROFESSIONAL SERVICES
// DASHBOARD CONTROLLER
// PostgreSQL / Supabase
// ======================================================

const db = require("../config/db");

const ZONA_HORARIA = "America/Bogota";

function numeroSeguro(valor, predeterminado = 0) {
    const numero = Number(valor);

    return Number.isFinite(numero) ? numero : predeterminado;
}

function enteroNoNegativo(valor) {
    return Math.max(0, Math.round(numeroSeguro(valor)));
}

function porcentajeSeguro(parte, total) {
    const valorTotal = numeroSeguro(total);
    const valorParte = numeroSeguro(parte);

    if (valorTotal <= 0) {
        return 0;
    }

    return Math.min(
        100,
        Math.max(0, Math.round((valorParte / valorTotal) * 100))
    );
}

function fechaActualBogotaSQL() {
    return "(NOW() AT TIME ZONE 'America/Bogota')::date";
}

// ======================================================
// DASHBOARD OPERATIVO
// ======================================================

const obtenerDashboard = async (req, res) => {
    const esAdministrador = req.usuario?.rol === "ADMINISTRADOR";
    const asesorIdPropio = Number(req.usuario?.asesor_id);

    if (
        !esAdministrador &&
        (!Number.isInteger(asesorIdPropio) || asesorIdPropio <= 0)
    ) {
        return res.status(403).json({
            ok: false,
            mensaje: "Este usuario no tiene un asesor vinculado."
        });
    }

    const parametros = esAdministrador ? [] : [asesorIdPropio];
    const filtroAsesor = esAdministrador ? "" : "AND a.id = $1";
    const fechaActual = fechaActualBogotaSQL();

    const sql = `
        SELECT
            a.id,
            a.nombre,
            a.activo,

            COALESCE(e.estado, 'DISPONIBLE') AS estado,

            TO_CHAR(
                e.inicio_estado,
                'YYYY-MM-DD HH24:MI:SS'
            ) AS inicio_estado,

            TO_CHAR(
                COALESCE(
                    r.hora_entrada,
                    e.inicio_jornada,
                    j.inicio_jornada
                ),
                'YYYY-MM-DD HH24:MI:SS'
            ) AS inicio_jornada,

            COALESCE(r.llego_tarde, false) AS llego_tarde,

            COALESCE(r.minutos_retraso, 0) AS minutos_retraso,
            COALESCE(r.tiempo_trabajado, 0) AS tiempo_trabajado,
            COALESCE(r.tiempo_productivo, 0) AS tiempo_productivo,
            COALESCE(r.tiempo_break, 0) AS tiempo_break,
            COALESCE(r.tiempo_almuerzo, 0) AS tiempo_almuerzo,
            COALESCE(r.tiempo_bano, 0) AS tiempo_bano

        FROM asesores a

        LEFT JOIN estados_actuales e
            ON a.id = e.asesor_id
            AND e.inicio_jornada::date = ${fechaActual}

        LEFT JOIN resumen_jornada r
            ON a.id = r.asesor_id
            AND r.fecha = ${fechaActual}

        LEFT JOIN (
            SELECT
                asesor_id,
                MIN(fecha_hora) AS inicio_jornada
            FROM movimientos
            WHERE tipo = 'ENTRADA'
              AND fecha_hora::date = ${fechaActual}
            GROUP BY asesor_id
        ) j
            ON j.asesor_id = a.id

        WHERE a.activo = 1
          ${filtroAsesor}

        ORDER BY a.nombre ASC
    `;

    try {
        const resultado = await db.query(sql, parametros);
        const rows = Array.isArray(resultado.rows)
            ? resultado.rows
            : [];

        const asesores = rows.map((asesor) => ({
            ...asesor,

            id: numeroSeguro(asesor.id),
            activo: numeroSeguro(asesor.activo),

            llego_tarde:
                asesor.llego_tarde === true ||
                asesor.llego_tarde === 1 ||
                asesor.llego_tarde === "1",

            minutos_retraso: enteroNoNegativo(asesor.minutos_retraso),
            tiempo_trabajado: enteroNoNegativo(asesor.tiempo_trabajado),
            tiempo_productivo: enteroNoNegativo(asesor.tiempo_productivo),
            tiempo_break: enteroNoNegativo(asesor.tiempo_break),
            tiempo_almuerzo: enteroNoNegativo(asesor.tiempo_almuerzo),
            tiempo_bano: enteroNoNegativo(asesor.tiempo_bano)
        }));

        const productividad = asesores.reduce(
            (total, asesor) => ({
                tiempo_trabajado:
                    total.tiempo_trabajado + asesor.tiempo_trabajado,

                tiempo_productivo:
                    total.tiempo_productivo + asesor.tiempo_productivo,

                tiempo_break:
                    total.tiempo_break + asesor.tiempo_break,

                tiempo_almuerzo:
                    total.tiempo_almuerzo + asesor.tiempo_almuerzo,

                tiempo_bano:
                    total.tiempo_bano + asesor.tiempo_bano
            }),
            {
                tiempo_trabajado: 0,
                tiempo_productivo: 0,
                tiempo_break: 0,
                tiempo_almuerzo: 0,
                tiempo_bano: 0
            }
        );

        productividad.porcentaje = porcentajeSeguro(
            productividad.tiempo_productivo,
            productividad.tiempo_trabajado
        );

        return res.json({
            ok: true,
            total: asesores.length,
            asesores,
            productividad
        });
    } catch (error) {
        console.error("Error obteniendo dashboard operativo:", {
            mensaje: error.message,
            codigo: error.code,
            detalle: error.detail
        });

        return res.status(500).json({
            ok: false,
            mensaje: "No fue posible cargar el dashboard operativo."
        });
    }
};

// ======================================================
// CENTRO DE CONTROL EJECUTIVO
// ======================================================

const obtenerPanelEjecutivo = async (req, res) => {
    const fechaActual = fechaActualBogotaSQL();

    try {
        const [
            resultadoOperacion,
            resultadoVentas,
            resultadoIncidencias
        ] = await Promise.all([
            db.query(`
                SELECT
                    COUNT(*) FILTER (
                        WHERE a.activo = 1
                    ) AS total_asesores,

                    COUNT(*) FILTER (
                        WHERE a.activo = 1
                          AND COALESCE(
                              e.estado,
                              'DISPONIBLE'
                          ) = 'TRABAJANDO'
                    ) AS trabajando,

                    COUNT(*) FILTER (
                        WHERE a.activo = 1
                          AND COALESCE(
                              e.estado,
                              'DISPONIBLE'
                          ) IN (
                              'BREAK',
                              'ALMUERZO',
                              'BANO',
                              'CAPACITACION',
                              'REUNION'
                          )
                    ) AS en_pausa,

                    COUNT(*) FILTER (
                        WHERE a.activo = 1
                          AND r.llego_tarde IS TRUE
                    ) AS llegadas_tarde,

                    COALESCE(
                        SUM(r.tiempo_trabajado),
                        0
                    ) AS tiempo_trabajado,

                    COALESCE(
                        SUM(r.tiempo_productivo),
                        0
                    ) AS tiempo_productivo

                FROM asesores a

                LEFT JOIN estados_actuales e
                    ON e.asesor_id = a.id
                    AND e.inicio_jornada::date = ${fechaActual}

                LEFT JOIN resumen_jornada r
                    ON r.asesor_id = a.id
                    AND r.fecha = ${fechaActual}
            `),

            db.query(`
                SELECT
                    COUNT(*) AS cantidad_ventas,

                    COALESCE(
                        SUM(valor),
                        0
                    ) AS total_vendido,

                    COALESCE(
                        SUM(recaudo),
                        0
                    ) AS total_recaudo

                FROM ventas

                WHERE estado = 'ACTIVA'
                  AND fecha_hora >= ${fechaActual}
                  AND fecha_hora < (
                      ${fechaActual} + INTERVAL '1 day'
                  )
            `),

            db.query(`
                SELECT
                    COUNT(*) AS pendientes

                FROM incidencias

                WHERE revisada IS FALSE
            `)
        ]);

        const operacion = resultadoOperacion.rows?.[0] || {};
        const ventas = resultadoVentas.rows?.[0] || {};
        const incidencias = resultadoIncidencias.rows?.[0] || {};

        const tiempoTrabajado = enteroNoNegativo(
            operacion.tiempo_trabajado
        );

        const tiempoProductivo = enteroNoNegativo(
            operacion.tiempo_productivo
        );

        const datos = {
            fecha: new Date().toLocaleDateString("en-CA", {
                timeZone: ZONA_HORARIA
            }),

            asesores: {
                total: enteroNoNegativo(operacion.total_asesores),
                trabajando: enteroNoNegativo(operacion.trabajando),
                en_pausa: enteroNoNegativo(operacion.en_pausa),
                llegadas_tarde: enteroNoNegativo(
                    operacion.llegadas_tarde
                )
            },

            productividad: {
                tiempo_trabajado: tiempoTrabajado,
                tiempo_productivo: tiempoProductivo,
                porcentaje: porcentajeSeguro(
                    tiempoProductivo,
                    tiempoTrabajado
                )
            },

            ventas: {
                cantidad: enteroNoNegativo(ventas.cantidad_ventas),
                total_vendido: Math.max(
                    0,
                    numeroSeguro(ventas.total_vendido)
                ),
                total_recaudo: Math.max(
                    0,
                    numeroSeguro(ventas.total_recaudo)
                )
            },

            incidencias_pendientes: enteroNoNegativo(
                incidencias.pendientes
            )
        };

        return res.json({
            ok: true,
            data: datos
        });
    } catch (error) {
        console.error("Error obteniendo panel ejecutivo:", {
            mensaje: error.message,
            codigo: error.code,
            detalle: error.detail
        });

        return res.status(500).json({
            ok: false,
            mensaje: "No fue posible cargar el Centro de Control Ejecutivo."
        });
    }
};

module.exports = {
    obtenerDashboard,
    obtenerPanelEjecutivo
};
