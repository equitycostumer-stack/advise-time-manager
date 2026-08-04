const movimientosRepository = require("../repositories/movimientosRepository");

const {
    TIPOS,
    ESTADOS,
    TIPOS_INICIO,
    TIPOS_FIN
} = require("../constants/movimientos");

class MovimientosService {

// ======================================================
// REGISTRAR MOVIMIENTO
// ======================================================

async registrarMovimiento(datos) {

    const {
        asesor_id,
        tipo,
        observacion = null
    } = datos;

    if (!asesor_id) {
        throw new Error("El asesor es obligatorio.");
    }

    if (!tipo) {
        throw new Error("El tipo de movimiento es obligatorio.");
    }

    const tipoMovimiento = String(tipo).toUpperCase();

    const configuracion =
        await movimientosRepository.obtenerConfiguracion();

    if (!configuracion) {
        throw new Error(
            "No existe configuración del sistema."
        );
    }

    const asesor =
        await movimientosRepository.obtenerAsesor(asesor_id);

    if (!asesor) {
        throw new Error(
            "El asesor no existe."
        );
    }

    if (!asesor.activo) {
        throw new Error(
            "El asesor se encuentra inactivo."
        );
    }

    const estadoActual =
        await movimientosRepository.obtenerEstadoActual(
            asesor.id
        );

    // --------------------------------------------------
    // ENTRADA
    // --------------------------------------------------

    if (tipoMovimiento === TIPOS.ENTRADA) {

        return this.registrarEntrada({

            asesor,

            estadoActual,

            observacion,

            configuracion

        });

    }

    // --------------------------------------------------
    // SALIDA
    // --------------------------------------------------

    if (tipoMovimiento === TIPOS.SALIDA) {

        return this.registrarSalida({

            asesor,

            estadoActual,

            observacion

        });

    }

    // --------------------------------------------------
    // INICIO PAUSAS
    // --------------------------------------------------

    if (TIPOS_INICIO.includes(tipoMovimiento)) {

        const estadoDestino = {

            [TIPOS.BREAK_INICIO]:
                ESTADOS.BREAK,

            [TIPOS.ALMUERZO_INICIO]:
                ESTADOS.ALMUERZO,

            [TIPOS.BANO_INICIO]:
                ESTADOS.BANO,

            [TIPOS.CAPACITACION_INICIO]:
                ESTADOS.CAPACITACION,

            [TIPOS.REUNION_INICIO]:
                ESTADOS.REUNION

        };

        return this.registrarInicioPausa({

            asesor,

            estadoActual,

            observacion,

            tipo: tipoMovimiento,

            estado: estadoDestino[tipoMovimiento]

        });

    }

    // --------------------------------------------------
    // FIN PAUSAS
    // --------------------------------------------------

    if (TIPOS_FIN.includes(tipoMovimiento)) {

        const estadoOrigen = {

            [TIPOS.BREAK_FIN]:
                ESTADOS.BREAK,

            [TIPOS.ALMUERZO_FIN]:
                ESTADOS.ALMUERZO,

            [TIPOS.BANO_FIN]:
                ESTADOS.BANO,

            [TIPOS.CAPACITACION_FIN]:
                ESTADOS.CAPACITACION,

            [TIPOS.REUNION_FIN]:
                ESTADOS.REUNION

        };

        return this.registrarFinPausa({

            asesor,

            estadoActual,

            observacion,

            tipo: tipoMovimiento,

            estado: estadoOrigen[tipoMovimiento]

        });

    }

    throw new Error("Movimiento no soportado.");

}

