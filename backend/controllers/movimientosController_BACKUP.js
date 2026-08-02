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

    const tipoNormalizado = String(tipo || "")
        .trim()
        .toUpperCase();

    const estados = {

        ENTRADA: "TRABAJANDO",

        BREAK_INICIO: "BREAK",
        BREAK_FIN: "TRABAJANDO",

        ALMUERZO_INICIO: "ALMUERZO",
        ALMUERZO_FIN: "TRABAJANDO",

        BANO_INICIO: "BANO",
        BANO_FIN: "TRABAJANDO",

        CAPACITACION_INICIO: "CAPACITACION",
        CAPACITACION_FIN: "TRABAJANDO",

        REUNION_INICIO: "REUNION",
        REUNION_FIN: "TRABAJANDO",

        SALIDA: "SALIDA"

    };

    return estados[tipoNormalizado] || tipoNormalizado;

};

// =======================================================
// HORARIO OFICIAL
// =======================================================
//
// EQUITY LINE PROFESSIONAL SERVICES
//
// Lunes a Jueves:
// 10:00 AM - 07:00 PM
//
// Viernes:
// 11:00 AM - 07:00 PM
//
// Sábado:
// 09:00 AM - 04:00 PM
//
// Domingo:
// No hay jornada.
//
// IMPORTANTE:
// La aplicación está alojada en Vercel.
// Por eso NO debemos depender de la zona horaria
// configurada en el servidor.
//
// Toda la lógica utiliza:
// America/Bogota
// =======================================================

const ZONA_HORARIA = "America/Bogota";


const obtenerHorarioOficial = (fecha = new Date()) => {

    try {

        const partes = new Intl.DateTimeFormat(
            "en-US",
            {
                timeZone: ZONA_HORARIA,
                weekday: "short",
                hour: "2-digit",
                minute: "2-digit",
                hour12: false
            }
        ).formatToParts(fecha);


        const obtenerParte = (tipo) => {

            return partes.find(
                parte => parte.type === tipo
            )?.value;

        };


        const weekday = obtenerParte("weekday");


        // ===================================================
        // DOMINGO
        // ===================================================

        if (weekday === "Sun") {

            return null;

        }


        // ===================================================
        // LUNES A JUEVES
        // ===================================================

        if (
            weekday === "Mon" ||
            weekday === "Tue" ||
            weekday === "Wed" ||
            weekday === "Thu"
        ) {

            return {

                nombre: "Lunes a Jueves",

                inicio: "10:00",

                fin: "19:00",

                segundos: 9 * 60 * 60

            };

        }


        // ===================================================
        // VIERNES
        // ===================================================

        if (weekday === "Fri") {

            return {

                nombre: "Viernes",

                inicio: "11:00",

                fin: "19:00",

                segundos: 8 * 60 * 60

            };

        }


        // ===================================================
        // SÁBADO
        // ===================================================

        if (weekday === "Sat") {

            return {

                nombre: "Sábado",

                inicio: "09:00",

                fin: "16:00",

                segundos: 7 * 60 * 60

            };

        }


        return null;

    } catch (error) {

        console.error(
            "Error obteniendo horario oficial:",
            error
        );

        return null;

    }

};


// =======================================================
// OBTENER MOVIMIENTO DE INICIO MÁS RECIENTE
// =======================================================
//
// Esta función encuentra el inicio correspondiente a un
// movimiento de finalización.
//
// Ejemplos:
//
// BREAK_FIN
//     ↓
// BREAK_INICIO
//
// ALMUERZO_FIN
//     ↓
// ALMUERZO_INICIO
//
// BANO_FIN
//     ↓
// BANO_INICIO
//
// CAPACITACION_FIN
//     ↓
// CAPACITACION_INICIO
//
// REUNION_FIN
//     ↓
// REUNION_INICIO
//
// IMPORTANTE:
// Solo busca movimientos del asesor y del día actual.
// Además, filtra por el tipo exacto de inicio.
//
// =======================================================

const obtenerInicioMovimiento = (
    asesorId,
    tipoInicio,
    callback
) => {

    // ---------------------------------------------------
    // VALIDAR CALLBACK
    // ---------------------------------------------------

    if (typeof callback !== "function") {

        console.error(
            "❌ obtenerInicioMovimiento: callback inválido."
        );

        return;

    }


    // ---------------------------------------------------
    // VALIDAR ID DEL ASESOR
    // ---------------------------------------------------

    const asesorIdNumero =
        Number(asesorId);


    if (
        !Number.isInteger(asesorIdNumero) ||
        asesorIdNumero <= 0
    ) {

        return callback(

            new Error(
                "ID de asesor inválido."
            ),

            null

        );

    }


    // ---------------------------------------------------
    // NORMALIZAR TIPO
    // ---------------------------------------------------

    if (
        typeof tipoInicio !== "string" ||
        !tipoInicio.trim()
    ) {

        return callback(

            new Error(
                "Tipo de movimiento de inicio inválido."
            ),

            null

        );

    }


    const tipoInicioNormalizado =
        tipoInicio
            .trim()
            .toUpperCase();


    // ---------------------------------------------------
    // TIPOS DE INICIO PERMITIDOS
    // ---------------------------------------------------

    const tiposInicioPermitidos = [

        "BREAK_INICIO",

        "ALMUERZO_INICIO",

        "BANO_INICIO",

        "CAPACITACION_INICIO",

        "REUNION_INICIO"

    ];


    if (
        !tiposInicioPermitidos.includes(
            tipoInicioNormalizado
        )
    ) {

        return callback(

            new Error(
                `Tipo de inicio no permitido: ${tipoInicioNormalizado}`
            ),

            null

        );

    }


    // ---------------------------------------------------
    // CONSULTAR MOVIMIENTO
    // ---------------------------------------------------
    //
    // IMPORTANTE:
    //
    // Se filtra por:
    //
    // 1. asesor_id
    // 2. tipo exacto
    // 3. fecha actual
    //
    // Así evitamos tomar accidentalmente una ENTRADA,
    // otro tipo de pausa o una pausa de otro día.
    //
    // ---------------------------------------------------

    const sql = `

        SELECT

            id,

            asesor_id,

            tipo,

            fecha_hora

        FROM movimientos

        WHERE asesor_id = ?

        AND tipo = ?

        AND DATE(fecha_hora) = CURDATE()

        ORDER BY

            fecha_hora DESC,

            id DESC

        LIMIT 1

    `;


    db.query(

        sql,

        [

            asesorIdNumero,

            tipoInicioNormalizado

        ],

        (err, rows) => {

            // ---------------------------------------------------
            // ERROR MYSQL
            // ---------------------------------------------------

            if (err) {

                console.error(

                    "❌ Error obteniendo movimiento de inicio:",

                    err

                );

                return callback(

                    err,

                    null

                );

            }


            // ---------------------------------------------------
            // NO EXISTE MOVIMIENTO
            // ---------------------------------------------------

            if (
                !rows ||
                rows.length === 0
            ) {

                return callback(

                    null,

                    null

                );

            }


            // ---------------------------------------------------
            // MOVIMIENTO ENCONTRADO
            // ---------------------------------------------------

            const movimiento =
                rows[0];


            return callback(

                null,

                {

                    id:
                        movimiento.id,

                    asesor_id:
                        movimiento.asesor_id,

                    tipo:
                        movimiento.tipo,

                    fecha_hora:
                        movimiento.fecha_hora

                }

            );

        }

    );

};


            // ---------------------------------------------------
            // NO EXISTE MOVIMIENTO
            // ---------------------------------------------------

            if (
                !rows ||
                rows.length === 0
            ) {

                return callback(
                    null,
                    null
                );

            }


            // ---------------------------------------------------
            // MOVIMIENTO ENCONTRADO
            // ---------------------------------------------------

            return callback(
                null,
                rows[0]
            );

        }

    );

};

