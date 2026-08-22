// ======================================================
// EQUITY LINE PROFESSIONAL SERVICES
// REPORTES SERVICE
// ======================================================

const reportesRepository = require("../repositories/reportesRepository");

class ReportesService {

    // ==================================================
    // VALIDAR RANGO DE FECHAS
    // ==================================================

    validarRango(desde, hasta) {

        if (!desde || !hasta) {
            throw new Error("Debe indicar las fechas 'desde' y 'hasta'.");
        }

        const formatoValido = /^\d{4}-\d{2}-\d{2}$/;

        if (!formatoValido.test(desde) || !formatoValido.test(hasta)) {
            throw new Error("Las fechas deben tener formato YYYY-MM-DD.");
        }

        if (desde > hasta) {
            throw new Error("La fecha 'desde' no puede ser posterior a 'hasta'.");
        }

    }

    // ==================================================
    // ASISTENCIA POR RANGO
    // ==================================================

    async obtenerAsistencia(desde, hasta) {

        this.validarRango(desde, hasta);

        return await reportesRepository.obtenerAsistenciaPorRango(desde, hasta);

    }

    // ==================================================
    // VENTAS POR RANGO
    // ==================================================

    async obtenerVentas(desde, hasta) {

        this.validarRango(desde, hasta);

        return await reportesRepository.obtenerVentasPorRango(desde, hasta);

    }

}

module.exports = new ReportesService();