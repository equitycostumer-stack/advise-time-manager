const movimientosRepository = require("../repositories/movimientosRepository");
const resumenJornadaService = require("./resumenJornadaService");
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

    const hoy = new Date();

    const f = new Date(fecha);

    return (

        hoy.getFullYear() === f.getFullYear() &&

        hoy.getMonth() === f.getMonth() &&

        hoy.getDate() === f.getDate()

    );

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

    if (
        estadoActual &&
        estadoActual.estado !== ESTADOS.SALIDA &&
        this.esMismaFecha(estadoActual.inicio_jornada)
    ) {

        throw new Error(
            "El asesor ya tiene una jornada activa."
        );

    }

    const ahora = new Date();

    console.log("=================================");
    console.log("FECHA GENERADA PARA ENTRADA");
    console.log("ahora:", ahora);
    console.log("=================================");

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

    // Si la jornada es de otro día, se reinicia

    if (!this.esMismaFecha(estadoActual.inicio_jornada)) {

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

    } else {

        throw new Error(
            "El asesor ya tiene una jornada activa."
        );

    }

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
    return {

        ok: true,

        estado: ESTADOS.TRABAJANDO,

        fecha: ahora

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