// =======================================================
// CALCULAR DURACIÓN ENTRE DOS FECHAS
// =======================================================
//
// Esta función calcula el tiempo transcurrido entre:
//
// inicio → fin
//
// Se utiliza para:
// - Break
// - Almuerzo
// - Baño
// - Capacitación
// - Reunión
//
// IMPORTANTE:
// No modifica las fechas.
// Solo calcula la diferencia entre ambos momentos.
//
// =======================================================

const calcularDuracion = (inicio, fin) => {

    // ---------------------------------------------------
    // VALIDAR FECHAS
    // ---------------------------------------------------

    if (!inicio || !fin) {

        return {

            milisegundos: 0,
            segundos: 0,
            minutos: 0,
            horas: 0,
            texto: "00:00:00"

        };

    }


    const fechaInicio =
        new Date(inicio);

    const fechaFin =
        new Date(fin);


    // ---------------------------------------------------
    // VERIFICAR FECHAS VÁLIDAS
    // ---------------------------------------------------

    if (
        Number.isNaN(
            fechaInicio.getTime()
        ) ||

        Number.isNaN(
            fechaFin.getTime()
        )
    ) {

        console.error(
            "❌ calcularDuracion recibió una fecha inválida:",
            {
                inicio,
                fin
            }
        );

        return {

            milisegundos: 0,
            segundos: 0,
            minutos: 0,
            horas: 0,
            texto: "00:00:00"

        };

    }


    // ---------------------------------------------------
    // CALCULAR DIFERENCIA
    // ---------------------------------------------------

    const diferenciaMs =
        fechaFin.getTime() -
        fechaInicio.getTime();


    // ---------------------------------------------------
    // EVITAR DURACIONES NEGATIVAS
    // ---------------------------------------------------

    if (diferenciaMs <= 0) {

        return {

            milisegundos: 0,
            segundos: 0,
            minutos: 0,
            horas: 0,
            texto: "00:00:00"

        };

    }


    // ---------------------------------------------------
    // CONVERTIR A SEGUNDOS
    // ---------------------------------------------------

    const segundosTotales =
        Math.floor(
            diferenciaMs / 1000
        );


    // ---------------------------------------------------
    // HORAS
    // ---------------------------------------------------

    const horas =
        Math.floor(
            segundosTotales / 3600
        );


    // ---------------------------------------------------
    // MINUTOS
    // ---------------------------------------------------

    const minutos =
        Math.floor(
            (segundosTotales % 3600) / 60
        );


    // ---------------------------------------------------
    // SEGUNDOS RESTANTES
    // ---------------------------------------------------

    const segundos =
        segundosTotales % 60;


    // ---------------------------------------------------
    // FORMATO HH:MM:SS
    // ---------------------------------------------------

    const texto =

        String(horas).padStart(2, "0") +
        ":" +

        String(minutos).padStart(2, "0") +
        ":" +

        String(segundos).padStart(2, "0");


    // ---------------------------------------------------
    // RESULTADO
    // ---------------------------------------------------

    return {

        milisegundos:
            diferenciaMs,

        segundos:
            segundosTotales,

        // Minutos completos acumulados.
        // Ejemplo:
        // 125 segundos = 2 minutos.
        minutos:
            Math.floor(
                segundosTotales / 60
            ),

        horas,

        texto

    };

};

    // ---------------------------------------------------
// COMPROBAR QUE EL ASESOR EXISTE Y ESTÉ ACTIVO
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

        // ---------------------------------------------------
        // ERROR CONSULTANDO ASESOR
        // ---------------------------------------------------

        if (asesorError) {

            console.error(
                "Error buscando asesor:",
                asesorError
            );

            return res.status(500).json({
                ok: false,
                error: "Error consultando el asesor."
            });

        }

        // ---------------------------------------------------
        // ASESOR NO EXISTE
        // ---------------------------------------------------

        if (
            !asesores ||
            asesores.length === 0
        ) {

            return res.status(404).json({
                ok: false,
                error: "El asesor no existe."
            });

        }

        const asesor = asesores[0];

        // ---------------------------------------------------
        // VALIDAR QUE EL ASESOR ESTÉ ACTIVO
        // ---------------------------------------------------

        if (
            Number(asesor.activo) !== 1
        ) {

            return res.status(400).json({

                ok: false,

                error:
                    "El asesor se encuentra inactivo y no puede registrar movimientos."

            });

        }

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

                // ---------------------------------------------------
                // ERROR CONSULTANDO ESTADO
                // ---------------------------------------------------

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

                // ---------------------------------------------------
                // ESTADO ACTUAL
                // ---------------------------------------------------

                const estadoActual =
                    estados &&
                    estados.length > 0
                        ? String(
                            estados[0].estado || ""
                        )
                            .trim()
                            .toUpperCase()
                        : null;

                // ---------------------------------------------------
                // ESTADOS QUE REPRESENTAN UNA PAUSA ACTIVA
                // ---------------------------------------------------
                //
                // Estos son los estados que NO permiten:
                //
                // - iniciar otra pausa
                // - registrar otra entrada
                // - registrar salida
                //
                // hasta finalizar la pausa actual.
                // ---------------------------------------------------

                const estadosDePausa = [

                    "BREAK",
                    "ALMUERZO",
                    "BANO",
                    "CAPACITACION",
                    "REUNION"

                ];

                // ---------------------------------------------------
                // ESTADOS VÁLIDOS PARA UNA JORNADA ACTIVA
                // ---------------------------------------------------

                const estadosDeJornadaActiva = [

                    "TRABAJANDO",
                    ...estadosDePausa

                ];

                // ---------------------------------------------------
                // A PARTIR DE AQUÍ CONTINÚA EL CÓDIGO
                // DE VALIDACIÓN DE ENTRADA / SALIDA / PAUSAS
                // ---------------------------------------------------

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
//
// La fecha/hora se genera directamente en MySQL mediante
// NOW(). Esto evita depender de la hora del servidor Node.js.
//
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
    (
        ?,
        ?,
        NOW(),
        ?
    )