    // ======================================================
// REGISTRAR ENTRADA
// ======================================================

async registrarEntrada({

    asesor,

    estadoActual,

    observacion = null

}) {

    // --------------------------------------------------
    // VALIDAR QUE NO EXISTA UNA JORNADA ACTIVA
    // --------------------------------------------------

    if (

        estadoActual &&

        estadoActual.estado !== ESTADOS.SALIDA

    ) {

        throw new Error(
            "El asesor ya tiene una jornada activa."
        );

    }

    // --------------------------------------------------
    // FECHA ACTUAL
    // --------------------------------------------------

    const ahora = new Date();

    // --------------------------------------------------
    // REGISTRAR MOVIMIENTO
    // --------------------------------------------------

    await movimientosRepository.insertarMovimiento(

        asesor.id,

        TIPOS.ENTRADA,

        ahora,

        observacion

    );

    // --------------------------------------------------
    // CREAR O ACTUALIZAR ESTADO
    // --------------------------------------------------

    if (!estadoActual) {

        await movimientosRepository.crearEstadoActual(

            asesor.id,

            ESTADOS.TRABAJANDO,

            ahora

        );

    } else {

        await movimientosRepository.actualizarEstadoActual(

            asesor.id,

            ESTADOS.TRABAJANDO,

            ahora

        );

    }

    // --------------------------------------------------
    // RECALCULAR RESUMEN
    // --------------------------------------------------

    await this.actualizarResumenJornada(

        asesor.id

    );

    // --------------------------------------------------
    // OBTENER RESUMEN ACTUALIZADO
    // --------------------------------------------------

    const resumen =

        await this.obtenerResumenJornada(

            asesor.id

        );

    // --------------------------------------------------
    // RESPUESTA
    // --------------------------------------------------

    return {

        ok: true,

        movimiento: TIPOS.ENTRADA,

        estado: ESTADOS.TRABAJANDO,

        asesor: {

            id: asesor.id,

            nombre: asesor.nombre

        },

        fecha: ahora,

        resumen,

        mensaje: "Entrada registrada correctamente."

    };

}

    // ======================================================
// REGISTRAR SALIDA
// ======================================================

async registrarSalida({

    asesor,

    estadoActual,

    observacion = null

}) {

    // --------------------------------------------------
    // VALIDAR JORNADA ACTIVA
    // --------------------------------------------------

    if (

        !estadoActual ||

        estadoActual.estado === ESTADOS.SALIDA

    ) {

        throw new Error(
            "El asesor no tiene una jornada activa."
        );

    }

    // --------------------------------------------------
    // VALIDAR QUE NO EXISTA UNA PAUSA ACTIVA
    // --------------------------------------------------

    const pausasActivas = [

        ESTADOS.BREAK,

        ESTADOS.ALMUERZO,

        ESTADOS.BANO,

        ESTADOS.CAPACITACION,

        ESTADOS.REUNION

    ];

    if (

        pausasActivas.includes(

            estadoActual.estado

        )

    ) {

        throw new Error(
            "Debe finalizar la pausa antes de registrar la salida."
        );

    }

    // --------------------------------------------------
    // FECHA ACTUAL
    // --------------------------------------------------

    const ahora = new Date();

    // --------------------------------------------------
    // REGISTRAR MOVIMIENTO
    // --------------------------------------------------

    await movimientosRepository.insertarMovimiento(

        asesor.id,

        TIPOS.SALIDA,

        ahora,

        observacion

    );

    // --------------------------------------------------
    // ACTUALIZAR ESTADO
    // --------------------------------------------------

    await movimientosRepository.actualizarEstadoActual(

        asesor.id,

        ESTADOS.SALIDA,

        ahora

    );

    // --------------------------------------------------
    // ACTUALIZAR RESUMEN
    // --------------------------------------------------

    await this.actualizarResumenJornada(

        asesor.id

    );

    // --------------------------------------------------
    // OBTENER RESUMEN
    // --------------------------------------------------

    const resumen =

        await this.obtenerResumenJornada(

            asesor.id

        );

    // --------------------------------------------------
    // RESPUESTA
    // --------------------------------------------------

    return {

        ok: true,

        movimiento: TIPOS.SALIDA,

        estado: ESTADOS.SALIDA,

        asesor: {

            id: asesor.id,

            nombre: asesor.nombre

        },

        fecha: ahora,

        resumen,

        mensaje: "Salida registrada correctamente."

    };

}

