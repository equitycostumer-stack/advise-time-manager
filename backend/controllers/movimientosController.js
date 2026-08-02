const db = require("../config/db");

/*
=========================================================
EQUITY LINE PROFESSIONAL SERVICES
TIME MANAGER

CONTROLADOR PRINCIPAL DE MOVIMIENTOS

Este controlador administra toda la lógica relacionada con
la jornada laboral de los asesores.

Movimientos soportados:

- ENTRADA
- BREAK_INICIO
- BREAK_FIN
- ALMUERZO_INICIO
- ALMUERZO_FIN
- BANO_INICIO
- BANO_FIN
- CAPACITACION_INICIO
- CAPACITACION_FIN
- REUNION_INICIO
- REUNION_FIN
- SALIDA

Autor:
Equity Line Professional Services

=========================================================
*/


// ======================================================
// CONSTANTES
// ======================================================

const ZONA_HORARIA = "America/Bogota";

const TIPOS_MOVIMIENTO = Object.freeze({

    ENTRADA: "ENTRADA",

    BREAK_INICIO: "BREAK_INICIO",
    BREAK_FIN: "BREAK_FIN",

    ALMUERZO_INICIO: "ALMUERZO_INICIO",
    ALMUERZO_FIN: "ALMUERZO_FIN",

    BANO_INICIO: "BANO_INICIO",
    BANO_FIN: "BANO_FIN",

    CAPACITACION_INICIO: "CAPACITACION_INICIO",
    CAPACITACION_FIN: "CAPACITACION_FIN",

    REUNION_INICIO: "REUNION_INICIO",
    REUNION_FIN: "REUNION_FIN",

    SALIDA: "SALIDA"

});

const ESTADOS = Object.freeze({

    TRABAJANDO: "TRABAJANDO",

    BREAK: "BREAK",

    ALMUERZO: "ALMUERZO",

    BANO: "BANO",

    CAPACITACION: "CAPACITACION",

    REUNION: "REUNION",

    SALIDA: "SALIDA"

});


// ======================================================
// FUNCIONES AUXILIARES
// ======================================================
// ======================================================
// OBTENER CONFIGURACIÓN DEL SISTEMA
// ======================================================

const obtenerConfiguracion = () => {

    return new Promise((resolve, reject) => {

        const sql = `
            SELECT
                break_max,
                almuerzo_max,
                bano_max,
                capacitacion_max,
                reunion_max
            FROM configuracion
            WHERE id = 1
            LIMIT 1
        `;

        db.query(sql, (error, rows) => {

            if (error) {
                return reject(error);
            }

            if (!rows || rows.length === 0) {
                return reject(
                    new Error(
                        "No existe configuración en la tabla configuracion."
                    )
                );
            }

            resolve(rows[0]);

        });

    });

};
// ======================================================
// NORMALIZAR TIPO DE MOVIMIENTO
// ======================================================

const normalizarTipo = (tipo) => {

    if (!tipo) {
        return "";
    }

    return String(tipo)
        .trim()
        .toUpperCase();

};
// ======================================================
// OBTENER ESTADO FINAL DEL ASESOR
// ======================================================

const obtenerEstadoFinal = (tipoMovimiento) => {

    const tipo = normalizarTipo(tipoMovimiento);

    const estados = {

        ENTRADA: ESTADOS.TRABAJANDO,

        BREAK_INICIO: ESTADOS.BREAK,
        BREAK_FIN: ESTADOS.TRABAJANDO,

        ALMUERZO_INICIO: ESTADOS.ALMUERZO,
        ALMUERZO_FIN: ESTADOS.TRABAJANDO,

        BANO_INICIO: ESTADOS.BANO,
        BANO_FIN: ESTADOS.TRABAJANDO,

        CAPACITACION_INICIO: ESTADOS.CAPACITACION,
        CAPACITACION_FIN: ESTADOS.TRABAJANDO,

        REUNION_INICIO: ESTADOS.REUNION,
        REUNION_FIN: ESTADOS.TRABAJANDO,

        SALIDA: ESTADOS.SALIDA

    };

    return estados[tipo] || null;

};
// ======================================================
// OBTENER HORARIO OFICIAL
// ======================================================