`;

db.query(

    insertSql,

    [
        asesorIdNumero,
        tipoNormalizado,
        observacionFinal
    ],

    (insertError, insertResult) => {

        // ---------------------------------------------------
        // ERROR AL INSERTAR
        // ---------------------------------------------------

        if (insertError) {

            console.error(
                "❌ Error insertando movimiento:",
                insertError
            );

            return res.status(500).json({

                ok: false,

                error:
                    "No fue posible registrar el movimiento."

            });

        }


        // ---------------------------------------------------
        // VERIFICAR QUE MYSQL HAYA INSERTADO EL MOVIMIENTO
        // ---------------------------------------------------

        if (
            !insertResult ||
            !insertResult.insertId
        ) {

            console.error(
                "❌ MySQL no devolvió insertId."
            );

            return res.status(500).json({

                ok: false,

                error:
                    "El movimiento no pudo ser confirmado."

            });

        }


        // ---------------------------------------------------
        // ACTUALIZAR ESTADO
        // ---------------------------------------------------

        const nuevoEstado =
            obtenerEstadoFinal(
                tipoNormalizado
            );


        let updateEstadoSql;

        let updateParams;


        // ---------------------------------------------------
        // ENTRADA
        // ---------------------------------------------------
        //
        // Una nueva entrada:
        //
        // - inicia jornada
        // - inicia estado TRABAJANDO
        // - reinicia inicio_estado
        // - reinicia inicio_jornada
        //
        // ---------------------------------------------------

        if (
            tipoNormalizado === "ENTRADA"
        ) {

            updateEstadoSql = `

                INSERT INTO estados_actuales
                (
                    asesor_id,
                    estado,
                    inicio_estado,
                    inicio_jornada
                )

                VALUES
                (
                    ?,
                    ?,
                    NOW(),
                    NOW()
                )

                ON DUPLICATE KEY UPDATE

                    estado = VALUES(estado),

                    inicio_estado = NOW(),

                    inicio_jornada = NOW(),

                    ultima_actualizacion =
                        CURRENT_TIMESTAMP

            `;


            updateParams = [

                asesorIdNumero,

                nuevoEstado

            ];

        }


        // ---------------------------------------------------
        // RESTO DE MOVIMIENTOS
        // ---------------------------------------------------
        //
        // Break
        // Almuerzo
        // Baño
        // Capacitación
        // Reunión
        // Salida
        //
        // ---------------------------------------------------

        else {

            updateEstadoSql = `

                UPDATE estados_actuales

                SET

                    estado = ?,

                    inicio_estado = NOW(),

                    ultima_actualizacion =
                        CURRENT_TIMESTAMP

                WHERE asesor_id = ?

            `;


            updateParams = [

                nuevoEstado,

                asesorIdNumero

            ];

        }


        // ---------------------------------------------------
        // EJECUTAR ACTUALIZACIÓN DE ESTADO
        // ---------------------------------------------------

        db.query(

            updateEstadoSql,

            updateParams,

            (estadoUpdateError) => {

                // ---------------------------------------------------
                // ERROR ACTUALIZANDO ESTADO
                // ---------------------------------------------------

                if (estadoUpdateError) {

                    console.error(
                        "❌ Error actualizando estado:",
                        estadoUpdateError
                    );

                    return res.status(500).json({

                        ok: false,

                        error:
                            "Movimiento guardado, pero no fue posible actualizar el estado."

                    });

                }

    // ---------------------------------------------------
// ACTUALIZAR ESTADO DEL ASESOR
// ---------------------------------------------------
//
// REGLAS:
//
// ENTRADA:
// - Inicia una nueva jornada.
// - Reinicia inicio_jornada.
// - Reinicia inicio_estado.
//
// SALIDA:
// - Finaliza la jornada.
// - Conserva inicio_estado.
// - NO modifica inicio_jornada.
//
// OTROS MOVIMIENTOS:
// - Break
// - Almuerzo
// - Baño
// - Capacitación
// - Reunión
//
// Estos cambian el estado actual y reinician inicio_estado.
//
// ---------------------------------------------------

let updateEstadoSql;

let updateParams;


// ---------------------------------------------------
// ENTRADA
// ---------------------------------------------------

if (
    tipoNormalizado === "ENTRADA"
) {

    updateEstadoSql = `

        INSERT INTO estados_actuales
        (
            asesor_id,
            estado,
            inicio_estado,
            inicio_jornada
        )

        VALUES
        (
            ?,
            ?,
            NOW(),
            NOW()
        )

        ON DUPLICATE KEY UPDATE

            estado = VALUES(estado),

            inicio_estado = NOW(),

            inicio_jornada = NOW(),

            ultima_actualizacion =
                CURRENT_TIMESTAMP

    `;


    updateParams = [

        asesorIdNumero,

        nuevoEstado

    ];

}


// ---------------------------------------------------
// SALIDA
// ---------------------------------------------------
//
// IMPORTANTE:
//
// No modificamos:
//
// inicio_estado
// inicio_jornada
//
// Solo cambiamos el estado a SALIDA y registramos
// la hora exacta de actualización.
//
// ---------------------------------------------------

else if (
    tipoNormalizado === "SALIDA"
) {

    updateEstadoSql = `

        UPDATE estados_actuales

        SET

            estado = ?,

            ultima_actualizacion =
                CURRENT_TIMESTAMP

        WHERE asesor_id = ?

    `;


    updateParams = [

        nuevoEstado,

        asesorIdNumero

    ];

}


// ---------------------------------------------------
// RESTO DE MOVIMIENTOS
// ---------------------------------------------------
//
// Incluye:
//
// BREAK_INICIO
// BREAK_FIN
// ALMUERZO_INICIO
// ALMUERZO_FIN
// BANO_INICIO
// BANO_FIN
// CAPACITACION_INICIO
// CAPACITACION_FIN
// REUNION_INICIO
// REUNION_FIN
//
// Cada cambio comienza un nuevo estado.
//
// ---------------------------------------------------

else {

    updateEstadoSql = `

        UPDATE estados_actuales

        SET

            estado = ?,

            inicio_estado = NOW(),

            ultima_actualizacion =
                CURRENT_TIMESTAMP

        WHERE asesor_id = ?

    `;


    updateParams = [

        nuevoEstado,

        asesorIdNumero

    ];

}


// ---------------------------------------------------
// EJECUTAR ACTUALIZACIÓN
// ---------------------------------------------------

db.query(

    updateEstadoSql,

    updateParams,

    (estadoUpdateError) => {

        // ---------------------------------------------------
        // ERROR ACTUALIZANDO ESTADO
        // ---------------------------------------------------

        if (estadoUpdateError) {

            console.error(
                "❌ Error actualizando estado:",
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

        if (
            tipoNormalizado === "ENTRADA"
        ) {

            return res.json({

                ok: true,

                mensaje:
                    "Entrada registrada correctamente.",

                asesor: {

                    id: asesor.id,

                    nombre: asesor.nombre

                },

                movimiento: {

                    id:
                        insertResult.insertId,

                    tipo:
                        tipoNormalizado

                },

                estado:
                    nuevoEstado,

                inicio_jornada:
                    new Date(),

                timestamp:
                    new Date()

            });

        }


        // ---------------------------------------------------
// RESPUESTA SALIDA
// ---------------------------------------------------
//
// La salida ya fue registrada y el estado ya fue
// actualizado a SALIDA.
//
// Ahora calculamos el resumen completo de la jornada.
//
// ---------------------------------------------------

if (
    tipoNormalizado === "SALIDA"
) {

    return obtenerResumenJornada(

        asesorIdNumero,

        (resumenError, resumen) => {

            // -----------------------------------------
            // ERROR CALCULANDO RESUMEN
            // -----------------------------------------

            if (resumenError) {

                console.error(
                    "❌ Error calculando resumen:",
                    resumenError
                );

                return res.json({

                    ok: true,

                    mensaje:
                        "Salida registrada, pero no fue posible calcular el resumen.",

                    asesor: {

                        id: asesor.id,

                        nombre: asesor.nombre

                    },

                    movimiento: {

                        id:
                            insertResult.insertId,

                        tipo:
                            tipoNormalizado

                    },

                    estado:
                        nuevoEstado,

                    resumen: null

                });

            }


            // -----------------------------------------
            // SALIDA CORRECTAMENTE REGISTRADA
            // -----------------------------------------

            return res.json({

                ok: true,

                mensaje:
                    "Salida registrada correctamente.",

                asesor: {

                    id: asesor.id,

                    nombre: asesor.nombre

                },

                movimiento: {

                    id:
                        insertResult.insertId,

                    tipo:
                        tipoNormalizado

                },

                estado:
                    nuevoEstado,

                resumen,

                // La hora exacta de salida se obtiene
                // posteriormente desde el movimiento
                // registrado en MySQL.
                hora_salida:
                    resumen.hora_salida || null

            });

        }

    );

}


// ---------------------------------------------------
// FIN DE PAUSA
// ---------------------------------------------------
//
// Aquí procesamos:
//
// BREAK_FIN
// ALMUERZO_FIN
// BANO_FIN
// CAPACITACION_FIN
// REUNION_FIN
//
// Buscamos el inicio correspondiente para calcular
// cuánto tiempo duró la pausa.
// ---------------------------------------------------

if (
    configuracionFinal
) {

    return obtenerInicioMovimiento(

        asesorIdNumero,

        configuracionFinal.inicio,

        (inicioError, movimientoInicio) => {

            // -----------------------------------------
            // ERROR BUSCANDO INICIO
            // -----------------------------------------

            if (inicioError) {

                console.error(
                    "❌ Error buscando inicio de pausa:",
                    inicioError
                );

                return res.json({

                    ok: true,

                    mensaje:
                        "Movimiento registrado, pero no fue posible calcular la duración.",

                    asesor: {

                        id: asesor.id,

                        nombre: asesor.nombre

                    },

                    movimiento: {

                        id:
                            insertResult.insertId,

                        tipo:
                            tipoNormalizado

                    },

                    estado:
                        nuevoEstado,

                    duracion: null

                });

            }

                    // -----------------------------------------
// NO SE ENCONTRÓ INICIO
// -----------------------------------------

if (!movimientoInicio) {

    return res.json({

        ok: true,

        mensaje:
            "Movimiento registrado, pero no se encontró el inicio correspondiente.",

        asesor: {

            id: asesor.id,

            nombre: asesor.nombre

        },

        movimiento: {

            id: insertResult.insertId,

            tipo: tipoNormalizado

        },

        estado: nuevoEstado,

        duracion: null,

        limite_minutos: 0,

        excedio_limite: false

    });

}


// -----------------------------------------
// OBTENER HORA REAL DEL MOVIMIENTO FINAL
// -----------------------------------------
//
// La hora se obtiene directamente de MySQL.
// De esta manera evitamos diferencias entre:
//
// - navegador
// - Node.js / Railway
// - MySQL
//
// -----------------------------------------

const obtenerHoraMovimientoSql = `

    SELECT
        id,
        fecha_hora

    FROM movimientos

    WHERE id = ?

    LIMIT 1

