// ======================================================
// EQUITY LINE PROFESSIONAL SERVICES
// VENTAS SERVICE
// ======================================================

const ventasRepository = require("../repositories/ventasRepository");
const movimientosRepository = require("../repositories/movimientosRepository");

class VentasService {

    // ==================================================
    // GENERAR FECHA EN HORA COLOMBIA
    // (mismo patrón ya validado en insertarMovimiento())
    // ==================================================

    generarFechaColombia(fecha = new Date()) {

        return new Intl.DateTimeFormat(
            "sv-SE",
            {
                timeZone: "America/Bogota",
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
                hour12: false
            }
        )
            .format(fecha)
            .replace(",", "");

    }

    // ==================================================
    // REGISTRAR VENTA
    // ==================================================

    async registrarVenta(datos) {

        const asesorId = Number(datos.asesor_id);

        if (!asesorId) {
            throw new Error("Debe seleccionar un asesor.");
        }

        const valor = Number(datos.valor);

        if (!Number.isFinite(valor) || valor <= 0) {
            throw new Error(
                "El valor de la venta debe ser un número mayor a cero."
            );
        }

        const clienteId =
            datos.cliente_id
                ? String(datos.cliente_id).trim()
                : null;

        // ----------------------------------------------
        // VALIDAR ASESOR (reutiliza la validación ya
        // probada del módulo de movimientos)
        // ----------------------------------------------

        const asesor =
            await movimientosRepository.obtenerAsesor(asesorId);

        if (!asesor) {
            throw new Error("El asesor no existe.");
        }

        if (!asesor.activo) {
            throw new Error("El asesor está inactivo.");
        }

        const fechaHora =
            this.generarFechaColombia();

        const observacion =
            datos.observacion || null;

        await ventasRepository.crearVenta(
            asesorId,
            clienteId,
            valor,
            fechaHora,
            observacion
        );

        return {

            ok: true,

            mensaje: "Venta registrada correctamente.",

            asesor: {
                id: asesor.id,
                nombre: asesor.nombre
            },

            cliente_id: clienteId,

            valor,

            fecha_hora: fechaHora

        };

    }

    // ==================================================
    // OBTENER VENTAS DEL DÍA
    // ==================================================

    async obtenerVentasDelDia() {

        return await ventasRepository.obtenerVentasDelDia();

    }

    // ==================================================
    // OBTENER VENTAS DE UN ASESOR
    // ==================================================

    async obtenerVentasPorAsesor(asesorId) {

        if (!asesorId) {
            throw new Error("Debe indicar el asesor.");
        }

        return await ventasRepository.obtenerVentasPorAsesor(asesorId);

    }

    // ==================================================
    // RESUMEN DEL DÍA (TOTALES GLOBALES)
    // ==================================================

    async obtenerResumenVentasDelDia() {

        return await ventasRepository.obtenerResumenVentasDelDia();

    }

    // ==================================================
    // RESUMEN POR ASESOR
    // ==================================================

    async obtenerResumenVentasPorAsesor() {
        return await ventasRepository.obtenerResumenVentasPorAsesor();
    }

    async obtenerResumenVentasPorAsesorPeriodo(fechaDesde, fechaHasta) {
        return await ventasRepository.obtenerResumenVentasPorAsesorPeriodo(fechaDesde, fechaHasta);
    }

    // ==================================================
    // ANULAR VENTA
    // ==================================================

    async anularVenta(id, usuario = null) {

        if (!id) {
            throw new Error("Debe indicar la venta a anular.");
        }

        const venta =
            await ventasRepository.obtenerVentaPorId(id);

        if (!venta) {
            throw new Error("La venta no existe.");
        }

        if (venta.estado === "ANULADA") {
            throw new Error("La venta ya está anulada.");
        }

        // ------------------------------------------------
        // Un ASESOR solo puede anular sus propias ventas.
        // Un ADMINISTRADOR puede anular cualquiera.
        // ------------------------------------------------
        if (usuario && usuario.rol !== "ADMINISTRADOR") {

            if (Number(venta.asesor_id) !== Number(usuario.asesor_id)) {

                const error = new Error(
                    "No tiene permiso para anular ventas de otro asesor."
                );
                error.status = 403;
                throw error;

            }

        }

        await ventasRepository.anularVenta(id);

        return {
            ok: true,
            mensaje: "Venta anulada correctamente."
        };

    }

}

module.exports = new VentasService();