const obtenerHorarioOficial = (fecha = new Date()) => {

    const dia = fecha.getDay();

    switch (dia) {

        // Domingo
        case 0:

            return null;

        // Lunes a Jueves
        case 1:
        case 2:
        case 3:
        case 4:

            return {

                nombre: "Lunes a Jueves",

                inicio: "10:00",

                fin: "19:00",

                jornadaMinutos: 540

            };
// ======================================================
// CALCULAR DURACIÓN ENTRE DOS FECHAS
// ======================================================

const calcularDuracion = (inicio, fin) => {

    if (!inicio || !fin) {

        return {

            milisegundos: 0,
            segundos: 0,
            minutos: 0,
            horas: 0,
            texto: "00:00:00"

        };

    }

    const fechaInicio = new Date(inicio);
    const fechaFin = new Date(fin);

    if (

        Number.isNaN(fechaInicio.getTime()) ||

        Number.isNaN(fechaFin.getTime())

    ) {

        return {

            milisegundos: 0,
            segundos: 0,
            minutos: 0,
            horas: 0,
            texto: "00:00:00"

        };

    }

    const diferencia = fechaFin.getTime() - fechaInicio.getTime();

    if (diferencia <= 0) {

        return {

            milisegundos: 0,
            segundos: 0,
            minutos: 0,
            horas: 0,
            texto: "00:00:00"

        };

    }

    const segundosTotales = Math.floor(diferencia / 1000);

    const horas = Math.floor(segundosTotales / 3600);

    const minutos = Math.floor(segundosTotales / 60);

    const segundos = segundosTotales % 60;

    const minutosReloj = Math.floor((segundosTotales % 3600) / 60);

    const texto =

        String(horas).padStart(2, "0") +

        ":" +

        String(minutosReloj).padStart(2, "0") +

        ":" +

        String(segundos).padStart(2, "0");

    return {

        milisegundos: diferencia,

        segundos: segundosTotales,

        minutos,

        horas,

        texto

    };

};
        // Viernes
        case 5:

            return {

                nombre: "Viernes",

                inicio: "11:00",

                fin: "19:00",

                jornadaMinutos: 480

            };

        // Sábado
        case 6:

            return {

                nombre: "Sábado",

                inicio: "09:00",

                fin: "16:00",

                jornadaMinutos: 420

            };

        default:

            return null;

    }

};
// ======================================================
// OBTENER MOVIMIENTO DE INICIO
// ======================================================

const obtenerInicioMovimiento = async (asesorId, tipoInicio) => {

    const tipo = normalizarTipo(tipoInicio);

    const tiposPermitidos = [

        TIPOS_MOVIMIENTO.BREAK_INICIO,

        TIPOS_MOVIMIENTO.ALMUERZO_INICIO,

        TIPOS_MOVIMIENTO.BANO_INICIO,

        TIPOS_MOVIMIENTO.CAPACITACION_INICIO,

        TIPOS_MOVIMIENTO.REUNION_INICIO

    ];

    if (!tiposPermitidos.includes(tipo)) {

        throw new Error(`Tipo de inicio inválido: ${tipo}`);

    }

    const sql = `

        SELECT

            id,

            asesor_id,

            tipo,

            fecha_hora,

            observacion

        FROM movimientos

        WHERE asesor_id = ?

        AND tipo = ?

        AND DATE(fecha_hora) = CURDATE()

        ORDER BY

            fecha_hora DESC,

            id DESC

        LIMIT 1

    `;

    return new Promise((resolve, reject) => {

        db.query(

            sql,

            [

                asesorId,

                tipo

            ],

            (error, rows) => {

                if (error) {

                    return reject(error);

                }

                if (!rows || rows.length === 0) {

                    return resolve(null);

                }

                resolve(rows[0]);

            }

        );

    });

};
// ======================================================
// OBTENER ASESOR
// ======================================================

const obtenerAsesor = async (asesorId) => {

    return new Promise((resolve, reject) => {

        const sql = `

            SELECT

                id,

                nombre,

                activo

            FROM asesores

            WHERE id = ?

            LIMIT 1

        `;

        db.query(

            sql,

            [asesorId],

            (error, rows) => {

                if (error) {

                    return reject(error);

                }

                if (!rows || rows.length === 0) {

                    return resolve(null);

                }

                resolve(rows[0]);

            }

        );

    });

};
// ======================================================
// OBTENER ESTADO ACTUAL DEL ASESOR
// ======================================================

const obtenerEstadoActualDB = async (asesorId) => {

    return new Promise((resolve, reject) => {

        const sql = `

            SELECT

                asesor_id,

                estado,

                inicio_estado,

                inicio_jornada,

                ultima_actualizacion

            FROM estados_actuales

            WHERE asesor_id = ?

            LIMIT 1

        `;

        db.query(

            sql,

            [asesorId],

            (error, rows) => {

                if (error) {

                    return reject(error);

                }

                if (!rows || rows.length === 0) {

                    return resolve(null);

                }

                resolve(rows[0]);

            }

        );

    });

};
// ======================================================
// INSERTAR MOVIMIENTO
// ======================================================