`;


db.query(

    obtenerHoraMovimientoSql,

    [insertResult.insertId],

    (horaError, horaRows) => {

        // -----------------------------------------
        // ERROR OBTENIENDO HORA DEL MOVIMIENTO
        // -----------------------------------------

        if (horaError) {

            console.error(
                "❌ Error obteniendo hora del movimiento:",
                horaError
            );

            return res.status(500).json({

                ok: false,

                error:
                    "La pausa fue registrada, pero no fue posible calcular su duración."

            });

        }


        // -----------------------------------------
        // VERIFICAR QUE MYSQL DEVOLVIÓ EL MOVIMIENTO
        // -----------------------------------------

        if (
            !horaRows ||
            horaRows.length === 0 ||
            !horaRows[0].fecha_hora
        ) {

            console.error(
                "❌ No se encontró la fecha del movimiento:",
                insertResult.insertId
            );

            return res.status(500).json({

                ok: false,

                error:
                    "La pausa fue registrada, pero no se encontró su hora de finalización."

            });

        }


        // -----------------------------------------
        // HORA FINAL REGISTRADA POR MYSQL
        // -----------------------------------------

        const horaFin =
            horaRows[0].fecha_hora;


        // -----------------------------------------
        // CALCULAR DURACIÓN
        // -----------------------------------------
        //
        // Inicio:
        // movimientoInicio.fecha_hora
        //
        // Fin:
        // horaFin registrada por MySQL
        //
        // -----------------------------------------

        const duracion =
            calcularDuracion(

                movimientoInicio.fecha_hora,

                horaFin

            );


        // -----------------------------------------
        // OBTENER LÍMITE DE LA PAUSA
        // -----------------------------------------

        let limite = 0;


        switch (tipoNormalizado) {

            case "BREAK_FIN":

                limite =
                    Number(config.break_max) || 0;

                break;


            case "ALMUERZO_FIN":

                limite =
                    Number(config.almuerzo_max) || 0;

                break;


            case "BANO_FIN":

                limite =
                    Number(config.bano_max) || 0;

                break;


            case "CAPACITACION_FIN":

                limite =
                    Number(config.capacitacion_max) || 0;

                break;


            case "REUNION_FIN":

                limite =
                    Number(config.reunion_max) || 0;

                break;


            default:

                limite = 0;

                break;

        }


        // -----------------------------------------
        // DETERMINAR SI EXCEDIÓ EL LÍMITE
        // -----------------------------------------
        //
        // IMPORTANTE:
        //
        // duracion.segundos = número
        //
        // limite * 60 = segundos permitidos
        //
        // -----------------------------------------

        const excedioLimite =

            limite > 0 &&

            duracion.segundos >
                (limite * 60);


        // -----------------------------------------
        // RESPUESTA FINAL DE PAUSA
        // -----------------------------------------

        return res.json({

            ok: true,

            mensaje:
                "Pausa finalizada correctamente.",


            asesor: {

                id: asesor.id,

                nombre: asesor.nombre

            },


            movimiento: {

                id:
                    insertResult.insertId,

                tipo:
                    tipoNormalizado

            },


            estado:
                nuevoEstado,


            // -----------------------------------------
            // DURACIÓN COMPLETA
            // -----------------------------------------

            duracion: {

                milisegundos:
                    duracion.milisegundos,

                segundos:
                    duracion.segundos,

                minutos:
                    duracion.minutos,

                horas:
                    duracion.horas,

                texto:
                    duracion.texto

            },


            // -----------------------------------------
            // LÍMITE CONFIGURADO
            // -----------------------------------------

            limite_minutos:
                limite,


            // -----------------------------------------
            // ¿EXCEDIÓ?
            // -----------------------------------------

            excedio_limite:
                excedioLimite,


            // -----------------------------------------
            // HORA DE FINALIZACIÓN
            // -----------------------------------------

            hora_fin:
                horaFin

        });

    }

);


        // ---------------------------------------------------
        // RESPUESTA GENERAL
        // ---------------------------------------------------

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

            timestamp: new Date()

        });

    }

);

            // ---------------------------------------------------
// VALIDAR SI LA PAUSA EXCEDIÓ EL LÍMITE
// ---------------------------------------------------

const excedido =
    Number(duracion.minutos) > Number(limite);


// ---------------------------------------------------
// RESPUESTA FIN DE PAUSA
// ---------------------------------------------------

return res.json({

    ok: true,

    mensaje:
        excedido
            ? "Movimiento registrado. La pausa excedió el tiempo permitido."
            : "Movimiento registrado correctamente.",

    asesor: {

        id: asesor.id,

        nombre: asesor.nombre

    },

    movimiento: {

        id: insertResult.insertId,

        tipo: tipoNormalizado,

        fecha_hora: ahora

    },

    estado: nuevoEstado,

    duracion: {

        segundos:
            Number(duracion.segundos) || 0,

        minutos:
            Number(duracion.minutos) || 0,

        texto:
            duracion.texto || "00:00:00"

    },

    limite_minutos:
        Number(limite) || 0,

    excedido,

    timestamp: ahora

});

        }

    );

}


// ---------------------------------------------------
// OTROS MOVIMIENTOS
// ---------------------------------------------------

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

        tipo: tipoNormalizado,

        fecha_hora: new Date()

    },

    estado: nuevoEstado,

    timestamp: new Date()

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
// OBTENER HISTORIAL DEL DÍA
// =======================================================

const obtenerHistorial = (req, res) => {

    const { asesorId } = req.params;


    // ---------------------------------------------------
    // VALIDAR ID
    // ---------------------------------------------------

    const asesorIdNumero = Number(asesorId);

    if (
        !Number.isInteger(asesorIdNumero) ||
        asesorIdNumero <= 0
    ) {

        return res.status(400).json({

            ok: false,

            error:
                "El ID del asesor no es válido."

        });

    }


    // ---------------------------------------------------
    // CONSULTAR MOVIMIENTOS DEL DÍA
    // ---------------------------------------------------

    const sql = `

        SELECT

            id,

            asesor_id,

            tipo,

            fecha_hora,

            observacion,

            duracion_segundos,

            creado

        FROM movimientos

        WHERE asesor_id = ?

        AND DATE(fecha_hora) = CURDATE()

        ORDER BY fecha_hora DESC, id DESC

    `;


    db.query(

        sql,

        [asesorIdNumero],

        (err, rows) => {

            // ---------------------------------------------------
            // ERROR
            // ---------------------------------------------------

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


            // ---------------------------------------------------
            // NORMALIZAR RESPUESTA
            // ---------------------------------------------------

            const historial = rows.map((movimiento) => ({

                id:
                    movimiento.id,

                asesor_id:
                    movimiento.asesor_id,

                tipo:
                    movimiento.tipo,

                fecha_hora:
                    movimiento.fecha_hora,

                observacion:
                    movimiento.observacion || null,

                duracion_segundos:
                    Number(
                        movimiento.duracion_segundos
                    ) || 0,

                creado:
                    movimiento.creado

            }));


            // ---------------------------------------------------
            // RESPUESTA
            // ---------------------------------------------------

            return res.json(historial);

        }

    );

};

   // =======================================================
// OBTENER ESTADO ACTUAL
// =======================================================

const obtenerEstadoActual = (req, res) => {

    const { asesorId } = req.params;


    // ---------------------------------------------------
    // VALIDAR ID DEL ASESOR
    // ---------------------------------------------------

    const asesorIdNumero = Number(asesorId);

    if (
        !Number.isInteger(asesorIdNumero) ||
        asesorIdNumero <= 0
    ) {

        return res.status(400).json({

            ok: false,

            error:
                "El ID del asesor no es válido."

        });

    }


    // ---------------------------------------------------
    // CONSULTAR ESTADO
    // ---------------------------------------------------

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

        [asesorIdNumero],

        (err, rows) => {


            // ---------------------------------------------------
            // ERROR MYSQL
            // ---------------------------------------------------

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


            // ---------------------------------------------------
            // NO EXISTE ESTADO
            // ---------------------------------------------------

            if (
                !rows ||
                rows.length === 0
            ) {

                return res.json({

                    ok: true,

                    existe: false,

                    asesor_id:
                        asesorIdNumero,

                    estado:
                        "DISPONIBLE",

                    inicio_estado:
                        null,

                    inicio_jornada:
                        null,

                    ultima_actualizacion:
                        null

                });

            }


            // ---------------------------------------------------
            // OBTENER REGISTRO
            // ---------------------------------------------------

            const estado = rows[0];


            // ---------------------------------------------------
            // RESPUESTA
            // ---------------------------------------------------

            return res.json({

                ok: true,

                existe: true,

                asesor_id:
                    estado.asesor_id,

                estado:
                    estado.estado,

                inicio_estado:
                    estado.inicio_estado || null,

                inicio_jornada:
                    estado.inicio_jornada || null,

                ultima_actualizacion:
                    estado.ultima_actualizacion || null

            });

        }

    );

};
    // =======================================================
// RESUMEN DE JORNADA
// =======================================================

const obtenerResumenJornada = (
    asesorId,
    callback
) => {

    // ---------------------------------------------------
    // VALIDAR ID
    // ---------------------------------------------------

    const asesorIdNumero = Number(asesorId);

    if (
        !Number.isInteger(asesorIdNumero) ||
        asesorIdNumero <= 0
    ) {

        return callback(
            new Error("ID de asesor inválido."),
            null
        );

    }


    // ---------------------------------------------------
    // OBTENER MOVIMIENTOS DEL DÍA
    // ---------------------------------------------------

    const sql = `

        SELECT
            id,
            tipo,
            fecha_hora

        FROM movimientos

        WHERE asesor_id = ?

        AND DATE(fecha_hora) = CURDATE()

        ORDER BY
            fecha_hora ASC,
            id ASC

    `;


    db.query(
        sql,
        [asesorIdNumero],

        (err, movimientos) => {

            // ---------------------------------------------------
            // ERROR MYSQL
            // ---------------------------------------------------

            if (err) {

                console.error(
                    "Error obteniendo movimientos para resumen:",
                    err
                );

                return callback(err, null);

            }


            // ---------------------------------------------------
            // SIN MOVIMIENTOS
            // ---------------------------------------------------

            if (
                !movimientos ||
                movimientos.length === 0
            ) {

                return callback(null, {

                    jornada_total:
                        "00:00:00",

                    jornada_segundos:
                        0,

                    break_total:
                        "00:00:00",

                    break_segundos:
                        0,

                    almuerzo_total:
                        "00:00:00",

                    almuerzo_segundos:
                        0,

                    bano_total:
                        "00:00:00",

                    bano_segundos:
                        0,

                    capacitacion_total:
                        "00:00:00",

                    capacitacion_segundos:
                        0,

                    reunion_total:
                        "00:00:00",

                    reunion_segundos:
                        0,

                    tiempo_productivo:
                        "00:00:00",

                    tiempo_productivo_segundos:
                        0,

                    horario_oficial:
                        null,

                    tiempo_esperado:
                        "00:00:00",

                    tiempo_esperado_segundos:
                        0,

                    diferencia:
                        "00:00:00",

                    diferencia_segundos:
                        0,

                    cumplio_jornada:
                        false,

                    jornada_iniciada:
                        false,

                    jornada_finalizada:
                        false

                });

            }


            // ===================================================
            // VARIABLES
            // ===================================================

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


            // ===================================================
            // PROCESAR MOVIMIENTOS
            // ===================================================

            movimientos.forEach((movimiento) => {

                const tipo =
                    String(movimiento.tipo || "")
                        .trim()
                        .toUpperCase();


                const fecha =
                    new Date(movimiento.fecha_hora);


                // Evitar fechas inválidas
                if (
                    Number.isNaN(fecha.getTime())
                ) {

                    return;

                }


                switch (tipo) {


                    // ---------------------------------------------------
                    // ENTRADA
                    // ---------------------------------------------------

                    case "ENTRADA":

                        // Solo tomamos la primera entrada
                        if (!entrada) {

                            entrada = fecha;

                        }

                        break;


                    // ---------------------------------------------------
                    // SALIDA
                    // ---------------------------------------------------

                    case "SALIDA":

                        // Solo tomamos la primera salida
                        if (!salida) {

                            salida = fecha;

                        }

                        break;


                    // ---------------------------------------------------
                    // BREAK INICIO
                    // ---------------------------------------------------

                    case "BREAK_INICIO":

                        // Evitar reiniciar una pausa que ya estaba abierta
                        if (!breakInicio) {

                            breakInicio = fecha;

                        }

                        break;


                    // ---------------------------------------------------
                    // BREAK FIN
                    // ---------------------------------------------------

                    case "BREAK_FIN":

                        if (breakInicio) {

                            const segundos =
                                Math.max(
                                    0,
                                    (fecha - breakInicio) / 1000
                                );

                            breakSegundos +=
                                Math.floor(segundos);

                            breakInicio = null;

                        }

                        break;


                    // ---------------------------------------------------
                    // ALMUERZO INICIO
                    // ---------------------------------------------------

                    case "ALMUERZO_INICIO":

                        if (!almuerzoInicio) {

                            almuerzoInicio = fecha;

                        }

                        break;


                    // ---------------------------------------------------
                    // ALMUERZO FIN
                    // ---------------------------------------------------

                    case "ALMUERZO_FIN":

                        if (almuerzoInicio) {

                            const segundos =
                                Math.max(
                                    0,
                                    (fecha - almuerzoInicio) / 1000
                                );

                            almuerzoSegundos +=
                                Math.floor(segundos);

                            almuerzoInicio = null;

                        }

                        break;


                    // ---------------------------------------------------
                    // BAÑO INICIO
                    // ---------------------------------------------------

                    case "BANO_INICIO":

                        if (!banoInicio) {

                            banoInicio = fecha;

                        }

                        break;


                    // ---------------------------------------------------
                    // BAÑO FIN
                    // ---------------------------------------------------

                    case "BANO_FIN":

                        if (banoInicio) {

                            const segundos =
                                Math.max(
                                    0,
                                    (fecha - banoInicio) / 1000
                                );

                            banoSegundos +=
                                Math.floor(segundos);

                            banoInicio = null;

                        }

                        break;


                    // ---------------------------------------------------
                    // CAPACITACIÓN INICIO
                    // ---------------------------------------------------

                    case "CAPACITACION_INICIO":

                        if (!capacitacionInicio) {

                            capacitacionInicio = fecha;

                        }

                        break;


                    // ---------------------------------------------------
                    // CAPACITACIÓN FIN
                    // ---------------------------------------------------

                    case "CAPACITACION_FIN":

                        if (capacitacionInicio) {

                            const segundos =
                                Math.max(
                                    0,
                                    (fecha - capacitacionInicio) / 1000
                                );

                            capacitacionSegundos +=
                                Math.floor(segundos);

                            capacitacionInicio = null;

                        }

                        break;


                    // ---------------------------------------------------
                    // REUNIÓN INICIO
                    // ---------------------------------------------------

                    case "REUNION_INICIO":

                        if (!reunionInicio) {

                            reunionInicio = fecha;

                        }

                        break;


                    // ---------------------------------------------------
                    // REUNIÓN FIN
                    // ---------------------------------------------------

                    case "REUNION_FIN":

                        if (reunionInicio) {

                            const segundos =
                                Math.max(
                                    0,
                                    (fecha - reunionInicio) / 1000
                                );

                            reunionSegundos +=
                                Math.floor(segundos);

                            reunionInicio = null;

                        }

                        break;

                }

            });


            // ===================================================
            // DETERMINAR FIN DE JORNADA
            // ===================================================

            // Si ya existe SALIDA:
            // el tiempo queda congelado en esa hora.
            //
            // Si todavía no existe SALIDA:
            // usamos la hora actual para mantener el contador
            // funcionando mientras el asesor trabaja.

            const ahora = new Date();

            const finJornada =
                salida || ahora;


            // ===================================================
            // CERRAR PAUSAS ABIERTAS
            // ===================================================

            // Si el asesor está actualmente en una pausa,
            // contamos desde el inicio hasta:
            //
            // - la SALIDA, si ya salió
            // - AHORA, si continúa trabajando.
            //
            // Esto evita que una pausa activa aparezca como 00:00:00.

            if (breakInicio) {

                const finPausa =
                    salida || ahora;

                breakSegundos += Math.floor(
                    Math.max(
                        0,
                        (finPausa - breakInicio) / 1000
                    )
                );

            }


            if (almuerzoInicio) {

                const finPausa =
                    salida || ahora;

                almuerzoSegundos += Math.floor(
                    Math.max(
                        0,
                        (finPausa - almuerzoInicio) / 1000
                    )
                );

            }


            if (banoInicio) {

                const finPausa =
                    salida || ahora;

                banoSegundos += Math.floor(
                    Math.max(
                        0,
                        (finPausa - banoInicio) / 1000
                    )
                );

            }


            if (capacitacionInicio) {

                const finPausa =
                    salida || ahora;

                capacitacionSegundos += Math.floor(
                    Math.max(
                        0,
                        (finPausa - capacitacionInicio) / 1000
                    )
                );

            }


            if (reunionInicio) {

                const finPausa =
                    salida || ahora;

                reunionSegundos += Math.floor(
                    Math.max(
                        0,
                        (finPausa - reunionInicio) / 1000
                    )
                );

            }


            // ===================================================
            // CALCULAR JORNADA TOTAL
            // ===================================================

            let jornadaSegundos = 0;


            if (entrada) {

                jornadaSegundos =
                    Math.max(
                        0,
                        Math.floor(
                            (finJornada - entrada) / 1000
                        )
                    );

            }


            // ===================================================
            // TOTAL DE PAUSAS
            // ===================================================

            const pausasSegundos =
                breakSegundos +
                almuerzoSegundos +
                banoSegundos +
                capacitacionSegundos +
                reunionSegundos;


            // ===================================================
            // TIEMPO PRODUCTIVO
            // ===================================================

            const tiempoProductivoSegundos =
                Math.max(
                    0,
                    jornadaSegundos - pausasSegundos
                );


            // ===================================================
            // HORARIO OFICIAL
            // ===================================================

            const horarioOficial =
                obtenerHorarioOficial(ahora);


            // ===================================================
            // TIEMPO ESPERADO
            // ===================================================

            let tiempoEsperadoSegundos = 0;


            /*
             * Intentamos obtener las horas oficiales desde
             * la configuración existente.
             *
             * Si obtenerHorarioOficial devuelve un objeto
             * con horas, las utilizamos.
             */

            if (
                horarioOficial &&
                horarioOficial.horas !== undefined
            ) {

                tiempoEsperadoSegundos =
                    Number(horarioOficial.horas) * 3600;

            }


            // Compatibilidad si el helper devuelve segundos
            else if (
                horarioOficial &&
                horarioOficial.segundos !== undefined
            ) {

                tiempoEsperadoSegundos =
                    Number(horarioOficial.segundos);

            }


            // Compatibilidad si devuelve minutos
            else if (
                horarioOficial &&
                horarioOficial.minutos !== undefined
            ) {

                tiempoEsperadoSegundos =
                    Number(horarioOficial.minutos) * 60;

            }


            tiempoEsperadoSegundos =
                Math.max(
                    0,
                    Math.floor(tiempoEsperadoSegundos)
                );


            // ===================================================
            // DIFERENCIA CON JORNADA OFICIAL
            // ===================================================

            const diferenciaSegundos =
                jornadaSegundos -
                tiempoEsperadoSegundos;


            // ===================================================
            // ¿CUMPLIÓ JORNADA?
            // ===================================================

            const cumplioJornada =
                salida !== null &&
                tiempoEsperadoSegundos > 0 &&
                jornadaSegundos >= tiempoEsperadoSegundos;


            // ===================================================
            // FUNCIÓN FORMATO HH:MM:SS
            // ===================================================

            const formatoTiempo = (segundos) => {

                const total =
                    Math.max(
                        0,
                        Math.floor(
                            Number(segundos) || 0
                        )
                    );


                const horas =
                    Math.floor(total / 3600);


                const minutos =
                    Math.floor(
                        (total % 3600) / 60
                    );


                const segundosRestantes =
                    total % 60;


                return (

                    String(horas)
                        .padStart(2, "0")

                    + ":" +

                    String(minutos)
                        .padStart(2, "0")

                    + ":" +

                    String(segundosRestantes)
                        .padStart(2, "0")

                );

            };


            // ===================================================
            // RESPUESTA FINAL
            // ===================================================

            return callback(null, {

                // ---------------------------------------------------
                // JORNADA
                // ---------------------------------------------------

                jornada_total:
                    formatoTiempo(
                        jornadaSegundos
                    ),

                jornada_segundos:
                    jornadaSegundos,


                // ---------------------------------------------------
                // BREAK
                // ---------------------------------------------------

                break_total:
                    formatoTiempo(
                        breakSegundos
                    ),

                break_segundos:
                    breakSegundos,


                // ---------------------------------------------------
                // ALMUERZO
                // ---------------------------------------------------

                almuerzo_total:
                    formatoTiempo(
                        almuerzoSegundos
                    ),

                almuerzo_segundos:
                    almuerzoSegundos,


                // ---------------------------------------------------
                // BAÑO
                // ---------------------------------------------------

                bano_total:
                    formatoTiempo(
                        banoSegundos
                    ),

                bano_segundos:
                    banoSegundos,


                // ---------------------------------------------------
                // CAPACITACIÓN
                // ---------------------------------------------------

                capacitacion_total:
                    formatoTiempo(
                        capacitacionSegundos
                    ),

                capacitacion_segundos:
                    capacitacionSegundos,


                // ---------------------------------------------------
                // REUNIÓN
                // ---------------------------------------------------

                reunion_total:
                    formatoTiempo(
                        reunionSegundos
                    ),

                reunion_segundos:
                    reunionSegundos,


                // ---------------------------------------------------
                // TIEMPO PRODUCTIVO
                // ---------------------------------------------------

                tiempo_productivo:
                    formatoTiempo(
                        tiempoProductivoSegundos
                    ),

                tiempo_productivo_segundos:
                    tiempoProductivoSegundos,


                // ---------------------------------------------------
                // HORARIO OFICIAL
                // ---------------------------------------------------

                horario_oficial:
                    horarioOficial || null,


                // ---------------------------------------------------
                // TIEMPO ESPERADO
                // ---------------------------------------------------

                tiempo_esperado:
                    formatoTiempo(
                        tiempoEsperadoSegundos
                    ),

                tiempo_esperado_segundos:
                    tiempoEsperadoSegundos,


                // ---------------------------------------------------
                // DIFERENCIA
                // ---------------------------------------------------

                diferencia:
                    formatoTiempo(
                        Math.abs(
                            diferenciaSegundos
                        )
                    ),

                diferencia_segundos:
                    diferenciaSegundos,


                // ---------------------------------------------------
                // ESTADO DE JORNADA
                // ---------------------------------------------------

                jornada_iniciada:
                    entrada !== null,

                jornada_finalizada:
                    salida !== null,

                cumplio_jornada:
                    cumplioJornada,

                // ---------------------------------------------------
                // HORAS DE REFERENCIA
                // ---------------------------------------------------

                entrada:
                    entrada
                        ? entrada.toISOString()
                        : null,

                salida:
                    salida
                        ? salida.toISOString()
                        : null

            });

        }

    );

};

                // =======================================================
// CERRAR PAUSAS ABIERTAS PARA EL CÁLCULO
// =======================================================
//
// Si el asesor continúa trabajando y tiene una pausa activa,
// calculamos esa pausa hasta el momento actual.
//
// Si ya registró SALIDA, las pausas abiertas NO deberían
// existir debido a las validaciones anteriores. En ese caso,
// no modificamos los tiempos.
//
// IMPORTANTE:
// El almuerzo se descuenta de la jornada laboral.
// Break también se descuenta del tiempo productivo.
// Baño, capacitación y reunión NO se descuentan del
// tiempo productivo en esta versión del sistema.
// =======================================================

if (!salida) {

    if (breakInicio) {

        breakSegundos += Math.max(
            0,
            Math.floor(
                (finJornada - breakInicio) / 1000
            )
        );

    }


    if (almuerzoInicio) {

        almuerzoSegundos += Math.max(
            0,
            Math.floor(
                (finJornada - almuerzoInicio) / 1000
            )
        );

    }


    if (banoInicio) {

        banoSegundos += Math.max(
            0,
            Math.floor(
                (finJornada - banoInicio) / 1000
            )
        );

    }


    if (capacitacionInicio) {

        capacitacionSegundos += Math.max(
            0,
            Math.floor(
                (finJornada - capacitacionInicio) / 1000
            )
        );

    }


    if (reunionInicio) {

        reunionSegundos += Math.max(
            0,
            Math.floor(
                (finJornada - reunionInicio) / 1000
            )
        );

    }

}


// =======================================================
// JORNADA LABORAL
// =======================================================
//
// La jornada oficial de trabajo NO incluye el almuerzo.
//
// Ejemplo:
//
// Entrada:       10:00
// Salida:        19:00
// Almuerzo:      01:00
//
// Jornada total:     09:00
// Jornada laboral:   08:00
//
// =======================================================

const jornadaLaboralSegundos = Math.max(

    0,

    Math.floor(
        jornadaSegundos -
        almuerzoSegundos
    )

);


// =======================================================
// TIEMPO PRODUCTIVO
// =======================================================
//
// El tiempo productivo descuenta:
// - Almuerzo, porque ya fue descontado de jornadaLaboral
// - Break
//
// NO descontamos:
// - Baño
// - Capacitación
// - Reunión
//
// Esto permite que capacitación y reuniones sigan contando
// como tiempo laboral/productivo.
// =======================================================

const productivoSegundos = Math.max(

    0,

    Math.floor(
        jornadaLaboralSegundos -
        breakSegundos
    )

);


// =======================================================
// HORARIO OFICIAL
// =======================================================

const horarioSegundos =

    horarioOficial &&
    Number.isFinite(
        Number(horarioOficial.segundos)
    )

        ? Math.max(
            0,
            Math.floor(
                Number(
                    horarioOficial.segundos
                )
            )
        )

        : 0;


// =======================================================
// DIFERENCIA CON HORARIO OFICIAL
// =======================================================
//
// Positivo = trabajó más del tiempo esperado
// Negativo = le faltó tiempo
//
// Ejemplo:
//
// Jornada laboral: 08:30
// Esperado:        09:00
//
// Diferencia:      -00:30:00
//
// =======================================================

const diferenciaSegundos =

    horarioSegundos > 0

        ? jornadaLaboralSegundos -
          horarioSegundos

        : 0;


// =======================================================
// CUMPLIMIENTO DE JORNADA
// =======================================================
//
// El asesor cumple cuando alcanza o supera el tiempo
// oficial esperado.
//
// No exigimos SALIDA aquí porque el resumen también se
// utiliza mientras el asesor continúa trabajando.
// =======================================================

const cumplioJornada =

    horarioSegundos > 0 &&

    jornadaLaboralSegundos >=
    horarioSegundos;


// =======================================================
// RESPUESTA FINAL DEL RESUMEN
// =======================================================

callback(null, {

    // ---------------------------------------------------
    // JORNADA LABORAL
    // ---------------------------------------------------

    jornada_total:

        segundosATiempo(
            jornadaLaboralSegundos
        ),

    jornada_segundos:
        jornadaLaboralSegundos,


    // ---------------------------------------------------
    // BREAK
    // ---------------------------------------------------

    break_total:

        segundosATiempo(
            breakSegundos
        ),

    break_segundos:
        breakSegundos,


    // ---------------------------------------------------
    // ALMUERZO
    // ---------------------------------------------------

    almuerzo_total:

        segundosATiempo(
            almuerzoSegundos
        ),

    almuerzo_segundos:
        almuerzoSegundos,


    // ---------------------------------------------------
    // BAÑO
    // ---------------------------------------------------

    bano_total:

        segundosATiempo(
            banoSegundos
        ),

    bano_segundos:
        banoSegundos,


    // ---------------------------------------------------
    // CAPACITACIÓN
    // ---------------------------------------------------

    capacitacion_total:

        segundosATiempo(
            capacitacionSegundos
        ),

    capacitacion_segundos:
        capacitacionSegundos,


    // ---------------------------------------------------
    // REUNIÓN
    // ---------------------------------------------------

    reunion_total:

        segundosATiempo(
            reunionSegundos
        ),

    reunion_segundos:
        reunionSegundos,


    // ---------------------------------------------------
    // TIEMPO PRODUCTIVO
    // ---------------------------------------------------

    tiempo_productivo:

        segundosATiempo(
            productivoSegundos
        ),

    tiempo_productivo_segundos:
        productivoSegundos,


    // ---------------------------------------------------
    // HORARIO OFICIAL
    // ---------------------------------------------------

    horario_oficial:
        horarioOficial || null,


    // ---------------------------------------------------
    // TIEMPO ESPERADO
    // ---------------------------------------------------

    tiempo_esperado:

        segundosATiempo(
            horarioSegundos
        ),

    tiempo_esperado_segundos:
        horarioSegundos,


    // ---------------------------------------------------
    // DIFERENCIA
    // ---------------------------------------------------
    //
    // IMPORTANTE:
    // Conservamos también el valor negativo en
    // diferencia_segundos.
    //
    // Así el frontend puede saber si faltan o sobran horas.
    //
    // El texto se muestra como valor absoluto para
    // mantener compatibilidad con tu Dashboard actual.
    // ---------------------------------------------------

    diferencia:

        segundosATiempo(
            Math.abs(
                diferenciaSegundos
            )
        ),

    diferencia_segundos:
        diferenciaSegundos,


    // ---------------------------------------------------
    // CUMPLIMIENTO
    // ---------------------------------------------------

    cumplio_jornada:
        cumplioJornada,


    // ---------------------------------------------------
    // ESTADO DE LA JORNADA
    // ---------------------------------------------------

    jornada_iniciada:
        entrada !== null,

    jornada_finalizada:
        salida !== null,


    // ---------------------------------------------------
    // MARCAS DE TIEMPO
    // ---------------------------------------------------

    entrada:

        entrada
            ? entrada.toISOString()
            : null,

    salida:

        salida
            ? salida.toISOString()
            : null

});
}

    );

};


// =======================================================
// CONVERTIR SEGUNDOS A HH:MM:SS
// =======================================================

const segundosATiempo = (segundos) => {

    const totalSegundos = Math.max(
        0,
        Math.floor(
            Number(segundos) || 0
        )
    );


    const horas = Math.floor(
        totalSegundos / 3600
    );


    const minutos = Math.floor(
        (totalSegundos % 3600) / 60
    );


    const segundosRestantes =
        totalSegundos % 60;


    return (

        String(horas).padStart(2, "0") +
        ":" +
        String(minutos).padStart(2, "0") +
        ":" +
        String(segundosRestantes).padStart(2, "0")

    );

};


// =======================================================
// EXPORTAR FUNCIONES
// =======================================================

module.exports = {

    registrarMovimiento,

    obtenerHistorial,

    obtenerEstadoActual,

    obtenerResumenJornada

};