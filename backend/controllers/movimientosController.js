const db = require("../config/db");

/*
=========================================================
EQUITY LINE PROFESSIONAL SERVICES
CONTROL DE TIEMPO Y ASISTENCIA

Controlador principal de movimientos.

Estados:
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
=========================================================
*/


// =======================================================
// CONFIGURACIÓN
// =======================================================

const obtenerConfiguracion = (callback) => {

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

    db.query(sql, (err, rows) => {

        if (err) {
            console.error("Error obteniendo configuración:", err);
            return callback(err, null);
        }

        if (!rows || rows.length === 0) {
            return callback(
                new Error("No existe configuración en la tabla configuracion."),
                null
            );
        }

        callback(null, rows[0]);

    });

};


// =======================================================
// NORMALIZAR TIPO DE MOVIMIENTO
// =======================================================

const normalizarTipo = (tipo) => {

    if (!tipo) {
        return null;
    }

    return String(tipo)
        .trim()
        .toUpperCase();

};


// =======================================================
// DETERMINAR ESTADO VISUAL
// =======================================================

const obtenerEstadoFinal = (tipo) => {

    switch (tipo) {

        case "ENTRADA":
            return "TRABAJANDO";

        case "BREAK_INICIO":
            return "BREAK";

        case "BREAK_FIN":
            return "TRABAJANDO";

        case "ALMUERZO_INICIO":
            return "ALMUERZO";

        case "ALMUERZO_FIN":
            return "TRABAJANDO";

        case "BANO_INICIO":
            return "BANO";

        case "BANO_FIN":
            return "TRABAJANDO";

        case "CAPACITACION_INICIO":
            return "CAPACITACION";

        case "CAPACITACION_FIN":
            return "TRABAJANDO";

        case "REUNION_INICIO":
            return "REUNION";

        case "REUNION_FIN":
            return "TRABAJANDO";

        case "SALIDA":
            return "SALIDA";

        default:
            return tipo;

    }

};


// =======================================================
// HORARIO OFICIAL
// =======================================================

const obtenerHorarioOficial = (fecha = new Date()) => {

    const dia = fecha.getDay();

    switch (dia) {

        case 0:
            return null;

        case 1:
        case 2:
        case 3:
        case 4:
            return {
                nombre: "Lunes a Jueves",
                inicio: "10:00",
                fin: "19:00",
                segundos: 9 * 60 * 60
            };

        case 5:
            return {
                nombre: "Viernes",
                inicio: "11:00",
                fin: "19:00",
                segundos: 8 * 60 * 60
            };

        case 6:
            return {
                nombre: "Sábado",
                inicio: "09:00",
                fin: "16:00",
                segundos: 7 * 60 * 60
            };

        default:
            return null;

    }

};


// =======================================================
// OBTENER MOVIMIENTO DE INICIO MÁS RECIENTE
// =======================================================

const obtenerInicioMovimiento = (
    asesorId,
    tipoInicio,
    callback
) => {

    const sql = `
        SELECT
            id,
            fecha_hora,
            tipo
        FROM movimientos
        WHERE asesor_id = ?
        AND DATE(fecha_hora) = CURDATE()
        ORDER BY fecha_hora DESC
        LIMIT 1
    `;

    db.query(
        sql,
        [asesorId, tipoInicio],
        (err, rows) => {

            if (err) {
                return callback(err, null);
            }

            if (!rows || rows.length === 0) {
                return callback(null, null);
            }

            callback(null, rows[0]);

        }
    );

};


// =======================================================
// CALCULAR DURACIÓN ENTRE DOS FECHAS
// =======================================================

const calcularDuracion = (inicio, fin) => {

    const fechaInicio = new Date(inicio);
    const fechaFin = new Date(fin);

    const diferenciaMs =
        fechaFin.getTime() - fechaInicio.getTime();

    if (diferenciaMs < 0) {

        return {
            milisegundos: 0,
            segundos: 0,
            minutos: 0,
            horas: 0,
            texto: "00:00:00"
        };

    }

    const segundosTotales =
        Math.floor(diferenciaMs / 1000);

    const horas =
        Math.floor(segundosTotales / 3600);

    const minutos =
        Math.floor((segundosTotales % 3600) / 60);

    const segundos =
        segundosTotales % 60;

    const texto =
        String(horas).padStart(2, "0") +
        ":" +
        String(minutos).padStart(2, "0") +
        ":" +
        String(segundos).padStart(2, "0");

    return {

        milisegundos: diferenciaMs,
        segundos: segundosTotales,
        minutos: Math.floor(segundosTotales / 60),
        horas,
        texto

    };

};


