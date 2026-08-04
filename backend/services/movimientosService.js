// ======================================================
// EQUITY LINE PROFESSIONAL SERVICES
// TIME MANAGER
// SERVICIO PRINCIPAL DE MOVIMIENTOS
// ======================================================

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

        // --------------------------------------------------
        // EXTRAER DATOS
        // --------------------------------------------------

        const {
            asesor_id,
            tipo,
            observacion = null
        } = datos;

        // --------------------------------------------------
        // VALIDACIONES
        // --------------------------------------------------

        if (!asesor_id) {

            throw new Error(
                "Debe indicar el asesor."
            );

        }

        if (!tipo) {

            throw new Error(
                "Debe indicar el tipo de movimiento."
            );

        }

        // --------------------------------------------------
        // NORMALIZAR MOVIMIENTO
        // --------------------------------------------------

        const tipoMovimiento = String(tipo)
            .trim()
            .toUpperCase();

        // --------------------------------------------------
        // VALIDAR TIPO
        // --------------------------------------------------

        if (!Object.values(TIPOS).includes(tipoMovimiento)) {

            throw new Error(
                `El movimiento "${tipoMovimiento}" no existe.`
            );

        }

        // --------------------------------------------------
        // OBTENER CONFIGURACIÓN
        // --------------------------------------------------

        const configuracion =
            await movimientosRepository.obtenerConfiguracion();

        if (!configuracion) {

            throw new Error(
                "No existe configuración del sistema."
            );

        }

        // --------------------------------------------------
        // OBTENER ASESOR
        // --------------------------------------------------

        const asesor =
            await movimientosRepository.obtenerAsesor(
                asesor_id
            );

        if (!asesor) {

            throw new Error(
                "El asesor no existe."
            );

        }

        if (!Number(asesor.activo)) {

            throw new Error(
                "El asesor se encuentra inactivo."
            );

        }

        // --------------------------------------------------
        // OBTENER ESTADO ACTUAL
        // --------------------------------------------------

        const estadoActual =
            await movimientosRepository.obtenerEstadoActual(
                asesor_id
            );

        // --------------------------------------------------
        // ENTRADA
        // --------------------------------------------------

        if (tipoMovimiento === TIPOS.ENTRADA) {

            return await this.registrarEntrada({

                asesor,

                configuracion,

                estadoActual,

                observacion

            });

        }

        // --------------------------------------------------
        // SALIDA
        // --------------------------------------------------

        if (tipoMovimiento === TIPOS.SALIDA) {

            return await this.registrarSalida({

                asesor,

                configuracion,

                estadoActual,

                observacion

            });

        }

        // --------------------------------------------------
        // INICIO DE PAUSAS
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

            return await this.registrarInicioPausa({

                asesor,

                estadoActual,

                observacion,

                tipo: tipoMovimiento,

                estado: estadoDestino[tipoMovimiento]

            });

        }

        // --------------------------------------------------
        // FIN DE PAUSAS
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

            return await this.registrarFinPausa({

                asesor,

                estadoActual,

                observacion,

                tipo: tipoMovimiento,

                estado: estadoOrigen[tipoMovimiento]

            });

        }

        // --------------------------------------------------
        // MOVIMIENTO NO SOPORTADO
        // --------------------------------------------------

        throw new Error(
            `Movimiento no soportado: ${tipoMovimiento}`
        );

    }
