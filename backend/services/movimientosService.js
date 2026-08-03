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
console.log("================================");
console.log("DATOS RECIBIDOS EN EL SERVICE");
console.log(datos);
console.log("tipo:", datos.tipo);
console.log("================================");
        const {
            asesor_id,
            tipo,
            observacion = null
        } = datos;

        // ==================================================
        // VALIDACIONES BÁSICAS
        // ==================================================

        if (!asesor_id) {
            throw new Error("El asesor es obligatorio.");
        }

        if (!tipo) {
            throw new Error("El tipo de movimiento es obligatorio.");
        }

        // ==================================================
        // NORMALIZAR MOVIMIENTO
        // ==================================================

        const tipoMovimiento = String(tipo)
            .trim()
            .toUpperCase();

        // ==================================================
        // VALIDAR TIPO
        // ==================================================

        if (!Object.values(TIPOS).includes(tipoMovimiento)) {

            throw new Error(
                `El movimiento "${tipoMovimiento}" no existe.`
            );

        }

        // ==================================================
        // OBTENER CONFIGURACIÓN
        // ==================================================

        const configuracion =
            await movimientosRepository.obtenerConfiguracion();

        if (!configuracion) {

            throw new Error(
                "No fue posible obtener la configuración del sistema."
            );

        }

        // ==================================================
        // OBTENER ASESOR
        // ==================================================

        const asesor =
            await movimientosRepository.obtenerAsesor(asesor_id);

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

        // ==================================================
        // OBTENER ESTADO ACTUAL
        // ==================================================

        const estadoActual =
            await movimientosRepository.obtenerEstadoActual(
                asesor_id
            );
        // ==================================================
        // DIRECCIONAR MOVIMIENTO
        // ==================================================

        switch (tipoMovimiento) {

            // ----------------------------------------------
            // ENTRADA
            // ----------------------------------------------

            case TIPOS.ENTRADA:

                return await this.registrarEntrada({

                    asesor,
                    configuracion,
                    estadoActual,
                    observacion

                });

            // ----------------------------------------------
            // SALIDA
            // ----------------------------------------------

            case TIPOS.SALIDA:

                return await this.registrarSalida({

                    asesor,
                    configuracion,
                    estadoActual,
                    observacion

                });

        }

        // ==================================================
// INICIO DE PAUSAS
// ==================================================

if (TIPOS_INICIO.includes(tipoMovimiento)) {

    return await this.registrarInicioPausa({

        asesor,
        estadoActual,
        observacion,

        tipo: tipoMovimiento,

        estado:
            tipoMovimiento === TIPOS.BREAK_INICIO
                ? ESTADOS.BREAK
            : tipoMovimiento === TIPOS.ALMUERZO_INICIO
                ? ESTADOS.ALMUERZO
            : tipoMovimiento === TIPOS.BANO_INICIO
                ? ESTADOS.BANO
            : tipoMovimiento === TIPOS.CAPACITACION_INICIO
                ? ESTADOS.CAPACITACION
            : ESTADOS.REUNION

    });

}

// ==================================================
// FIN DE PAUSAS
// ==================================================