const insertarMovimiento = async ({
    asesor_id,
    tipo,
    observacion = ""
}) => {

    const sql = `
        INSERT INTO movimientos
        (
            asesor_id,
            tipo,
            observacion
        )
        VALUES
        (
            ?,
            ?,
            ?
        )
    `;

    return new Promise((resolve, reject) => {

        db.query(

            sql,

            [
                asesor_id,
                tipo,
                observacion
            ],

            (error, resultado) => {

                if (error) {
                    return reject(error);
                }

                resolve({
                    id: resultado.insertId
                });

            }

        );

    });

};
// ======================================================
// ACTUALIZAR ESTADO ACTUAL
// ======================================================

const actualizarEstadoActual = async ({
    asesor_id,
    estado,
    inicio_estado,
    inicio_jornada = null
}) => {

    const sql = `
        INSERT INTO estados_actuales
        (
            asesor_id,
            estado,
            inicio_estado,
            inicio_jornada,
            ultima_actualizacion
        )
        VALUES
        (
            ?,
            ?,
            ?,
            ?,
            NOW()
        )
        ON DUPLICATE KEY UPDATE

            estado = VALUES(estado),

            inicio_estado = VALUES(inicio_estado),

            inicio_jornada = COALESCE(
                VALUES(inicio_jornada),
                inicio_jornada
            ),

            ultima_actualizacion = NOW()
    `;

    return new Promise((resolve, reject) => {

        db.query(

            sql,

            [

                asesor_id,

                estado,

                inicio_estado,

                inicio_jornada

            ],

            (error) => {

                if (error) {

                    return reject(error);

                }

                resolve();

            }

        );

    });

};
// ======================================================
// VALIDAR MOVIMIENTO
// ======================================================

const validarMovimiento = ({
    tipoMovimiento,
    estadoActual
}) => {

    // ==========================================
    // ENTRADA
    // ==========================================

    if (tipoMovimiento === TIPOS_MOVIMIENTO.ENTRADA) {

        if (
            estadoActual &&
            estadoActual.estado !== "SALIDA"
        ) {

            return {

                ok: false,

                mensaje:
                    `El asesor ya se encuentra en estado ${estadoActual.estado}.`

            };

        }

    }

    // ==========================================
    // BREAK INICIO
    // ==========================================

    if (tipoMovimiento === TIPOS_MOVIMIENTO.BREAK_INICIO) {

        if (!estadoActual) {

            return {

                ok: false,

                mensaje: "Debe registrar primero la entrada."

            };

        }

        if (estadoActual.estado !== "TRABAJANDO") {

            return {

                ok: false,

                mensaje:
                    "Solo puede iniciar Break mientras está trabajando."

            };

        }

    }

    // ==========================================
    // TODO CORRECTO
    // ==========================================

    return {

        ok: true

    };

};
// ======================================================
// REGISTRAR MOVIMIENTO
// ======================================================

// ======================================================
// REGISTRAR MOVIMIENTO
// ======================================================

