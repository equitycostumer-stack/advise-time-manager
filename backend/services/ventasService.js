// ======================================================
// EQUITY LINE PROFESSIONAL SERVICES
// VENTAS SERVICE
// ======================================================
const ventasRepository = require("../repositories/ventasRepository");
const movimientosRepository = require("../repositories/movimientosRepository");
const configuracionVentasRepository = require("../repositories/configuracionVentasRepository");

function obtenerAsesorIdPermitido(usuario) {
    if (usuario?.rol === "ADMINISTRADOR") return null;
    const asesorId = Number(usuario?.asesor_id);
    return Number.isInteger(asesorId) && asesorId > 0 ? asesorId : null;
}

class VentasService {
    generarFechaColombia(fecha = new Date()) {
        return new Intl.DateTimeFormat("sv-SE", {
            timeZone: "America/Bogota", year: "numeric", month: "2-digit", day: "2-digit",
            hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false
        }).format(fecha).replace(",", "");
    }

    validarFechaISO(valor) {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(String(valor || ""))) return false;
        const fecha = new Date(`${valor}T12:00:00-05:00`);
        return !Number.isNaN(fecha.getTime()) && this.generarFechaColombia(fecha).slice(0, 10) === valor;
    }

    async registrarVenta(datos) {
        const asesorId = Number(datos.asesor_id);
        if (!Number.isInteger(asesorId) || asesorId <= 0) throw new Error("Debe seleccionar un asesor.");
        const valor = Number(datos.valor);
        if (!Number.isFinite(valor) || valor <= 0 || valor > 100000000000) {
            throw new Error("El valor de la venta debe ser un número mayor a cero y válido.");
        }
        const clienteId = datos.cliente_id ? String(datos.cliente_id).trim().slice(0, 120) : null;
        const observacion = datos.observacion ? String(datos.observacion).trim().slice(0, 500) : null;
        const configuracion = (await configuracionVentasRepository.obtener()) || {
            permitir_recaudo: true, permitir_recaudo_cero: true, recaudo_no_supera_venta: true
        };
        const recaudo = datos.recaudo === "" || datos.recaudo == null ? 0 : Number(datos.recaudo);
        if (!Number.isFinite(recaudo) || recaudo < 0 || recaudo > 100000000000) {
            throw new Error("El recaudo debe ser un número válido mayor o igual a cero.");
        }
        if (!configuracion.permitir_recaudo && recaudo > 0) throw new Error("El registro de recaudo está desactivado por configuración.");
        if (!configuracion.permitir_recaudo_cero && recaudo === 0) throw new Error("Debe registrar un recaudo mayor a cero.");
        if (configuracion.recaudo_no_supera_venta && recaudo > valor) throw new Error("El recaudo no puede superar el valor de la venta.");
        const asesor = await movimientosRepository.obtenerAsesor(asesorId);
        if (!asesor) throw new Error("El asesor no existe.");
        if (!asesor.activo) throw new Error("El asesor está inactivo.");
        const fechaHora = this.generarFechaColombia();
        await ventasRepository.crearVenta(asesorId, clienteId, valor, recaudo, fechaHora, observacion);
        return { ok: true, mensaje: "Venta registrada correctamente.", asesor: { id: asesor.id, nombre: asesor.nombre }, cliente_id: clienteId, valor, recaudo, fecha_hora: fechaHora };
    }

    async obtenerVentasDelDia(usuario) {
        const asesorId = obtenerAsesorIdPermitido(usuario);
        if (usuario?.rol !== "ADMINISTRADOR" && !asesorId) {
            const error = new Error("Este usuario no tiene un asesor vinculado."); error.status = 403; throw error;
        }
        return ventasRepository.obtenerVentasDelDia(asesorId);
    }

    async obtenerVentasPorAsesor(asesorId) {
        if (!Number.isInteger(Number(asesorId)) || Number(asesorId) <= 0) throw new Error("Debe indicar el asesor.");
        return ventasRepository.obtenerVentasPorAsesor(Number(asesorId));
    }

    async obtenerResumenVentasDelDia(usuario) {
        const asesorId = obtenerAsesorIdPermitido(usuario);
        if (usuario?.rol !== "ADMINISTRADOR" && !asesorId) {
            const error = new Error("Este usuario no tiene un asesor vinculado."); error.status = 403; throw error;
        }
        return ventasRepository.obtenerResumenVentasDelDia(asesorId);
    }

    async obtenerResumenVentasPorAsesor(usuario) {
        const asesorId = obtenerAsesorIdPermitido(usuario);
        if (usuario?.rol !== "ADMINISTRADOR" && !asesorId) {
            const error = new Error("Este usuario no tiene un asesor vinculado."); error.status = 403; throw error;
        }
        return ventasRepository.obtenerResumenVentasPorAsesor(asesorId);
    }

    async obtenerResumenVentasPorAsesorPeriodo(fechaDesde, fechaHasta, usuario) {
        if (!this.validarFechaISO(fechaDesde) || !this.validarFechaISO(fechaHasta) || fechaDesde > fechaHasta) {
            const error = new Error("El rango de fechas no es válido."); error.status = 400; throw error;
        }
        const diferenciaDias = (new Date(`${fechaHasta}T12:00:00-05:00`) - new Date(`${fechaDesde}T12:00:00-05:00`)) / 86400000;
        if (diferenciaDias > 366) {
            const error = new Error("El rango no puede superar 366 días."); error.status = 400; throw error;
        }
        const asesorId = obtenerAsesorIdPermitido(usuario);
        if (usuario?.rol !== "ADMINISTRADOR" && !asesorId) {
            const error = new Error("Este usuario no tiene un asesor vinculado."); error.status = 403; throw error;
        }
        const configuracion = await configuracionVentasRepository.obtener();
        return ventasRepository.obtenerResumenVentasPorAsesorPeriodo(fechaDesde, fechaHasta, configuracion?.criterio_ranking || "RECAUDO", asesorId);
    }

    async anularVenta(id, usuario = null, motivo = "") {
        if (!Number.isInteger(Number(id)) || Number(id) <= 0) throw new Error("Debe indicar la venta a anular.");
        const motivoNormalizado = String(motivo || "").trim();
        if (motivoNormalizado.length < 5 || motivoNormalizado.length > 500) {
            const error = new Error("Debe indicar un motivo de entre 5 y 500 caracteres para anular la venta."); error.status = 400; throw error;
        }
        const venta = await ventasRepository.obtenerVentaPorId(Number(id));
        if (!venta) throw new Error("La venta no existe.");
        if (venta.estado === "ANULADA") throw new Error("La venta ya está anulada.");
        if (usuario && usuario.rol !== "ADMINISTRADOR" && Number(venta.asesor_id) !== Number(usuario.asesor_id)) {
            const error = new Error("No tiene permiso para anular ventas de otro asesor."); error.status = 403; throw error;
        }
        await ventasRepository.anularVenta(Number(id), usuario, motivoNormalizado);
        return { ok: true, mensaje: "Venta anulada correctamente." };
    }
}
module.exports = new VentasService();