// --------------------------------------------------
        // MOVIMIENTO NO SOPORTADO
        // --------------------------------------------------

        throw new Error(
            `Movimiento no soportado: ${tipoMovimiento}`
        );

    }

    // ======================================================
    // REGISTRAR ENTRADA
    // ======================================================

    async registrarEntrada({

        asesor,

        configuracion,

        estadoActual,

        observacion

    }) {

        // --------------------------------------------------
        // VALIDAR JORNADA ACTIVA
        // --------------------------------------------------

        if (

            estadoActual &&

            estadoActual.estado !== ESTADOS.SALIDA

        ) {

            throw new Error(
                "El asesor ya tiene una jornada iniciada."
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
        // ACTUALIZAR RESUMEN
        // --------------------------------------------------

        await this.actualizarResumenJornada(
            asesor.id
        );

        // --------------------------------------------------
        // RESPUESTA
        // --------------------------------------------------

        return {

            ok: true,

            movimiento: TIPOS.ENTRADA,

            estado: ESTADOS.TRABAJANDO,

            asesor: asesor.nombre,

            fecha: ahora,

            mensaje: "Entrada registrada correctamente."

        };

    }

    // ======================================================
    // REGISTRAR SALIDA
    // ======================================================

    async registrarSalida({

        asesor,

        configuracion,

        estadoActual,

        observacion

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
        // NO PERMITIR SALIDA EN PAUSAS
        // --------------------------------------------------

        if (

            estadoActual.estado === ESTADOS.BREAK ||

            estadoActual.estado === ESTADOS.ALMUERZO ||

            estadoActual.estado === ESTADOS.BANO ||

            estadoActual.estado === ESTADOS.CAPACITACION ||

            estadoActual.estado === ESTADOS.REUNION

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

            asesor: asesor.nombre,

            fecha: ahora,

            resumen,

            mensaje: "Salida registrada correctamente."

        };

    }

// ==================================================
// MOVIMIENTO NO SOPORTADO
// ==================================================

        throw new Error(
            `Movimiento no soportado: ${tipoMovimiento}`
        );

    }

    // ======================================================
    // REGISTRAR ENTRADA
    // ======================================================

    async registrarEntrada({

        asesor,
        configuracion,
        estadoActual,
        observacion

    }) {

        // --------------------------------------------------
        // VALIDAR JORNADA ACTIVA
        // --------------------------------------------------

        if (

            estadoActual &&
            estadoActual.estado !== ESTADOS.SALIDA

        ) {

            throw new Error(
                "El asesor ya tiene una jornada iniciada."
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
        // CREAR / ACTUALIZAR ESTADO
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
    // RECALCULAR RESUMEN DE JORNADA
    // --------------------------------------------------

    await this.actualizarResumenJornada(
        asesor.id
    );

    // --------------------------------------------------
    // RESPUESTA
    // --------------------------------------------------

    return {

        ok: true,

        movimiento: TIPOS.ENTRADA,

        estado: ESTADOS.TRABAJANDO,

        asesor: asesor.nombre,

        fecha: ahora,

        mensaje: "Entrada registrada correctamente."

    };

}

// ======================================================
// REGISTRAR SALIDA
// ======================================================

async registrarSalida({

    asesor,
    configuracion,
    estadoActual,
    observacion

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
    // NO PERMITIR SALIDA DURANTE UNA PAUSA
    // --------------------------------------------------

    if (

        estadoActual.estado === ESTADOS.BREAK ||

        estadoActual.estado === ESTADOS.ALMUERZO ||

        estadoActual.estado === ESTADOS.BANO ||

        estadoActual.estado === ESTADOS.CAPACITACION ||

        estadoActual.estado === ESTADOS.REUNION

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
    // RECALCULAR RESUMEN
    // --------------------------------------------------

    await this.actualizarResumenJornada(
        asesor.id
    );

    // --------------------------------------------------
    // OBTENER RESUMEN ACTUALIZADO
    // --------------------------------------------------

    const resumen = await this.obtenerResumenJornada(
    asesor.id
);

    // --------------------------------------------------
    // RESPUESTA
    // --------------------------------------------------

    return {

        ok: true,

        movimiento: TIPOS.SALIDA,

        estado: ESTADOS.SALIDA,

        asesor: asesor.nombre,

        fecha: ahora,

        resumen,

        mensaje: "Salida registrada correctamente."

    };

}

    // ======================================================
    // BREAK
    // ======================================================

    async registrarInicioBreak(datos) {

        return await this.registrarInicioPausa({

            ...datos,

            tipo: TIPOS.BREAK_INICIO,

            estado: ESTADOS.BREAK

        });

    }

    // ======================================================
    // FIN BREAK
    // ======================================================

    async registrarFinBreak(datos) {

        return await this.registrarFinPausa({

            ...datos,

            tipo: TIPOS.BREAK_FIN,

            estado: ESTADOS.BREAK

        });

    }

// ======================================================
// ALMUERZO
// ======================================================

async registrarInicioAlmuerzo(datos) {

    return await this.registrarInicioPausa({

        ...datos,

        tipo: TIPOS.ALMUERZO_INICIO,

        estado: ESTADOS.ALMUERZO

    });

}

async registrarFinAlmuerzo(datos) {

    return await this.registrarFinPausa({

        ...datos,

        tipo: TIPOS.ALMUERZO_FIN,

        estado: ESTADOS.ALMUERZO

    });

}

// ======================================================
// BAÑO
// ======================================================

async registrarInicioBano(datos) {

    return await this.registrarInicioPausa({

        ...datos,

        tipo: TIPOS.BANO_INICIO,

        estado: ESTADOS.BANO

    });

}
// ======================================================
    // FIN BAÑO
    // ======================================================

    async registrarFinBano(datos) {

        return await this.registrarFinPausa({

            ...datos,

            tipo: TIPOS.BANO_FIN,

            estado: ESTADOS.BANO

        });

    }

    // ======================================================
    // CAPACITACIÓN
    // ======================================================

    async registrarInicioCapacitacion(datos) {

        return await this.registrarInicioPausa({

            ...datos,

            tipo: TIPOS.CAPACITACION_INICIO,

            estado: ESTADOS.CAPACITACION

        });

    }

    async registrarFinCapacitacion(datos) {

        return await this.registrarFinPausa({

            ...datos,

            tipo: TIPOS.CAPACITACION_FIN,

            estado: ESTADOS.CAPACITACION

        });

    }

    // ======================================================
    // REUNIÓN
    // ======================================================

    async registrarInicioReunion(datos) {

        return await this.registrarInicioPausa({

            ...datos,

            tipo: TIPOS.REUNION_INICIO,

            estado: ESTADOS.REUNION

        });

    }

    async registrarFinReunion(datos) {

        return await this.registrarFinPausa({

            ...datos,

            tipo: TIPOS.REUNION_FIN,

            estado: ESTADOS.REUNION

        });

    }

// ======================================================
    // MÉTODOS GENÉRICOS
    // ======================================================

    async registrarInicioPausa({

        asesor,

        estadoActual,

        observacion,

        tipo,

        estado

    }) {

        // --------------------------------------------
        // Debe tener jornada iniciada
        // --------------------------------------------

        if (

            !estadoActual ||

            estadoActual.estado === ESTADOS.SALIDA

        ) {

            throw new Error(
                "El asesor no tiene una jornada activa."
            );

        }

        // --------------------------------------------
        // Solo puede iniciar pausas si está trabajando
        // --------------------------------------------

        if (

            estadoActual.estado !== ESTADOS.TRABAJANDO

        ) {

            throw new Error(

                `No puede iniciar ${estado} porque actualmente está en ${estadoActual.estado}.`

            );

        }

        // --------------------------------------------
        // Fecha actual
        // --------------------------------------------

        const ahora = new Date();

        // --------------------------------------------
        // Registrar movimiento
        // --------------------------------------------

        await movimientosRepository.insertarMovimiento(

            asesor.id,

            tipo,

            ahora,

            observacion

        );

        // --------------------------------------------
        // Actualizar estado actual
        // --------------------------------------------

        await movimientosRepository.actualizarEstadoActual(

            asesor.id,

            estado,

            ahora

        );

        // --------------------------------------------
        // Actualizar resumen
        // --------------------------------------------

        await this.actualizarResumenJornada(

            asesor.id

        );

        // --------------------------------------------
        // Respuesta
        // --------------------------------------------

        return {

            ok: true,

            movimiento: tipo,

            estado,

            asesor: asesor.nombre,

            fecha: ahora,

            mensaje: `${estado} iniciado correctamente.`

        };

    }

    // ======================================================
    // FINALIZAR PAUSA
    // ======================================================

    async registrarFinPausa({

        asesor,

        estadoActual,

        observacion,

        tipo,

        estado

    }) {

        // --------------------------------------------
        // Validar jornada activa
        // --------------------------------------------

        if (

            !estadoActual ||

            estadoActual.estado === ESTADOS.SALIDA

        ) {

            throw new Error(
                "El asesor no tiene una jornada activa."
            );

        }

        // --------------------------------------------
        // Validar que la pausa exista
        // --------------------------------------------

        if (

            estadoActual.estado !== estado

        ) {

            throw new Error(
                "No existe una pausa activa de este tipo."
            );

        }

        // --------------------------------------------
        // Fecha actual
        // --------------------------------------------

        const ahora = new Date();

        // --------------------------------------------
        // Registrar movimiento
        // --------------------------------------------

        await movimientosRepository.insertarMovimiento(

            asesor.id,

            tipo,

            ahora,

            observacion

        );

        // --------------------------------------------
        // Actualizar estado
        // --------------------------------------------

        await movimientosRepository.actualizarEstadoActual(

            asesor.id,

            ESTADOS.TRABAJANDO,

            ahora

        );

        // --------------------------------------------
        // Actualizar resumen de jornada
        // --------------------------------------------

        await this.actualizarResumenJornada(

            asesor.id

        );

        // --------------------------------------------
        // Respuesta
        // --------------------------------------------

        return {

            ok: true,

            movimiento: tipo,

            estado: ESTADOS.TRABAJANDO,

            asesor: asesor.nombre,

            fecha: ahora,

            mensaje: `${estado} finalizado correctamente.`

        };

    }

    // ======================================================
    // OBTENER ESTADO ACTUAL
    // ======================================================

    async obtenerEstadoActual(asesorId) {

        if (!asesorId) {

            throw new Error(
                "Debe indicar un asesor."
            );

        }

        const asesor =
            await movimientosRepository.obtenerAsesor(
                asesorId
            );

        if (!asesor) {

            throw new Error(
                "El asesor no existe."
            );

        }

        const estado =
            await movimientosRepository.obtenerEstadoActual(
                asesorId
            );

        return {

            asesor,

            estado: estado || {

                estado: ESTADOS.SALIDA,

                inicio_estado: null,

                inicio_jornada: null,

                ultima_actualizacion: null

            }

        };

    }

    // ======================================================
    // OBTENER HISTORIAL
    // ======================================================

    async obtenerHistorial(asesorId) {

        if (!asesorId) {

            throw new Error(
                "Debe indicar un asesor."
            );

        }

        const asesor =
            await movimientosRepository.obtenerAsesor(
                asesorId
            );

        if (!asesor) {

            throw new Error(
                "El asesor no existe."
            );

        }

        const movimientos =
            await movimientosRepository.obtenerMovimientosDelDia(
                asesorId
            );

        return {

            asesor: {

                id: asesor.id,

                nombre: asesor.nombre

            },

            total: movimientos.length,

            movimientos

        };

    }

    // ======================================================
    // OBTENER RESUMEN DE JORNADA
    // ======================================================

    async obtenerResumenJornada(asesorId) {

        if (!asesorId) {

            throw new Error(
                "Debe indicar un asesor."
            );

        }

        const asesor =
            await movimientosRepository.obtenerAsesor(
                asesorId
            );

        if (!asesor) {

            throw new Error(
                "El asesor no existe."
            );

        }

        const movimientos =
            await movimientosRepository.obtenerMovimientosDelDia(
                asesorId
            );

        const estado =
            await movimientosRepository.obtenerEstadoActual(
                asesorId
            );

        const entrada =
            movimientos.find(

                movimiento =>
                    movimiento.tipo === TIPOS.ENTRADA

            );

        const salida =
            [...movimientos]

                .reverse()

                .find(

                    movimiento =>
                        movimiento.tipo === TIPOS.SALIDA

                );

        return {

            asesor: {

                id: asesor.id,

                nombre: asesor.nombre

            },

            jornada: {

                iniciada: Boolean(entrada),

                finalizada: Boolean(salida),

                estado:

                    estado

                        ? estado.estado

                        : ESTADOS.SALIDA

            },

            entrada,

            salida,

            movimientos

        };

    }

    // ======================================================
    // RECALCULAR RESUMEN DEL DÍA
    // ======================================================

    async actualizarResumenJornada(asesorId) {

        const movimientos =
            await movimientosRepository.obtenerMovimientosDelDia(
                asesorId
            );

        if (!movimientos || movimientos.length === 0) {

            return;

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

        // ==================================================
        // RECORRER TODOS LOS MOVIMIENTOS
        // ==================================================

        for (const movimiento of movimientos) {

            const fechaMovimiento =
                new Date(movimiento.fecha_hora);

            switch (movimiento.tipo) {

                case TIPOS.ENTRADA:

                    if (!entrada) {

                        entrada = fechaMovimiento;

                    }

                    break;

                case TIPOS.SALIDA:

                    salida = fechaMovimiento;

                    break;

                case TIPOS.BREAK_INICIO:

                    inicioBreak = fechaMovimiento;

                    break;

                case TIPOS.BREAK_FIN:

                    if (inicioBreak) {

                        tiempoBreak +=
                            (fechaMovimiento - inicioBreak) / 1000;

                        inicioBreak = null;

                    }

                    break;

                case TIPOS.ALMUERZO_INICIO:

                    inicioAlmuerzo = fechaMovimiento;

                    break;

                case TIPOS.ALMUERZO_FIN:

                    if (inicioAlmuerzo) {

                        tiempoAlmuerzo +=
                            (fechaMovimiento - inicioAlmuerzo) / 1000;

                        inicioAlmuerzo = null;

                    }

                    break;

                case TIPOS.BANO_INICIO:

                    inicioBano = fechaMovimiento;

                    break;

                case TIPOS.BANO_FIN:

                    if (inicioBano) {

                        tiempoBano +=
                            (fechaMovimiento - inicioBano) / 1000;

                        inicioBano = null;

                    }

                    break;

                case TIPOS.CAPACITACION_INICIO:

                    inicioCapacitacion = fechaMovimiento;

                    break;

                case TIPOS.CAPACITACION_FIN:

                    if (inicioCapacitacion) {

                        tiempoCapacitacion +=
                            (fechaMovimiento - inicioCapacitacion) / 1000;

                        inicioCapacitacion = null;

                    }

                    break;

                case TIPOS.REUNION_INICIO:

                    inicioReunion = fechaMovimiento;

                    break;

                case TIPOS.REUNION_FIN:

                    if (inicioReunion) {

                        tiempoReunion +=
                            (fechaMovimiento - inicioReunion) / 1000;

                        inicioReunion = null;

                    }

                    break;

            }

        }

        // ==================================================
        // SI LA JORNADA NO HA TERMINADO
        // ==================================================

        if (entrada && !salida) {

            salida = new Date();

        }

        let tiempoTrabajado = 0;

        if (entrada && salida) {

            tiempoTrabajado =
                (salida - entrada) / 1000;

        }

        const tiempoProductivo = Math.max(

            0,

            tiempoTrabajado
            - tiempoBreak
            - tiempoAlmuerzo
            - tiempoBano
            - tiempoCapacitacion
            - tiempoReunion

        );

        // ==================================================
        // DATOS DEL RESUMEN
        // ==================================================

        const datos = {

            asesor_id: asesorId,

            fecha: new Date(),

            hora_entrada: entrada,

            hora_salida: salida,

            tiempo_trabajado:
                Math.max(
                    0,
                    Math.floor(tiempoTrabajado)
                ),

            tiempo_break:
                Math.floor(tiempoBreak),

            tiempo_almuerzo:
                Math.floor(tiempoAlmuerzo),

            tiempo_bano:
                Math.floor(tiempoBano),

            tiempo_capacitacion:
                Math.floor(tiempoCapacitacion),

            tiempo_reunion:
                Math.floor(tiempoReunion),

            tiempo_productivo:
                Math.floor(tiempoProductivo),

            llego_tarde: 0,

            minutos_retraso: 0

        };

        // ==================================================
        // INSERTAR O ACTUALIZAR
        // ==================================================

        const resumenExistente =
            await movimientosRepository.obtenerResumenDia(
                asesorId
            );

        if (!resumenExistente) {

            await movimientosRepository.crearResumenDia(
                datos
            );

        } else {

            await movimientosRepository.actualizarResumenDia(

                resumenExistente.id,

                datos

            );

        }

    }

}

module.exports = new MovimientosService();