    // ======================================================
// REGISTRAR INICIO PAUSA
// ======================================================

async registrarInicioPausa({

    asesor,

    estadoActual,

    observacion = null,

    tipo,

    estado

}) {

    // --------------------------------------------------
    // VALIDAR JORNADA
    // --------------------------------------------------

    if (

        !estadoActual ||

        estadoActual.estado === ESTADOS.SALIDA

    ) {

        throw new Error(
            "El asesor no tiene una jornada activa."
        );

    }

    // --------------------------------------------------
    // SOLO DESDE TRABAJANDO
    // --------------------------------------------------

    if (

        estadoActual.estado !== ESTADOS.TRABAJANDO

    ) {

        throw new Error(

            `No puede iniciar ${estado} porque actualmente está en ${estadoActual.estado}.`

        );

    }

    // --------------------------------------------------
    // FECHA
    // --------------------------------------------------

    const ahora = new Date();

    // --------------------------------------------------
    // MOVIMIENTO
    // --------------------------------------------------

    await movimientosRepository.insertarMovimiento(

        asesor.id,

        tipo,

        ahora,

        observacion

    );

    // --------------------------------------------------
    // ESTADO
    // --------------------------------------------------

    await movimientosRepository.actualizarEstadoActual(

        asesor.id,

        estado,

        ahora

    );

    // --------------------------------------------------
    // RESUMEN
    // --------------------------------------------------

    await this.actualizarResumenJornada(

        asesor.id

    );

    const resumen =

        await this.obtenerResumenJornada(

            asesor.id

        );

    // --------------------------------------------------
    // RESPUESTA
    // --------------------------------------------------

    return {

        ok: true,

        movimiento: tipo,

        estado,

        asesor: {

            id: asesor.id,

            nombre: asesor.nombre

        },

        fecha: ahora,

        resumen,

        mensaje: `${estado} iniciado correctamente.`

    };

}

    // ======================================================
// REGISTRAR FIN PAUSA
// ======================================================

async registrarFinPausa({

    asesor,

    estadoActual,

    observacion = null,

    tipo,

    estado

}) {

    // --------------------------------------------------
    // VALIDAR JORNADA
    // --------------------------------------------------

    if (

        !estadoActual ||

        estadoActual.estado === ESTADOS.SALIDA

    ) {

        throw new Error(
            "El asesor no tiene una jornada activa."
        );

    }

    // --------------------------------------------------
    // VALIDAR PAUSA ACTIVA
    // --------------------------------------------------

    if (

        estadoActual.estado !== estado

    ) {

        throw new Error(

            "No existe una pausa activa de este tipo."

        );

    }

    // --------------------------------------------------
    // FECHA
    // --------------------------------------------------

    const ahora = new Date();

    // --------------------------------------------------
    // REGISTRAR MOVIMIENTO
    // --------------------------------------------------

    await movimientosRepository.insertarMovimiento(

        asesor.id,

        tipo,

        ahora,

        observacion

    );

    // --------------------------------------------------
    // VOLVER A TRABAJANDO
    // --------------------------------------------------

    await movimientosRepository.actualizarEstadoActual(

        asesor.id,

        ESTADOS.TRABAJANDO,

        ahora

    );

    // --------------------------------------------------
    // ACTUALIZAR RESUMEN
    // --------------------------------------------------

    await this.actualizarResumenJornada(

        asesor.id

    );

    const resumen =

        await this.obtenerResumenJornada(

            asesor.id

        );

    // --------------------------------------------------
    // RESPUESTA
    // --------------------------------------------------

    return {

        ok: true,

        movimiento: tipo,

        estado: ESTADOS.TRABAJANDO,

        asesor: {

            id: asesor.id,

            nombre: asesor.nombre

        },

        fecha: ahora,

        resumen,

        mensaje: `${estado} finalizado correctamente.`

    };

}