// =======================================================
// REGISTRAR MOVIMIENTO
// =======================================================

const registrarMovimiento = (req, res) => {

    const {
        asesor_id,
        tipo,
        observacion
    } = req.body;

    // ---------------------------------------------------
    // VALIDACIÓN
    // ---------------------------------------------------

    if (!asesor_id || !tipo) {

        return res.status(400).json({

            ok: false,

            error:
                "Faltan datos. Se necesita asesor_id y tipo."

        });

    }

    const tipoNormalizado =
        normalizarTipo(tipo);

    const tiposPermitidos = [

        "ENTRADA",

        "BREAK_INICIO",
        "BREAK_FIN",

        "ALMUERZO_INICIO",
        "ALMUERZO_FIN",

        "BANO_INICIO",
        "BANO_FIN",

        "CAPACITACION_INICIO",
        "CAPACITACION_FIN",

        "REUNION_INICIO",
        "REUNION_FIN",

        "SALIDA"

    ];

    if (!tiposPermitidos.includes(tipoNormalizado)) {

        return res.status(400).json({

            ok: false,

            error:
                "Tipo de movimiento no válido: " +
                tipoNormalizado

        });

    }

    // ---------------------------------------------------
    // COMPROBAR QUE EL ASESOR EXISTE
    // ---------------------------------------------------

    const asesorSql = `
        SELECT
            id,
            nombre,
            activo
        FROM asesores
        WHERE id = ?
        LIMIT 1
    `;

    db.query(
        asesorSql,
        [asesor_id],
        (asesorError, asesores) => {

            if (asesorError) {

                console.error(
                    "Error buscando asesor:",
                    asesorError
                );

                return res.status(500).json({

                    ok: false,

                    error:
                        "Error consultando el asesor."

                });

            }

            if (!asesores || asesores.length === 0) {

                return res.status(404).json({

                    ok: false,

                    error:
                        "El asesor no existe."

                });

            }

            const asesor = asesores[0];

            // ---------------------------------------------------
            // OBTENER ESTADO ACTUAL
            // ---------------------------------------------------

            const estadoSql = `
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
                estadoSql,
                [asesor_id],
                (estadoError, estados) => {

                    if (estadoError) {

                        console.error(
                            "Error consultando estado:",
                            estadoError
                        );

                        return res.status(500).json({

                            ok: false,

                            error:
                                "Error consultando estado actual."

                        });

                    }

                    const estadoActual =
                        estados && estados.length > 0
                            ? String(estados[0].estado).toUpperCase()
                            : null;

                    const estadosDePausa = [

                        "BREAK",
                        "BREAK_INICIO",

                        "ALMUERZO",
                        "ALMUERZO_INICIO",

                        "BANO",
                        "BANO_INICIO",

                        "CAPACITACION",
                        "CAPACITACION_INICIO",

                        "REUNION",
                        "REUNION_INICIO"

                    ];

                    // ---------------------------------------------------
                    // VALIDAR ENTRADA
                    // ---------------------------------------------------

                    if (tipoNormalizado === "ENTRADA") {

                        if (
                            estadoActual &&
                            estadoActual !== "SALIDA" &&
                            estadoActual !== "DISPONIBLE"
                        ) {

                            return res.status(400).json({

                                ok: false,

                                error:
                                    "El asesor ya tiene una jornada activa."

                            });

                        }

                    }

                    // ---------------------------------------------------
                    // VALIDAR SALIDA
                    // ---------------------------------------------------

                    if (tipoNormalizado === "SALIDA") {

                        if (
                            !estadoActual ||
                            estadoActual === "SALIDA" ||
                            estadoActual === "DISPONIBLE"
                        ) {

                            return res.status(400).json({

                                ok: false,

                                error:
                                    "El asesor no tiene una jornada activa."

                            });

                        }

                        if (
                            estadosDePausa.includes(estadoActual)
                        ) {

                            return res.status(400).json({

                                ok: false,

                                error:
                                    "Debe finalizar la pausa actual antes de marcar la salida."

                            });

                        }

                    }

                    // ---------------------------------------------------
                    // INICIO DE PAUSAS
                    // ---------------------------------------------------

                    const esInicioPausa = [

                        "BREAK_INICIO",
                        "ALMUERZO_INICIO",
                        "BANO_INICIO",
                        "CAPACITACION_INICIO",
                        "REUNION_INICIO"

                    ].includes(tipoNormalizado);

                    if (esInicioPausa) {

                        if (
                            !estadoActual ||
                            estadoActual === "SALIDA" ||
                            estadoActual === "DISPONIBLE"
                        ) {

                            return res.status(400).json({

                                ok: false,

                                error:
                                    "El asesor no tiene una jornada activa."

                            });

                        }

                        if (estadosDePausa.includes(estadoActual)) {

                            return res.status(400).json({

                                ok: false,

                                error:
                                    "El asesor ya tiene una pausa activa."

                            });

                        }

                    }

                    // ---------------------------------------------------
                    // FIN DE PAUSAS
                    // ---------------------------------------------------

                    const mapaFinales = {

                        BREAK_FIN: {
                            inicio: "BREAK_INICIO",
                            estado: "BREAK"
                        },

                        ALMUERZO_FIN: {
                            inicio: "ALMUERZO_INICIO",
                            estado: "ALMUERZO"
                        },

                        BANO_FIN: {
                            inicio: "BANO_INICIO",
                            estado: "BANO"
                        },

                        CAPACITACION_FIN: {
                            inicio: "CAPACITACION_INICIO",
                            estado: "CAPACITACION"
                        },

                        REUNION_FIN: {
                            inicio: "REUNION_INICIO",
                            estado: "REUNION"
                        }

                    };

                    const configuracionFinal =
                        mapaFinales[tipoNormalizado];

                    if (configuracionFinal) {

                        if (
                            !estadoActual ||
                            estadoActual !== configuracionFinal.estado
                        ) {

                            return res.status(400).json({

                                ok: false,

                                error:
                                    "No existe una pausa activa de este tipo."

                            });

                        }

                    }

                    // ---------------------------------------------------
                    // OBTENER CONFIGURACIÓN
                    // ---------------------------------------------------

                    obtenerConfiguracion((configError, config) => {

                        if (configError) {

                            console.error(
                                "Error configuración:",
                                configError
                            );

                            return res.status(500).json({

                                ok: false,

                                error:
                                    "No se pudo obtener la configuración."

                            });

                        }

                        // ---------------------------------------------------
                        // INSERTAR MOVIMIENTO
                        // ---------------------------------------------------

                        const insertSql = `
                            INSERT INTO movimientos
                            (
                                asesor_id,
                                tipo,
                                fecha_hora,
                                observacion
                            )
                            VALUES
                            (?, ?, NOW(), ?)
                        `;

                        db.query(

                            insertSql,

                            [
                                asesor_id,
                                tipoNormalizado,
                                observacion || null
                            ],

                            (insertError, insertResult) => {

                                if (insertError) {

                                    console.error(
                                        "Error insertando movimiento:",
                                        insertError
                                    );

                                    return res.status(500).json({

                                        ok: false,

                                        error:
                                            "No fue posible registrar el movimiento."

                                    });

                                }

                                // ---------------------------------------------------
                                // ACTUALIZAR ESTADO
                                // ---------------------------------------------------

                                const nuevoEstado =
                                    obtenerEstadoFinal(tipoNormalizado);

                                let updateEstadoSql;
                                let updateParams;

                                if (tipoNormalizado === "ENTRADA") {

                                    updateEstadoSql = `
                                        INSERT INTO estados_actuales
                                        (
                                            asesor_id,
                                            estado,
                                            inicio_estado,
                                            inicio_jornada
                                        )
                                        VALUES
                                        (?, ?, NOW(), NOW())
                                        ON DUPLICATE KEY UPDATE
                                            estado = VALUES(estado),
                                            inicio_estado = NOW(),
                                            inicio_jornada = NOW(),
                                            ultima_actualizacion = CURRENT_TIMESTAMP
                                    `;

                                    updateParams = [
                                        asesor_id,
                                        nuevoEstado
                                    ];

                                } else {

                                    updateEstadoSql = `
                                        UPDATE estados_actuales
                                        SET
                                            estado = ?,
                                            inicio_estado = NOW(),
                                            ultima_actualizacion = CURRENT_TIMESTAMP
                                        WHERE asesor_id = ?
                                    `;

                                    updateParams = [
                                        nuevoEstado,
                                        asesor_id
                                    ];

                                }

                                db.query(

                                    updateEstadoSql,
                                    updateParams,

                                    (estadoUpdateError) => {

                                        if (estadoUpdateError) {

                                            console.error(
                                                "Error actualizando estado:",
                                                estadoUpdateError
                                            );

                                            return res.status(500).json({

                                                ok: false,

                                                error:
                                                    "Movimiento guardado, pero no fue posible actualizar el estado."

                                            });

                                        }

// ---------------------------------------------------
// RESPUESTA ENTRADA
// ---------------------------------------------------

if (tipoNormalizado === "ENTRADA") {

    return res.json({

        ok: true,

        mensaje: "Entrada registrada correctamente.",

        asesor: {
            id: asesor.id,
            nombre: asesor.nombre
        },

        movimiento: {
            id: insertResult.insertId,
            tipo: tipoNormalizado
        },

        estado: nuevoEstado

    });

}

// ---------------------------------------------------
// SI ES SALIDA
// ---------------------------------------------------

if (tipoNormalizado === "SALIDA") {

    return obtenerResumenJornada(

        asesor_id,

        (resumenError, resumen) => {

            if (resumenError) {

                console.error(
                    "Error calculando resumen:",
                    resumenError
                );

                return res.json({

                    ok: true,

                    mensaje:
                        "Salida registrada, pero no fue posible calcular el resumen.",

                    estado: nuevoEstado

                });

            }

            return res.json({

                ok: true,

                mensaje:
                    "Salida registrada correctamente.",

                asesor: {

                    id: asesor.id,

                    nombre: asesor.nombre

                },

                estado: nuevoEstado,

                resumen

            });

        }

    );

}


// ---------------------------------------------------
// SI ES FIN DE PAUSA
// ---------------------------------------------------

if (configuracionFinal) {

    return obtenerInicioMovimiento(

        asesor_id,

        configuracionFinal.inicio,

        (inicioError, movimientoInicio) => {

            if (inicioError) {

                console.error(
                    "Error buscando inicio:",
                    inicioError
                );

                return res.json({

                    ok: true,

                    mensaje: "Movimiento registrado.",

                    estado: nuevoEstado

                });

            }

            if (!movimientoInicio) {

                return res.json({

                    ok: true,

                    mensaje:
                        "Movimiento registrado, pero no se encontró el inicio correspondiente.",

                    estado: nuevoEstado

                });

            }

            const ahora = new Date();

            const duracion = calcularDuracion(

                movimientoInicio.fecha_hora,

                ahora

            );

            let limite = 0;

            switch (tipoNormalizado) {

                case "BREAK_FIN":
                    limite = Number(config.break_max);
                    break;

                case "ALMUERZO_FIN":
                    limite = Number(config.almuerzo_max);
                    break;

                case "BANO_FIN":
                    limite = Number(config.bano_max);
                    break;

                case "CAPACITACION_FIN":
                    limite = Number(config.capacitacion_max);
                    break;

                case "REUNION_FIN":
                    limite = Number(config.reunion_max);
                    break;

            }

            const excedido = duracion.minutos > limite;

            return res.json({

                ok: true,

                mensaje:
                    "Movimiento registrado correctamente.",

                asesor: {

                    id: asesor.id,

                    nombre: asesor.nombre

                },

                movimiento: {

                    id: insertResult.insertId,

                    tipo: tipoNormalizado

                },

                estado: nuevoEstado,

                duracion: {

                    segundos: duracion.segundos,

                    minutos: duracion.minutos,

                    texto: duracion.texto

                },

                limite_minutos: limite,

                excedido

            });

        }

    );

}


// ---------------------------------------------------
// OTROS MOVIMIENTOS
// ---------------------------------------------------

return res.json({

    ok: true,

    mensaje: "Movimiento registrado correctamente.",

    asesor: {

        id: asesor.id,

        nombre: asesor.nombre

    },

    movimiento: {

        id: insertResult.insertId,

        tipo: tipoNormalizado

    },

    estado: nuevoEstado

});

                                    }

                                );

                            }

                        );

                    });

                }

            );

        }

    );

};
    // =======================================================
    // OBTENER HISTORIAL
    // =======================================================

    const obtenerHistorial = (req, res) => {

        const { asesorId } = req.params;

        const sql = `
        SELECT
            id,
            asesor_id,
            tipo,
            fecha_hora,
            observacion
        FROM movimientos
        WHERE asesor_id = ?
AND DATE(fecha_hora) = CURDATE()
ORDER BY fecha_hora DESC
    `;

        db.query(
            sql,
            [asesorId],
            (err, rows) => {

                if (err) {

                    console.error(
                        "Error obteniendo historial:",
                        err
                    );

                    return res.status(500).json({

                        ok: false,

                        error:
                            "No fue posible obtener el historial."

                    });

                }

                return res.json(rows);

            }
        );

    };


    // =======================================================
    // OBTENER ESTADO ACTUAL
    // =======================================================

    const obtenerEstadoActual = (req, res) => {

        const { asesorId } = req.params;

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

        db.query(sql, [asesorId], (err, rows) => {

            if (err) {

                console.error(
                    "Error obteniendo estado actual:",
                    err
                );

                return res.status(500).json({

                    ok: false,

                    error:
                        "No fue posible obtener el estado actual."

                });

            }

            if (!rows || rows.length === 0) {
                return res.json(null);
            }

            const estado = rows[0];

            return res.json({

                asesor_id: estado.asesor_id,

                estado: estado.estado,

                inicio_estado: estado.inicio_estado,

                inicio_jornada: estado.inicio_jornada,

                ultima_actualizacion: estado.ultima_actualizacion

            });

        });

    };
    // =======================================================
    // RESUMEN DE JORNADA
    // =======================================================

    const obtenerResumenJornada = (
        asesorId,
        callback
    ) => {

        const sql = `
        SELECT
            tipo,
            fecha_hora
        FROM movimientos
        WHERE asesor_id = ?
          AND DATE(fecha_hora) = CURDATE()
        ORDER BY fecha_hora ASC
    `;

        db.query(
            sql,
            [asesorId],
            (err, movimientos) => {

                if (err) {
                    return callback(err, null);
                }

                if (!movimientos || movimientos.length === 0) {

                    return callback(null, {

                        jornada_total: "00:00:00",
                        break_total: "00:00:00",
                        almuerzo_total: "00:00:00",
                        bano_total: "00:00:00",
                        capacitacion_total: "00:00:00",
                        reunion_total: "00:00:00",
                        tiempo_productivo: "00:00:00",

                        horario_oficial: null,
                        tiempo_esperado: "00:00:00",
                        diferencia: "00:00:00",
                        cumplio_jornada: false

                    });

                }

                let entrada = null;
                let salida = null;

                let breakSegundos = 0;
                let almuerzoSegundos = 0;
                let banoSegundos = 0;
                let capacitacionSegundos = 0;
                let reunionSegundos = 0;

                let breakInicio = null;
                let almuerzoInicio = null;
                let banoInicio = null;
                let capacitacionInicio = null;
                let reunionInicio = null;

                const horarioOficial =
                    obtenerHorarioOficial(new Date());
                movimientos.forEach((movimiento) => {

                    const tipo = String(movimiento.tipo).toUpperCase();
                    const fecha = new Date(movimiento.fecha_hora);

                    switch (tipo) {

                        case "ENTRADA":
                            if (!entrada) entrada = fecha;
                            break;

                        case "SALIDA":
                            salida = fecha;
                            break;

                        case "BREAK_INICIO":
                            breakInicio = fecha;
                            break;

                        case "BREAK_FIN":
                            if (breakInicio) {
                                breakSegundos += Math.max(
                                    0,
                                    (fecha - breakInicio) / 1000
                                );
                                breakInicio = null;
                            }
                            break;

                        case "ALMUERZO_INICIO":
                            almuerzoInicio = fecha;
                            break;

                        case "ALMUERZO_FIN":
                            if (almuerzoInicio) {
                                almuerzoSegundos += Math.max(
                                    0,
                                    (fecha - almuerzoInicio) / 1000
                                );
                                almuerzoInicio = null;
                            }
                            break;

                        case "BANO_INICIO":
                            banoInicio = fecha;
                            break;

                        case "BANO_FIN":
                            if (banoInicio) {
                                banoSegundos += Math.max(
                                    0,
                                    (fecha - banoInicio) / 1000
                                );
                                banoInicio = null;
                            }
                            break;

                        case "CAPACITACION_INICIO":
                            capacitacionInicio = fecha;
                            break;

                        case "CAPACITACION_FIN":
                            if (capacitacionInicio) {
                                capacitacionSegundos += Math.max(
                                    0,
                                    (fecha - capacitacionInicio) / 1000
                                );
                                capacitacionInicio = null;
                            }
                            break;

                        case "REUNION_INICIO":
                            reunionInicio = fecha;
                            break;

                        case "REUNION_FIN":
                            if (reunionInicio) {
                                reunionSegundos += Math.max(
                                    0,
                                    (fecha - reunionInicio) / 1000
                                );
                                reunionInicio = null;
                            }
                            break;

                    }

                });

                if (entrada && !salida) {
                    salida = new Date();
                }

                let jornadaSegundos = 0;

                if (entrada && salida) {

                    jornadaSegundos = Math.max(
                        0,
                        (salida - entrada) / 1000
                    );

                }

                // El almuerzo NO hace parte de la jornada laboral
                const jornadaLaboralSegundos = Math.max(
                    0,
                    jornadaSegundos - almuerzoSegundos
                );

                // El tiempo productivo descuenta únicamente el break
                const productivoSegundos = Math.max(
                    0,
                    jornadaLaboralSegundos - breakSegundos
                );

                let diferenciaSegundos = 0;

                if (horarioOficial) {
                    diferenciaSegundos =
                        jornadaLaboralSegundos -
                        horarioOficial.segundos;
                }
                callback(null, {

                    jornada_total: segundosATiempo(
                        jornadaLaboralSegundos
                    ),

                    break_total: segundosATiempo(
                        breakSegundos
                    ),

                    almuerzo_total: segundosATiempo(
                        almuerzoSegundos
                    ),

                    bano_total: segundosATiempo(
                        banoSegundos
                    ),

                    capacitacion_total: segundosATiempo(
                        capacitacionSegundos
                    ),

                    reunion_total: segundosATiempo(
                        reunionSegundos
                    ),

                    tiempo_productivo: segundosATiempo(
                        productivoSegundos
                    ),

                    horario_oficial: horarioOficial,

                    tiempo_esperado: horarioOficial
                        ? segundosATiempo(
                            horarioOficial.segundos
                        )
                        : "00:00:00",

                    diferencia: segundosATiempo(
                        Math.abs(diferenciaSegundos)
                    ),

                    cumplio_jornada:
                        diferenciaSegundos >= 0

                });

            }

        );

    };
    // =======================================================
    // CONVERTIR SEGUNDOS A HH:MM:SS
    // =======================================================

    const segundosATiempo = (segundos) => {

        segundos =
            Math.max(
                0,
                Math.floor(
                    Number(segundos) || 0
                )
            );

        const horas =
            Math.floor(segundos / 3600);

        const minutos =
            Math.floor(
                (segundos % 3600) / 60
            );

        const segundosRestantes =
            segundos % 60;

        return (

            String(horas).padStart(2, "0") +
            ":" +
            String(minutos).padStart(2, "0") +
            ":" +
            String(segundosRestantes).padStart(2, "0")

        );

    };


    // =======================================================
    // EXPORTAR
    // =======================================================

    module.exports = {

        registrarMovimiento,

        obtenerHistorial,

        obtenerEstadoActual,

        obtenerResumenJornada

    };