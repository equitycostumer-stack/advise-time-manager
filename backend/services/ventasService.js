// ======================================================
// EQUITY LINE PROFESSIONAL SERVICES
// VENTAS SERVICE
// ======================================================
const ventasRepository = require("../repositories/ventasRepository");
const movimientosRepository = require("../repositories/movimientosRepository");
const configuracionVentasRepository = require("../repositories/configuracionVentasRepository");

function errorHttp(mensaje, status = 400) {
    const error = new Error(mensaje);
    error.status = status;
    return error;
}

function obtenerAsesorIdPermitido(usuario) {
    if (usuario?.rol === "ADMINISTRADOR") return null;
    const asesorId = Number(usuario?.asesor_id);
    return Number.isInteger(asesorId) && asesorId > 0 ? asesorId : null;
}

function estaHabilitado(valor) {
    if (valor === undefined || valor === null) return false;
    return ![false, 0, "0", "false", "no"].includes(typeof valor === "string" ? valor.toLowerCase() : valor);
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

    resolverFechaVenta(datos) {
        const hoy = this.generarFechaColombia().slice(0, 10);
        const fechaVenta = datos.fecha_venta ? String(datos.fecha_venta).trim() : hoy;
        if (!this.validarFechaISO(fechaVenta)) throw errorHttp("La fecha de venta no es válida.");
        if (fechaVenta > hoy) throw errorHttp("No se pueden registrar ventas con una fecha futura.");
        if (fechaVenta === hoy) {
            return { fechaHora: this.generarFechaColombia(), retroactiva: false, motivo: null };
        }

        const horaVenta = String(datos.hora_venta || "").trim();
        if (!/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(horaVenta)) {
            throw errorHttp("Para una venta anterior, indique la hora efectiva en formato HH:MM.");
        }
        const motivo = this.validarMotivo(datos.motivo_registro_retroactivo);
        return { fechaHora: `${fechaVenta} ${horaVenta}:00`, retroactiva: true, motivo };
    }

    async registrarVenta(datos) {
        const asesorId = Number(datos.asesor_id);
        if (!Number.isInteger(asesorId) || asesorId <= 0) throw errorHttp("Debe seleccionar un asesor.");
        const valor = Number(datos.valor);
        if (!Number.isFinite(valor) || valor <= 0 || valor > 100000000000) {
            throw errorHttp("El valor de la venta debe ser un número mayor a cero y válido.");
        }
        const clienteId = datos.cliente_id ? String(datos.cliente_id).trim().slice(0, 120) : null;
        const observacion = datos.observacion ? String(datos.observacion).trim().slice(0, 500) : null;
        const configuracion = (await configuracionVentasRepository.obtener()) || {
            permitir_recaudo: true, permitir_recaudo_cero: true, recaudo_no_supera_venta: true
        };
        const recaudo = datos.recaudo === "" || datos.recaudo == null ? 0 : Number(datos.recaudo);
        if (!Number.isFinite(recaudo) || recaudo < 0 || recaudo > 100000000000) {
            throw errorHttp("El recaudo debe ser un número válido mayor o igual a cero.");
        }
        if (!configuracion.permitir_recaudo && recaudo > 0) throw errorHttp("El registro de recaudo está desactivado por configuración.");
        if (!configuracion.permitir_recaudo_cero && recaudo === 0) throw errorHttp("Debe registrar un recaudo mayor a cero.");
        if (configuracion.recaudo_no_supera_venta && recaudo > valor) throw errorHttp("El recaudo no puede superar el valor de la venta.");
        const asesor = await movimientosRepository.obtenerAsesor(asesorId);
        if (!asesor) throw errorHttp("El asesor no existe.");
        if (!asesor.activo) throw errorHttp("El asesor está inactivo.");
        const fecha = this.resolverFechaVenta(datos);
        await ventasRepository.crearVenta(asesorId, clienteId, valor, recaudo, fecha.fechaHora, observacion, datos.usuario || null, fecha.motivo);
        return { ok: true, mensaje: "Venta registrada correctamente.", asesor: { id: asesor.id, nombre: asesor.nombre }, cliente_id: clienteId, valor, recaudo, fecha_hora: fecha.fechaHora, retroactiva: fecha.retroactiva };
    }

    async obtenerVentasDelDia(usuario) {
        const asesorId = obtenerAsesorIdPermitido(usuario);
        if (usuario?.rol !== "ADMINISTRADOR" && !asesorId) {
            const error = new Error("Este usuario no tiene un asesor vinculado."); error.status = 403; throw error;
        }
        return ventasRepository.obtenerVentasDelDia(asesorId);
    }

    async obtenerVentasPorAsesor(asesorId) {
        if (!Number.isInteger(Number(asesorId)) || Number(asesorId) <= 0) throw errorHttp("Debe indicar el asesor.");
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

    validarMotivo(motivo) {
        const texto = String(motivo || "").trim();
        if (texto.length < 5 || texto.length > 500) throw errorHttp("Debe indicar un motivo de entre 5 y 500 caracteres.");
        return texto;
    }

    validarRangoAdmin(fechaDesde, fechaHasta) {
        if (!this.validarFechaISO(fechaDesde) || !this.validarFechaISO(fechaHasta) || fechaDesde > fechaHasta) {
            const error = new Error("El rango de fechas no es válido."); error.status = 400; throw error;
        }
        const dias = (new Date(`${fechaHasta}T12:00:00-05:00`) - new Date(`${fechaDesde}T12:00:00-05:00`)) / 86400000;
        if (dias > 366) { const error = new Error("El rango no puede superar 366 días."); error.status = 400; throw error; }
    }

    async listarVentasAdmin(fechaDesde, fechaHasta, asesorId, clienteId, estado) {
        this.validarRangoAdmin(fechaDesde, fechaHasta);
        const id = asesorId === undefined || asesorId === "" ? null : Number(asesorId);
        if (id !== null && (!Number.isInteger(id) || id <= 0)) { const error = new Error("El asesor indicado no es válido."); error.status = 400; throw error; }
        const cliente = clienteId === undefined || clienteId === null ? "" : String(clienteId).trim().slice(0, 120);
        return ventasRepository.listarVentasAdmin(fechaDesde, fechaHasta, id, cliente, estado);
    }

    async corregirVenta(id, datos, usuario) {
        const ventaId = Number(id);
        if (!Number.isInteger(ventaId) || ventaId <= 0) throw errorHttp("La venta indicada no es válida.");
        const motivo = this.validarMotivo(datos.motivo);
        const asesorId = Number(datos.asesor_id);
        const valor = Number(datos.valor);
        const recaudo = Number(datos.recaudo);
        if (!Number.isInteger(asesorId) || asesorId <= 0) throw errorHttp("Debe seleccionar un asesor válido.");
        if (!Number.isFinite(valor) || valor <= 0 || valor > 100000000000) throw errorHttp("El valor de la venta no es válido.");
        if (!Number.isFinite(recaudo) || recaudo < 0 || recaudo > 100000000000) throw errorHttp("El recaudo no es válido.");
        const configuracion = (await configuracionVentasRepository.obtener()) || { recaudo_no_supera_venta: true };
        if (configuracion.recaudo_no_supera_venta && recaudo > valor) throw errorHttp("El recaudo no puede superar el valor de la venta.");
        const asesor = await movimientosRepository.obtenerAsesor(asesorId);
        if (!asesor || !asesor.activo) throw errorHttp("El asesor seleccionado no existe o está inactivo.");
        const clienteId = datos.cliente_id ? String(datos.cliente_id).trim().slice(0, 120) : null;
        const observacion = datos.observacion ? String(datos.observacion).trim().slice(0, 500) : null;
        const original = await ventasRepository.obtenerVentaPorId(ventaId);
        const accion = Number(original?.asesor_id) !== asesorId ? "REASIGNACION" : "EDICION";
        return ventasRepository.actualizarVentaAdmin(ventaId, { asesor_id: asesorId, cliente_id: clienteId, valor, recaudo, observacion, accion }, usuario?.id, motivo);
    }

    validarPeriodoResumen(fechaDesde, fechaHasta) {
        if (!this.validarFechaISO(fechaDesde) || !this.validarFechaISO(fechaHasta) || fechaDesde > fechaHasta) {
            const error = new Error("El rango de fechas no es válido."); error.status = 400; throw error;
        }
        const diferenciaDias = (new Date(`${fechaHasta}T12:00:00-05:00`) - new Date(`${fechaDesde}T12:00:00-05:00`)) / 86400000;
        if (diferenciaDias > 366) {
            const error = new Error("El rango no puede superar 366 días."); error.status = 400; throw error;
        }
    }

    async obtenerResumenVentasPorAsesorPeriodo(fechaDesde, fechaHasta, usuario) {
        this.validarPeriodoResumen(fechaDesde, fechaHasta);
        const configuracion = await configuracionVentasRepository.obtener();
        if (usuario?.rol !== "ADMINISTRADOR" && (!configuracion || !estaHabilitado(configuracion.ranking_activo) || !estaHabilitado(configuracion.ranking_visible_asesores))) {
            return [];
        }
        // El ranking es un indicador motivacional compartido cuando está habilitado.
        return ventasRepository.obtenerResumenVentasPorAsesorPeriodo(fechaDesde, fechaHasta, configuracion?.criterio_ranking || "RECAUDO", null);
    }

    async obtenerMejorAsesorPeriodo(fechaDesde, fechaHasta, usuario) {
        this.validarPeriodoResumen(fechaDesde, fechaHasta);
        const config = await configuracionVentasRepository.obtener();
        if (usuario?.rol !== "ADMINISTRADOR" && (!config || !estaHabilitado(config.ranking_activo) || !estaHabilitado(config.ranking_visible_asesores))) {
            return null;
        }
        return ventasRepository.obtenerMejorAsesorPeriodo(fechaDesde, fechaHasta);
    }

    async anularVenta(id, usuario = null, motivo = "") {
        if (!Number.isInteger(Number(id)) || Number(id) <= 0) throw errorHttp("Debe indicar la venta a anular.");
        const motivoNormalizado = String(motivo || "").trim();
        if (motivoNormalizado.length < 5 || motivoNormalizado.length > 500) {
            throw errorHttp("Debe indicar un motivo de entre 5 y 500 caracteres para anular la venta.");
        }
        await ventasRepository.anularVenta(Number(id), usuario, motivoNormalizado);
        return { ok: true, mensaje: "Venta anulada correctamente." };
    }
}
module.exports = new VentasService();
