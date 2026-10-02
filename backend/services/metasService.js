const repository = require("../repositories/metasRepository");
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function fechaValida(valor) {
    if (!ISO_DATE.test(String(valor || ""))) return false;
    const [anio, mes, dia] = String(valor).split("-").map(Number);
    const ultimoDia = new Date(Date.UTC(anio, mes, 0)).getUTCDate();
    return mes >= 1 && mes <= 12 && dia >= 1 && dia <= ultimoDia;
}

function error(mensaje, status = 400) {
    const resultado = new Error(mensaje); resultado.status = status; return resultado;
}

class MetasService {
    validarPeriodo(inicio, fin) {
        if (!fechaValida(inicio) || !fechaValida(fin) || inicio > fin) throw error("El periodo debe contener fechas válidas.");
        const diaInicio = Number(inicio.slice(-2));
        const diaFin = Number(fin.slice(-2));
        const [anio, mes] = inicio.split("-").map(Number);
        const ultimoDia = new Date(Date.UTC(anio, mes, 0)).getUTCDate();
        const mismoMes = inicio.slice(0, 7) === fin.slice(0, 7);
        if (!mismoMes || !((diaInicio === 1 && diaFin === 15) || (diaInicio === 16 && diaFin === ultimoDia))) {
            throw error("La meta debe corresponder a la primera quincena o a la segunda quincena del mes.");
        }
    }

    validar(datos) {
        const periodoTipo = String(datos.periodo_tipo || "QUINCENA").toUpperCase();
        if (periodoTipo !== "QUINCENA") throw error("Las metas solo se manejan por quincena.");
        this.validarPeriodo(datos.periodo_inicio, datos.periodo_fin);
        const asesorId = Number(datos.asesor_id);
        const metaVentas = Number(datos.meta_ventas);
        const metaRecaudo = Number(datos.meta_recaudo);
        if (!Number.isInteger(asesorId) || asesorId <= 0) throw error("Debe seleccionar un asesor.");
        if (!Number.isInteger(metaVentas) || metaVentas < 0 || metaVentas > 1000000) throw error("La meta de ventas debe ser un entero entre 0 y 1.000.000.");
        if (!Number.isFinite(metaRecaudo) || metaRecaudo < 0 || metaRecaudo > 100000000000) throw error("La meta de recaudo debe ser un valor entre 0 y 100.000.000.000.");
        return { asesor_id: asesorId, periodo_tipo: periodoTipo, periodo_inicio: datos.periodo_inicio, periodo_fin: datos.periodo_fin, meta_ventas: metaVentas, meta_recaudo: metaRecaudo };
    }

    async listar(inicio, fin, asesorId = null) {
        this.validarPeriodo(inicio, fin);
        if (asesorId !== null && (!Number.isInteger(Number(asesorId)) || Number(asesorId) <= 0)) throw error("El asesor indicado no es válido.");
        return repository.listar(inicio, fin, asesorId);
    }

    async historial(inicio, fin, asesorId = null) {
        this.validarPeriodo(inicio, fin);
        if (asesorId !== null && (!Number.isInteger(Number(asesorId)) || Number(asesorId) <= 0)) throw error("El asesor indicado no es válido.");
        return repository.historial(inicio, fin, asesorId);
    }

    async guardar(datos, usuarioId) { return repository.guardar(this.validar(datos), usuarioId); }
}
module.exports = new MetasService();