const registrarMovimiento = async (req, res) => {

    try {

        // ==================================================
        // 1. OBTENER DATOS DEL REQUEST
        // ==================================================

        const {

            asesor_id,

            tipo,

            observacion = ""

        } = req.body;

        // ==================================================
        // 2. NORMALIZAR TIPO
        // ==================================================

        const tipoMovimiento = normalizarTipo(tipo);

        // ==================================================
// 3. VALIDACIONES
// ==================================================

// Validar asesor_id
if (!asesor_id) {

    return res.status(400).json({

        ok: false,

        mensaje: "Debe enviar el asesor_id."

    });

}

if (!Number.isInteger(Number(asesor_id))) {

    return res.status(400).json({

        ok: false,

        mensaje: "El asesor_id debe ser un número válido."

    });

}

// Validar tipo
if (!tipoMovimiento) {

    return res.status(400).json({

        ok: false,

        mensaje: "Debe enviar el tipo de movimiento."

    });

}

// Verificar que el tipo exista
if (!Object.values(TIPOS_MOVIMIENTO).includes(tipoMovimiento)) {

    return res.status(400).json({

        ok: false,

        mensaje: `Movimiento no permitido: ${tipoMovimiento}`

    });

}

// Validar observación
if (typeof observacion !== "string") {

    return res.status(400).json({

        ok: false,

        mensaje: "La observación debe ser un texto."

    });

}

if (observacion.length > 255) {

    return res.status(400).json({

        ok: false,

        mensaje: "La observación no puede superar los 255 caracteres."

    });

}

        // (Aquí irán todas las validaciones)

        // ==================================================
        // 4. OBTENER CONFIGURACIÓN
        // ==================================================

        // (Aquí consultaremos la tabla configuracion)

        // ==================================================
// 5. BUSCAR ASESOR
// ==================================================

const asesor = await obtenerAsesor(asesor_id);

if (!asesor) {

    return res.status(404).json({

        ok: false,

        mensaje: "El asesor no existe."

    });

}

if (!asesor.activo) {

    return res.status(400).json({

        ok: false,

        mensaje: "El asesor está inactivo."

    });

}

// ==================================================
// 6. OBTENER ESTADO ACTUAL
// ==================================================

const estadoActual = await obtenerEstadoActualDB(asesor_id);

        // ==================================================
// 7. VALIDAR MOVIMIENTO
// ==================================================

const validacion = validarMovimiento({

    tipoMovimiento,

    estadoActual

});

if (!validacion.ok) {

    return res.status(400).json(validacion);

}
// ======================================================
// PROCESAR MOVIMIENTO
// ======================================================

const procesarMovimiento = async ({
    asesor,
    estadoActual,
    configuracion,
    tipoMovimiento,
    observacion
}) => {

    switch (tipoMovimiento) {

        case TIPOS_MOVIMIENTO.ENTRADA:

            return await procesarEntrada({

                asesor,
                configuracion,
                observacion

            });

        case TIPOS_MOVIMIENTO.BREAK_INICIO:

            return await procesarBreakInicio({

                asesor,
                estadoActual,
                configuracion,
                observacion

            });

        case TIPOS_MOVIMIENTO.BREAK_FIN:

            return await procesarBreakFin({

                asesor,
                estadoActual,
                configuracion,
                observacion

            });

        default:

            throw new Error(

                `Movimiento no implementado: ${tipoMovimiento}`

            );

    }

};
// ======================================================
// PROCESAR ENTRADA
// ======================================================

const procesarEntrada = async () => {

    return {

        estado: "TRABAJANDO"

    };

};

// ======================================================
// PROCESAR BREAK INICIO
// ======================================================

const procesarBreakInicio = async () => {

    return {

        estado: "BREAK"

    };

};

// ======================================================
// PROCESAR BREAK FIN
// ======================================================

const procesarBreakFin = async () => {

    return {

        estado: "TRABAJANDO"

    };

};
        // ==================================================
        // 8. REGISTRAR MOVIMIENTO
       // ==================================================
// ==================================================
// 8. PROCESAR MOVIMIENTO
// ==================================================

const resultado = await procesarMovimiento({

    asesor,

    estadoActual,

    configuracion,

    tipoMovimiento,

    observacion

});
const movimiento = await insertarMovimiento({

    asesor_id,

    tipo: tipoMovimiento,

    observacion

});

        // ==================================================
// 9. ACTUALIZAR ESTADO
// ==================================================

await actualizarEstadoActual({

    asesor_id,

    estado: resultado.estado,

    inicio_estado: new Date(),

    inicio_jornada:

        tipoMovimiento === TIPOS_MOVIMIENTO.ENTRADA

            ? new Date()

            : null

});

        // ==================================================
        // 10. RESPUESTA
        // ==================================================

        return res.status(200).json({

            ok: true,

            mensaje: "Estructura creada correctamente."

        });

    } catch (error) {

        console.error(error);

        return res.status(500).json({

            ok: false,

            mensaje: "Error interno del servidor.",

            error: error.message

        });

    }

};

// ======================================================
// OBTENER ESTADO ACTUAL
// ======================================================

const obtenerEstadoActual = (req, res) => {

    return res.status(501).json({

        ok: false,

        mensaje: "Función en construcción."

    });

};


// ======================================================
// OBTENER HISTORIAL
// ======================================================

const obtenerHistorial = (req, res) => {

    return res.status(501).json({

        ok: false,

        mensaje: "Función en construcción."

    });

};


// ======================================================
// OBTENER RESUMEN
// ======================================================

const obtenerResumen = (req, res) => {

    return res.status(501).json({

        ok: false,

        mensaje: "Función en construcción."

    });

};


// ======================================================
// EXPORTACIONES
// ======================================================

module.exports = {

    registrarMovimiento,

    obtenerEstadoActual,

    obtenerHistorial,

    obtenerResumen

};