if (TIPOS_FIN.includes(tipoMovimiento)) {

    return await this.registrarFinPausa({

        asesor,
        estadoActual,
        observacion,

        tipo: tipoMovimiento,

        estado:
            tipoMovimiento === TIPOS.BREAK_FIN
                ? ESTADOS.BREAK
            : tipoMovimiento === TIPOS.ALMUERZO_FIN
                ? ESTADOS.ALMUERZO
            : tipoMovimiento === TIPOS.BANO_FIN
                ? ESTADOS.BANO
            : tipoMovimiento === TIPOS.CAPACITACION_FIN
                ? ESTADOS.CAPACITACION
            : ESTADOS.REUNION

    });

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
        // REGISTRAR MOVIMIENTO
        // --------------------------------------------------

        await movimientosRepository.insertarMovimiento(
            asesor.id,
            TIPOS.ENTRADA,
            new Date(),
            observacion
        );

        // --------------------------------------------------
        // CREAR / ACTUALIZAR ESTADO
        // --------------------------------------------------

        if (!estadoActual) {

            await movimientosRepository.crearEstadoActual(
                asesor.id,
                ESTADOS.TRABAJANDO,
                new Date()
            );

        } else {

            await movimientosRepository.actualizarEstadoActual(
                asesor.id,
                ESTADOS.TRABAJANDO,
                new Date()
            );

        }

        // --------------------------------------------------
        // RESPUESTA
        // --------------------------------------------------

        return {

            ok: true,

            movimiento: TIPOS.ENTRADA,

            estado: ESTADOS.TRABAJANDO,

            asesor: asesor.nombre,

            fecha: new Date(),

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
        // REGISTRAR MOVIMIENTO
        // --------------------------------------------------

        await movimientosRepository.insertarMovimiento(
            asesor.id,
            TIPOS.SALIDA,
            new Date(),
            observacion
        );

        // --------------------------------------------------
        // ACTUALIZAR ESTADO
        // --------------------------------------------------

        await movimientosRepository.actualizarEstadoActual(
            asesor.id,
            ESTADOS.SALIDA,
            new Date()
        );

        // --------------------------------------------------
        // RESPUESTA
        // --------------------------------------------------

        return {

            ok: true,

            movimiento: TIPOS.SALIDA,

            estado: ESTADOS.SALIDA,

            asesor: asesor.nombre,

            fecha: new Date(),

            mensaje: "Salida registrada correctamente."

        };

    }
// ======================================================
    // INICIO DE BREAK
    // ======================================================

    async registrarInicioBreak(datos) {

        return this.registrarInicioPausa({
            ...datos,
            tipo: TIPOS.BREAK_INICIO,
            estado: ESTADOS.BREAK
        });

    }

    // ======================================================
    // FIN DE BREAK
    // ======================================================

    async registrarFinBreak(datos) {

        return this.registrarFinPausa({
            ...datos,
            tipo: TIPOS.BREAK_FIN,
            estado: ESTADOS.BREAK
        });

    }

    // ======================================================
    // INICIO ALMUERZO
    // ======================================================

    async registrarInicioAlmuerzo(datos) {

        return this.registrarInicioPausa({
            ...datos,
            tipo: TIPOS.ALMUERZO_INICIO,
            estado: ESTADOS.ALMUERZO
        });

    }

    // ======================================================
    // FIN ALMUERZO
    // ======================================================

    async registrarFinAlmuerzo(datos) {

        return this.registrarFinPausa({
            ...datos,
            tipo: TIPOS.ALMUERZO_FIN,
            estado: ESTADOS.ALMUERZO
        });

    }

    // ======================================================
    // INICIO BAÑO
    // ======================================================

    async registrarInicioBano(datos) {

        return this.registrarInicioPausa({
            ...datos,
            tipo: TIPOS.BANO_INICIO,
            estado: ESTADOS.BANO
        });

    }

    // ======================================================
    // FIN BAÑO
    // ======================================================

    async registrarFinBano(datos) {

        return this.registrarFinPausa({
            ...datos,
            tipo: TIPOS.BANO_FIN,
            estado: ESTADOS.BANO
        });

    }

    // ======================================================
    // INICIO CAPACITACIÓN
    // ======================================================

    async registrarInicioCapacitacion(datos) {

        return this.registrarInicioPausa({
            ...datos,
            tipo: TIPOS.CAPACITACION_INICIO,
            estado: ESTADOS.CAPACITACION
        });

    }

    // ======================================================
    // FIN CAPACITACIÓN
    // ======================================================

    async registrarFinCapacitacion(datos) {

        return this.registrarFinPausa({
            ...datos,
            tipo: TIPOS.CAPACITACION_FIN,
            estado: ESTADOS.CAPACITACION
        });

    }

    // ======================================================
    // INICIO REUNIÓN
    // ======================================================

    async registrarInicioReunion(datos) {

        return this.registrarInicioPausa({
            ...datos,
            tipo: TIPOS.REUNION_INICIO,
            estado: ESTADOS.REUNION
        });

    }

    // ======================================================
    // FIN REUNIÓN
    // ======================================================

    async registrarFinReunion(datos) {

        return this.registrarFinPausa({
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

    if (estadoActual.estado !== ESTADOS.TRABAJANDO) {

        throw new Error(
            `No puede iniciar ${estado} porque actualmente está en ${estadoActual.estado}.`
        );

    }

    // --------------------------------------------
    // Registrar movimiento
    // --------------------------------------------

    await movimientosRepository.insertarMovimiento(

        asesor.id,

        tipo,

        new Date(),

        observacion

    );

    // --------------------------------------------
    // Actualizar estado actual
    // --------------------------------------------

    await movimientosRepository.actualizarEstadoActual(

        asesor.id,

        estado,

        new Date()

    );

    // --------------------------------------------
    // Respuesta
    // --------------------------------------------

    return {

        ok: true,

        movimiento: tipo,

        estado,

        asesor: asesor.nombre,

        fecha: new Date(),

        mensaje: `${estado} iniciado correctamente.`

    };

}

    async registrarFinPausa({

        asesor,

        estadoActual,

        observacion,

        tipo,

        estado

    }) {

        if (
            !estadoActual ||
            estadoActual.estado === ESTADOS.SALIDA
        ) {

            throw new Error(
                "El asesor no tiene una jornada activa."
            );

        }

        if (estadoActual.estado !== estado) {

            throw new Error(
                "No existe una pausa activa de este tipo."
            );

        }

        await movimientosRepository.insertarMovimiento(

            asesor.id,

            tipo,

            new Date(),

            observacion

        );

        await movimientosRepository.actualizarEstadoActual(

            asesor.id,

            ESTADOS.TRABAJANDO,

            new Date()

        );

        return {

            ok: true,

            movimiento: tipo,

            estado: ESTADOS.TRABAJANDO,

            asesor: asesor.nombre,

            fecha: new Date(),

            mensaje: `${estado} finalizado correctamente.`

        };

    }

    async obtenerEstadoActual(asesorId) {

        if (!asesorId) {
            throw new Error("Debe indicar un asesor.");
        }

        const asesor =
            await movimientosRepository.obtenerAsesor(asesorId);

        if (!asesor) {
            throw new Error("El asesor no existe.");
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

    async obtenerHistorial(asesorId) {

        if (!asesorId) {
            throw new Error("Debe indicar un asesor.");
        }

        const asesor =
            await movimientosRepository.obtenerAsesor(asesorId);

        if (!asesor) {
            throw new Error("El asesor no existe.");
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

    async obtenerResumenJornada(asesorId) {

        if (!asesorId) {
            throw new Error("Debe indicar un asesor.");
        }

        const asesor =
            await movimientosRepository.obtenerAsesor(asesorId);

        if (!asesor) {
            throw new Error("El asesor no existe.");
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
                m => m.tipo === TIPOS.ENTRADA
            );

        const salida =
            [...movimientos]
                .reverse()
                .find(
                    m => m.tipo === TIPOS.SALIDA
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

}

module.exports = new MovimientosService();