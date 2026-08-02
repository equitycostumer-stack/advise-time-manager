// ======================================================
// EQUITY LINE PROFESSIONAL SERVICES
// TIME MANAGER
// Servicio principal de movimientos
// ======================================================

const movimientosRepository = require("../repositories/movimientosRepository");

class MovimientosService {

    // ======================================================
    // REGISTRAR MOVIMIENTO
    // ======================================================

    async registrarMovimiento(datos) {

        const { asesor_id, tipo } = datos;

        if (!asesor_id) {
            throw new Error("El asesor es obligatorio.");
        }

        if (!tipo) {
            throw new Error("El tipo de movimiento es obligatorio.");
        }

        switch (tipo) {

            case "ENTRADA":
                return await this.registrarEntrada(datos);

            case "SALIDA":
                return await this.registrarSalida(datos);

            default:
                throw new Error(`Movimiento ${tipo} aún no implementado.`);

        }

    }

    // ======================================================
    // REGISTRAR ENTRADA
    // ======================================================

    async registrarEntrada(datos) {

        const { asesor_id } = datos;

        // Buscar asesor
        const asesor = await movimientosRepository.obtenerAsesor(asesor_id);

        if (!asesor) {
            throw new Error("El asesor no existe.");
        }

        if (!asesor.activo) {
            throw new Error("El asesor está inactivo.");
        }

        // Verificar último movimiento
        const ultimoMovimiento =
            await movimientosRepository.obtenerUltimoMovimiento(asesor_id);

        if (
            ultimoMovimiento &&
            ultimoMovimiento.tipo === "ENTRADA"
        ) {
            throw new Error("El asesor ya registró su entrada.");
        }

        // Registrar movimiento
        await movimientosRepository.insertarMovimiento(
            asesor_id,
            "ENTRADA"
        );

        // Actualizar estado
        const estadoActual =
            await movimientosRepository.obtenerEstadoActual(asesor_id);

        if (!estadoActual) {

            await movimientosRepository.crearEstadoActual(
                asesor_id,
                "DISPONIBLE",
                new Date()
            );

        } else {

            await movimientosRepository.actualizarEstadoActual(
                asesor_id,
                "DISPONIBLE",
                new Date()
            );

        }

        return {
            ok: true,
            mensaje: "Entrada registrada correctamente."
        };

    }

    // ======================================================
    // REGISTRAR SALIDA
    // ======================================================

    async registrarSalida(datos) {

        const { asesor_id } = datos;

        const asesor =
            await movimientosRepository.obtenerAsesor(asesor_id);

        if (!asesor) {
            throw new Error("El asesor no existe.");
        }

        await movimientosRepository.insertarMovimiento(
            asesor_id,
            "SALIDA"
        );

        const estadoActual =
            await movimientosRepository.obtenerEstadoActual(asesor_id);

        if (!estadoActual) {

            await movimientosRepository.crearEstadoActual(
                asesor_id,
                "FUERA_DE_JORNADA",
                new Date()
            );

        } else {

            await movimientosRepository.actualizarEstadoActual(
                asesor_id,
                "FUERA_DE_JORNADA",
                new Date()
            );

        }

        return {
            ok: true,
            mensaje: "Salida registrada correctamente."
        };

    }

}

module.exports = new MovimientosService();