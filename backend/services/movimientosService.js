const movimientosRepository = require("../repositories/movimientosRepository");
const resumenJornadaService = require("./resumenJornadaService");
const { registrarIncidencia } = require("../controllers/incidenciasController");
const emailService = require("./emailService");
const {
    TIPOS,
    ESTADOS
} = require("../constants/movimientos");

class MovimientosService {

    // =====================================================
    // REGISTRAR MOVIMIENTO
    // =====================================================

    async registrarMovimiento(datos) {

        switch (datos.tipo) {

            case TIPOS.ENTRADA:
                return await this.registrarEntrada(datos);

            case TIPOS.SALIDA:
                return await this.registrarSalida(datos);

            case TIPOS.BREAK_INICIO:
                return await this.iniciarBreak(datos);

            case TIPOS.BREAK_FIN:
                return await this.finalizarBreak(datos);

            case TIPOS.ALMUERZO_INICIO:
                return await this.iniciarAlmuerzo(datos);

            case TIPOS.ALMUERZO_FIN:
                return await this.finalizarAlmuerzo(datos);

            case TIPOS.BANO_INICIO:
                return await this.iniciarBano(datos);

            case TIPOS.BANO_FIN:
                return await this.finalizarBano(datos);

            case TIPOS.CAPACITACION_INICIO:
                return await this.iniciarCapacitacion(datos);

            case TIPOS.CAPACITACION_FIN:
                return await this.finalizarCapacitacion(datos);

            case TIPOS.REUNION_INICIO:
                return await this.iniciarReunion(datos);

            case TIPOS.REUNION_FIN:
                return await this.finalizarReunion(datos);

            default:
                throw new Error("Movimiento no válido.");

        }

    }

    // =====================================================
    // OBTENER ASESOR
    // =====================================================