    // ======================================================
// BREAK
// ======================================================

async registrarInicioBreak(datos) {

    return this.registrarInicioPausa({

        ...datos,

        tipo: TIPOS.BREAK_INICIO,

        estado: ESTADOS.BREAK

    });

}

async registrarFinBreak(datos) {

    return this.registrarFinPausa({

        ...datos,

        tipo: TIPOS.BREAK_FIN,

        estado: ESTADOS.BREAK

    });

}

// ======================================================
// ALMUERZO
// ======================================================

async registrarInicioAlmuerzo(datos) {

    return this.registrarInicioPausa({

        ...datos,

        tipo: TIPOS.ALMUERZO_INICIO,

        estado: ESTADOS.ALMUERZO

    });

}

async registrarFinAlmuerzo(datos) {

    return this.registrarFinPausa({

        ...datos,

        tipo: TIPOS.ALMUERZO_FIN,

        estado: ESTADOS.ALMUERZO

    });

}

// ======================================================
// BAÑO
// ======================================================

async registrarInicioBano(datos) {

    return this.registrarInicioPausa({

        ...datos,

        tipo: TIPOS.BANO_INICIO,

        estado: ESTADOS.BANO

    });

}

async registrarFinBano(datos) {

    return this.registrarFinPausa({

        ...datos,

        tipo: TIPOS.BANO_FIN,

        estado: ESTADOS.BANO

    });

}

// ======================================================
// CAPACITACIÓN
// ======================================================

async registrarInicioCapacitacion(datos) {

    return this.registrarInicioPausa({

        ...datos,

        tipo: TIPOS.CAPACITACION_INICIO,

        estado: ESTADOS.CAPACITACION

    });

}

async registrarFinCapacitacion(datos) {

    return this.registrarFinPausa({

        ...datos,

        tipo: TIPOS.CAPACITACION_FIN,

        estado: ESTADOS.CAPACITACION

    });

}

// ======================================================
// REUNIÓN
// ======================================================

async registrarInicioReunion(datos) {

    return this.registrarInicioPausa({

        ...datos,

        tipo: TIPOS.REUNION_INICIO,

        estado: ESTADOS.REUNION

    });

}

async registrarFinReunion(datos) {

    return this.registrarFinPausa({

        ...datos,

        tipo: TIPOS.REUNION_FIN,

        estado: ESTADOS.REUNION

    });

}

    // ======================================================
    // CONSULTAS
    // ======================================================

// ======================================================
// OBTENER ESTADO ACTUAL
// ======================================================

async obtenerEstadoActual(asesorId) {

    const asesor =

        await movimientosRepository.obtenerAsesor(

            asesorId

        );

    if (!asesor) {

        throw new Error(
            "Asesor no encontrado."
        );

    }

    const estado =

        await movimientosRepository.obtenerEstadoActual(

            asesorId

        );

    return {

        ok: true,

        data: {

            asesor: {

                id: asesor.id,

                nombre: asesor.nombre

            },

            estado

        }

    };

}

    // ======================================================
// OBTENER HISTORIAL
// ======================================================

async obtenerHistorial(asesorId) {

    const asesor =

        await movimientosRepository.obtenerAsesor(

            asesorId

        );

    if (!asesor) {

        throw new Error(
            "Asesor no encontrado."
        );

    }

    const historial =

        await movimientosRepository.obtenerMovimientosDelDia(

            asesorId

        );

    return {

        ok: true,

        data: {

            asesor: {

                id: asesor.id,

                nombre: asesor.nombre

            },

            total: historial.length,

            movimientos: historial

        }

    };

}

    // ======================================================
// OBTENER RESUMEN JORNADA
// ======================================================

async obtenerResumenJornada(asesorId) {

    const asesor =

        await movimientosRepository.obtenerAsesor(

            asesorId

        );

    if (!asesor) {

        throw new Error(
            "Asesor no encontrado."
        );

    }

    let resumen =

        await movimientosRepository.obtenerResumenDia(

            asesorId

        );

    if (!resumen) {

        await this.actualizarResumenJornada(

            asesorId

        );

        resumen =

            await movimientosRepository.obtenerResumenDia(

                asesorId

            );

    }

    return {

        ok: true,

        data: {

            asesor: {

                id: asesor.id,

                nombre: asesor.nombre

            },

            resumen

        }

    };

}

