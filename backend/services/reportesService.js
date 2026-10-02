// ======================================================
// EQUITY LINE PROFESSIONAL SERVICES - REPORTES SERVICE
// ======================================================
const reportesRepository = require("../repositories/reportesRepository");

class ReportesService {
    fechaISOValida(valor) {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(String(valor || ""))) return false;
        const [anio, mes, dia] = String(valor).split("-").map(Number);
        const ultimoDia = new Date(Date.UTC(anio, mes, 0)).getUTCDate();
        return mes >= 1 && mes <= 12 && dia >= 1 && dia <= ultimoDia;
    }

    validarRango(desde, hasta) {
        const formato = /^\d{4}-\d{2}-\d{2}$/;
        if (!formato.test(String(desde || "")) || !formato.test(String(hasta || "")) || !this.fechaISOValida(desde) || !this.fechaISOValida(hasta)) {
            const error = new Error("Las fechas deben tener formato YYYY-MM-DD."); error.status = 400; throw error;
        }
        const inicio = new Date(`${desde}T12:00:00-05:00`);
        const fin = new Date(`${hasta}T12:00:00-05:00`);
        if (Number.isNaN(inicio.getTime()) || Number.isNaN(fin.getTime()) || desde > hasta) {
            const error = new Error("La fecha inicial no puede ser posterior a la fecha final."); error.status = 400; throw error;
        }
        if ((fin - inicio) / 86400000 > 366) {
            const error = new Error("El rango no puede superar 366 días."); error.status = 400; throw error;
        }
    }

    asesorPermitido(usuario) {
        if (usuario?.rol === "ADMINISTRADOR") return null;
        const asesorId = Number(usuario?.asesor_id);
        if (!Number.isInteger(asesorId) || asesorId <= 0) {
            const error = new Error("Este usuario no tiene un asesor vinculado."); error.status = 403; throw error;
        }
        return asesorId;
    }

    async obtenerAsistencia(desde, hasta, usuario) {
        this.validarRango(desde, hasta);
        return reportesRepository.obtenerAsistenciaPorRango(desde, hasta, this.asesorPermitido(usuario));
    }

    async obtenerVentas(desde, hasta, usuario) {
        this.validarRango(desde, hasta);
        return reportesRepository.obtenerVentasPorRango(desde, hasta, this.asesorPermitido(usuario));
    }
}
module.exports = new ReportesService();