    async obtenerAsesor(asesorId) {

        const asesor =
            await movimientosRepository.obtenerAsesor(asesorId);

        if (!asesor)
            throw new Error("El asesor no existe.");

        if (!asesor.activo)
            throw new Error("El asesor está inactivo.");

        return asesor;

    }
// =====================================================
// VALIDAR SI LA JORNADA ES DEL DÍA ACTUAL
// =====================================================

esMismaFecha(fecha) {

    if (!fecha)
        return false;

    const f = resumenJornadaService.convertirFechaColombia(fecha);

    if (!f)
        return false;

    // Fecha/hora actual, interpretada en Colombia
    const ahoraColombia = new Date(
        new Intl.DateTimeFormat("sv-SE", {
            timeZone: "America/Bogota",
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: false
        }).format(new Date()).replace(" ", "T") + "-05:00"
    );

    const fechaColombiaComparar = new Intl.DateTimeFormat("en-CA", {
        timeZone: "America/Bogota",
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
    }).format(f);

    const hoyColombiaComparar = new Intl.DateTimeFormat("en-CA", {
        timeZone: "America/Bogota",
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
    }).format(ahoraColombia);

    return fechaColombiaComparar === hoyColombiaComparar;

}
// =====================================================
// REGISTRAR ENTRADA
// =====================================================

async registrarEntrada(datos) {

    const asesor =
        await this.obtenerAsesor(datos.asesor_id);

    const estadoActual =
        await movimientosRepository.obtenerEstadoActual(
            asesor.id
        );

    console.log("=================================");
    console.log("ESTADO ACTUAL ANTES DE ENTRADA");
    console.log(estadoActual);
    console.log("=================================");

    const esJornadaDeHoy =
        estadoActual &&
        this.esMismaFecha(estadoActual.inicio_jornada);

    // ==================================================
    // VALIDACIÓN PRIMERO — ANTES DE INSERTAR NADA
    //
    // Regla: solo una Entrada/Salida por día.
    // Si ya existe cualquier registro de jornada de hoy
    // (TRABAJANDO, en pausa, o ya en SALIDA), se bloquea.
    // ==================================================

    if (estadoActual && esJornadaDeHoy) {

        throw new Error(
            "El asesor ya registró su jornada de hoy."
        );

    }

    const ahora = new Date();

    console.log("=================================");
    console.log("FECHA GENERADA PARA ENTRADA");
    console.log("ahora:", ahora);
    console.log("=================================");

    // ==================================================
    // SOLO SE INSERTA SI LA VALIDACIÓN YA PASÓ
    // ==================================================

    await movimientosRepository.insertarMovimiento(
        asesor.id,
        TIPOS.ENTRADA,
        ahora,
        datos.observacion || null
    );

    if (!estadoActual) {

        await movimientosRepository.crearEstadoActual(
            asesor.id,
            ESTADOS.TRABAJANDO,
            ahora,
            ahora
        );

        await movimientosRepository.crearResumenDia(
            asesor.id,
            ahora
        );

    } else {

        // Jornada existente es de otro día -> se reinicia

        console.log("=================================");
        console.log("DEBUG NUEVA JORNADA");
        console.log("asesor:", asesor.id);
        console.log("estado anterior:", estadoActual);
        console.log("inicio_jornada anterior:", estadoActual.inicio_jornada);
        console.log("fecha actual:", ahora);
        console.log("=================================");

        await movimientosRepository.actualizarEstadoActual(
            asesor.id,
            ESTADOS.TRABAJANDO,
            ahora,
            ahora
        );

        await movimientosRepository.crearResumenDia(
            asesor.id,
            ahora
        );

    }

    await resumenJornadaService.actualizar(asesor.id);

    return {

        ok: true,

        movimiento: TIPOS.ENTRADA,

        estado: ESTADOS.TRABAJANDO,

        fecha: ahora,

        asesor

    };

}

// =====================================================
// REGISTRAR SALIDA
// =====================================================

async registrarSalida(datos) {

    const asesor =
        await this.obtenerAsesor(datos.asesor_id);

    const estado =
        await movimientosRepository.obtenerEstadoActual(asesor.id);

    if (!estado)
        throw new Error("Debe registrar Entrada.");

    if (estado.estado === ESTADOS.SALIDA)
        throw new Error("Ya registró la salida.");

    const ahora = new Date();

    await movimientosRepository.insertarMovimiento(
        asesor.id,
        TIPOS.SALIDA,
        ahora,
        datos.observacion || null
    );

    await movimientosRepository.actualizarEstadoActual(
        asesor.id,
        ESTADOS.SALIDA,
        ahora
    );
    await resumenJornadaService.actualizar(asesor.id);
    return {
        ok: true,
        estado: ESTADOS.SALIDA,
        movimiento: TIPOS.SALIDA,
        fecha: ahora
    };

}

// =====================================================
// MÉTODO GENÉRICO PARA INICIAR PAUSAS
// =====================================================

async iniciarPausa(datos, tipoMovimiento, estadoNuevo) {

    const asesor =
        await this.obtenerAsesor(datos.asesor_id);

    const estado =
        await movimientosRepository.obtenerEstadoActual(asesor.id);

    if (!estado)
        throw new Error("Debe registrar Entrada.");

    if (estado.estado !== ESTADOS.TRABAJANDO)
        throw new Error("Debe estar Trabajando.");

    const ahora = new Date();

    await movimientosRepository.insertarMovimiento(
        asesor.id,
        tipoMovimiento,
        ahora,
        datos.observacion || null
    );

    await movimientosRepository.actualizarEstadoActual(
        asesor.id,
        estadoNuevo,
        ahora
    );
    await resumenJornadaService.actualizar(asesor.id);
    return {

        ok: true,

        estado: estadoNuevo,

        fecha: ahora

    };

}

// =====================================================
// MÉTODO GENÉRICO PARA FINALIZAR PAUSAS
// =====================================================

async finalizarPausa(datos, tipoMovimiento, estadoEsperado) {

    const asesor =
        await this.obtenerAsesor(datos.asesor_id);

    const estado =
        await movimientosRepository.obtenerEstadoActual(asesor.id);

    if (!estado)
        throw new Error("Debe registrar Entrada.");

    if (estado.estado !== estadoEsperado)
        throw new Error("La pausa no está iniciada.");

    const ahora = new Date();

    // ==========================================
    // CALCULAR DURACIÓN REAL DE LA PAUSA
    // ==========================================

    const inicioPausa =
        resumenJornadaService.convertirFechaColombia(
            estado.inicio_estado
        );

    const duracionMinutos =
        inicioPausa
            ? Math.max(
                0,
                Math.round(
                    (ahora.getTime() - inicioPausa.getTime()) / 60000
                )
            )
            : 0;

    // ==========================================
    // OBTENER LÍMITE SEGÚN EL TIPO DE PAUSA
    // ==========================================

    const configuracion =
        await movimientosRepository.obtenerConfiguracion();

    const limitesPorEstado = {
        [ESTADOS.BREAK]: configuracion?.break_max,
        [ESTADOS.ALMUERZO]: configuracion?.almuerzo_max,
        [ESTADOS.BANO]: configuracion?.bano_max,
        [ESTADOS.CAPACITACION]: configuracion?.capacitacion_max,
        [ESTADOS.REUNION]: configuracion?.reunion_max
    };

    const limiteMinutos =
        limitesPorEstado[estadoEsperado] ?? null;

    const excedioLimite =
        limiteMinutos != null &&
        duracionMinutos > limiteMinutos;

    console.log("=================================");
    console.log("DEBUG FIN DE PAUSA");
    console.log("asesor:", asesor.id);
    console.log("estado:", estadoEsperado);
    console.log("duracion (min):", duracionMinutos);
    console.log("limite (min):", limiteMinutos);
    console.log("excedio_limite:", excedioLimite);
    console.log("=================================");

    await movimientosRepository.insertarMovimiento(
        asesor.id,
        tipoMovimiento,
        ahora,
        datos.observacion || null
    );

    await movimientosRepository.actualizarEstadoActual(
        asesor.id,
        ESTADOS.TRABAJANDO,
        ahora
    );

    await resumenJornadaService.actualizar(asesor.id);

    // ==========================================
    // INCIDENCIA POR EXCESO DE TIEMPO
    // ==========================================

     if (excedioLimite) {

        registrarIncidencia(
            asesor.id,
            `EXCESO ${estadoEsperado}`,
            "MEDIA",
            `Duración real: ${duracionMinutos} min (límite: ${limiteMinutos} min)`
        );

        emailService.enviarAlertaExceso({
            asesorNombre: asesor.nombre,
            tipoPausa: estadoEsperado,
            duracionMinutos,
            limiteMinutos
        });

    }

    return {

        ok: true,

        estado: ESTADOS.TRABAJANDO,

        fecha: ahora,

        duracion_minutos: duracionMinutos,

        limite_minutos: limiteMinutos,

        excedio_limite: excedioLimite

    };

}

// =====================================================
// BREAK
// =====================================================

async iniciarBreak(datos) {

    return await this.iniciarPausa(
        datos,
        TIPOS.BREAK_INICIO,
        ESTADOS.BREAK
    );

}

async finalizarBreak(datos) {

    return await this.finalizarPausa(
        datos,
        TIPOS.BREAK_FIN,
        ESTADOS.BREAK
    );

}

// =====================================================
// ALMUERZO
// =====================================================

async iniciarAlmuerzo(datos) {

    return await this.iniciarPausa(
        datos,
        TIPOS.ALMUERZO_INICIO,
        ESTADOS.ALMUERZO
    );

}

async finalizarAlmuerzo(datos) {

    return await this.finalizarPausa(
        datos,
        TIPOS.ALMUERZO_FIN,
        ESTADOS.ALMUERZO
    );

}

// =====================================================
// BAÑO
// =====================================================

async iniciarBano(datos) {

    return await this.iniciarPausa(
        datos,
        TIPOS.BANO_INICIO,
        ESTADOS.BANO
    );

}

async finalizarBano(datos) {

    return await this.finalizarPausa(
        datos,
        TIPOS.BANO_FIN,
        ESTADOS.BANO
    );

}

// =====================================================
// CAPACITACIÓN
// =====================================================

async iniciarCapacitacion(datos) {

    return await this.iniciarPausa(
        datos,
        TIPOS.CAPACITACION_INICIO,
        ESTADOS.CAPACITACION
    );

}

async finalizarCapacitacion(datos) {

    return await this.finalizarPausa(
        datos,
        TIPOS.CAPACITACION_FIN,
        ESTADOS.CAPACITACION
    );

}

// =====================================================
// REUNIÓN
// =====================================================

async iniciarReunion(datos) {

    return await this.iniciarPausa(
        datos,
        TIPOS.REUNION_INICIO,
        ESTADOS.REUNION
    );

}

async finalizarReunion(datos) {

    return await this.finalizarPausa(
        datos,
        TIPOS.REUNION_FIN,
        ESTADOS.REUNION
    );

}

// =====================================================
// OBTENER ESTADO ACTUAL
// =====================================================

async obtenerEstadoActual(asesorId) {

    return await movimientosRepository.obtenerEstadoActual(
        asesorId
    );

}

// =====================================================
// OBTENER HISTORIAL
// =====================================================

async obtenerHistorial(asesorId) {

    if (typeof movimientosRepository.obtenerMovimientosDelDia === "function") {

        return await movimientosRepository.obtenerMovimientosDelDia(
            asesorId
        );

    }

    return await movimientosRepository.obtenerHistorial(
        asesorId
    );

}

// =====================================================
// OBTENER RESUMEN DEL DÍA
// =====================================================

async obtenerResumen(asesorId) {

    if (typeof movimientosRepository.obtenerResumenDia === "function") {

        return await movimientosRepository.obtenerResumenDia(
            asesorId
        );

    }

    return await movimientosRepository.obtenerResumenJornada(
        asesorId
    );

}

// =====================================================
// OBTENER RESUMEN JORNADA
// =====================================================

async obtenerResumenJornada(asesorId) {

    return await this.obtenerResumen(
        asesorId
    );

}

}

module.exports = new MovimientosService();