    // ======================================================
// ACTUALIZAR RESUMEN JORNADA
// ======================================================

async actualizarResumenJornada(asesorId) {

    const movimientos =
        await movimientosRepository.obtenerMovimientosDelDia(
            asesorId
        );

    if (!movimientos.length) {

        return null;

    }

    let entrada = null;
    let salida = null;

    let tiempoBreak = 0;
    let tiempoAlmuerzo = 0;
    let tiempoBano = 0;
    let tiempoCapacitacion = 0;
    let tiempoReunion = 0;

    let inicioBreak = null;
    let inicioAlmuerzo = null;
    let inicioBano = null;
    let inicioCapacitacion = null;
    let inicioReunion = null;

    for (const mov of movimientos) {

        switch (mov.tipo) {

            case TIPOS.ENTRADA:

                if (!entrada)
                    entrada = mov.fecha_hora;

                break;

            case TIPOS.SALIDA:

                salida = mov.fecha_hora;

                break;

            case TIPOS.BREAK_INICIO:

                inicioBreak = mov.fecha_hora;

                break;

            case TIPOS.BREAK_FIN:

                if (inicioBreak) {

                    tiempoBreak +=
                        new Date(mov.fecha_hora) -
                        new Date(inicioBreak);

                    inicioBreak = null;

                }

                break;

            case TIPOS.ALMUERZO_INICIO:

                inicioAlmuerzo = mov.fecha_hora;

                break;

            case TIPOS.ALMUERZO_FIN:

                if (inicioAlmuerzo) {

                    tiempoAlmuerzo +=
                        new Date(mov.fecha_hora) -
                        new Date(inicioAlmuerzo);

                    inicioAlmuerzo = null;

                }

                break;

            case TIPOS.BANO_INICIO:

                inicioBano = mov.fecha_hora;

                break;

            case TIPOS.BANO_FIN:

                if (inicioBano) {

                    tiempoBano +=
                        new Date(mov.fecha_hora) -
                        new Date(inicioBano);

                    inicioBano = null;

                }

                break;

            case TIPOS.CAPACITACION_INICIO:

                inicioCapacitacion = mov.fecha_hora;

                break;

            case TIPOS.CAPACITACION_FIN:

                if (inicioCapacitacion) {

                    tiempoCapacitacion +=
                        new Date(mov.fecha_hora) -
                        new Date(inicioCapacitacion);

                    inicioCapacitacion = null;

                }

                break;

            case TIPOS.REUNION_INICIO:

                inicioReunion = mov.fecha_hora;

                break;

            case TIPOS.REUNION_FIN:

                if (inicioReunion) {

                    tiempoReunion +=
                        new Date(mov.fecha_hora) -
                        new Date(inicioReunion);

                    inicioReunion = null;

                }

            break;
        }

    }

const fin = salida || new Date();

    const tiempoTrabajado = entrada
        ? new Date(fin) - new Date(entrada)
        : 0;

    const tiempoProductivo =
        tiempoTrabajado -
        tiempoBreak -
        tiempoAlmuerzo -
        tiempoBano -
        tiempoCapacitacion -
        tiempoReunion;

    const horaLimite = new Date(entrada);

    if (entrada) {

        horaLimite.setHours(8);
        horaLimite.setMinutes(5);
        horaLimite.setSeconds(0);
        horaLimite.setMilliseconds(0);

    }

    const llegoTarde =
        entrada
            ? new Date(entrada) > horaLimite
            : false;

    const minutosRetraso =
        llegoTarde
            ? Math.floor(
                (new Date(entrada) - horaLimite) / 60000
            )
            : 0;
// ======================================================
// CALCULAR TIEMPO PRODUCTIVO
// ======================================================

    const datos = {

        asesor_id: asesorId,

        fecha: entrada
            ? new Date(entrada).toISOString().slice(0, 10)
            : new Date().toISOString().slice(0, 10),

        hora_entrada: entrada,

        hora_salida: salida,

        tiempo_trabajado: tiempoTrabajado,

        tiempo_break: tiempoBreak,

        tiempo_almuerzo: tiempoAlmuerzo,

        tiempo_bano: tiempoBano,

        tiempo_capacitacion: tiempoCapacitacion,

        tiempo_reunion: tiempoReunion,

        tiempo_productivo: tiempoProductivo,

        llego_tarde: llegoTarde,

        minutos_retraso: minutosRetraso

    };
    const resumenExistente =
    await movimientosRepository.obtenerResumenDia(
        asesorId
    );

// ======================================================
// SI YA EXISTE UN RESUMEN CERRADO,
// CREAR UNA NUEVA JORNADA
// ======================================================

if (resumenExistente && resumenExistente.hora_salida) {

    await movimientosRepository.crearResumenDia(
        datos
    );

} else if (resumenExistente) {

    await movimientosRepository.actualizarResumenDia(

        resumenExistente.id,

        datos

    );

} else {

    await movimientosRepository.crearResumenDia(

        datos

    );

}

return await movimientosRepository.obtenerResumenDia(

    asesorId

);

}

}

module.exports = new MovimientosService();