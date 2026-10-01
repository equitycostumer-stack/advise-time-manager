const repository = require("../repositories/metasRepository");

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

class MetasService {
    validar(datos) {
        const periodoTipo = String(datos.periodo_tipo || "MES").toUpperCase();
        if (!["MES", "QUINCENA"].includes(periodoTipo)) throw new Error("El tipo de periodo no es válido.");
        if (!ISO_DATE.test(datos.periodo_inicio || "") || !ISO_DATE.test(datos.periodo_fin || "") || datos.periodo_inicio > datos.periodo_fin) {
            throw new Error("El periodo debe contener fechas válidas.");
        }
        const asesorId = Number(datos.asesor_id);
        const metaVentas = Number(datos.meta_ventas);
        const metaRecaudo = Number(datos.meta_recaudo);
        if (!Number.isInteger(asesorId) || asesorId <= 0) throw new Error("Debe seleccionar un asesor.");
        if (!Number.isFinite(metaVentas) || metaVentas < 0 || !Number.isFinite(metaRecaudo) || metaRecaudo < 0) {
            throw new Error("Las metas deben ser números mayores o iguales a cero.");
        }
        return { asesor_id: asesorId, periodo_tipo: periodoTipo, periodo_inicio: datos.periodo_inicio, periodo_fin: datos.periodo_fin, meta_ventas: metaVentas, meta_recaudo: metaRecaudo };
    }

    async listar(periodoInicio, periodoFin) {
        if (!ISO_DATE.test(periodoInicio || "") || !ISO_DATE.test(periodoFin || "")) throw new Error("El periodo no es válido.");
        return repository.listar(periodoInicio, periodoFin);
    }

    async guardar(datos, usuarioId) {
        return repository.guardar(this.validar(datos), usuarioId);
    }
}

module.exports = new MetasService();
