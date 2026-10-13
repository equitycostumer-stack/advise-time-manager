const repository = require("../repositories/registrosDiariosRepository");

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const MAX_IDS_LENGTH = 10000;

function error(mensaje, status = 400) {
    const resultado = new Error(mensaje);
    resultado.status = status;
    return resultado;
}

function fechaValida(valor) {
    if (!ISO_DATE.test(String(valor || ""))) return false;
    const [anio, mes, dia] = String(valor).split("-").map(Number);
    const ultimoDia = new Date(Date.UTC(anio, mes, 0)).getUTCDate();
    return mes >= 1 && mes <= 12 && dia >= 1 && dia <= ultimoDia;
}

function enteroNoNegativo(valor, campo) {
    const numero = Number(valor);
    if (!Number.isInteger(numero) || numero < 0 || numero > 1000000) {
        throw error(`${campo} debe ser un número entero entre 0 y 1.000.000.`);
    }
    return numero;
}

function textoIds(valor, campo) {
    const texto = String(valor ?? "").trim();
    if (texto.length > MAX_IDS_LENGTH) {
        throw error(`${campo} no puede superar ${MAX_IDS_LENGTH} caracteres.`);
    }
    return texto;
}

class RegistrosDiariosService {
    validar(datos) {
        const asesorId = Number(datos.asesor_id);
        if (!Number.isInteger(asesorId) || asesorId <= 0) throw error("Debe seleccionar un asesor.");
        if (!fechaValida(datos.fecha)) throw error("Debe indicar una fecha válida.");
        return {
            asesor_id: asesorId,
            fecha: datos.fecha,
            modo: datos.modo === "REEMPLAZAR" ? "REEMPLAZAR" : "ACUMULAR",
            datos_cantidad: enteroNoNegativo(datos.datos_cantidad, "La cantidad de datos"),
            datos_ids: textoIds(datos.datos_ids, "Los IDs de datos"),
            analisis_cantidad: enteroNoNegativo(datos.analisis_cantidad, "La cantidad de análisis"),
            analisis_ids: textoIds(datos.analisis_ids, "Los IDs de análisis")
        };
    }

    async listar(fechaDesde, fechaHasta, asesorId = null) {
        if (!fechaValida(fechaDesde) || !fechaValida(fechaHasta) || fechaDesde > fechaHasta) {
            throw error("El rango de fechas no es válido.");
        }
        return repository.listar({ fechaDesde, fechaHasta, asesorId });
    }

    async guardar(datos, usuarioId) {
        return repository.guardar(this.validar(datos), usuarioId);
    }
}

module.exports = new RegistrosDiariosService();
