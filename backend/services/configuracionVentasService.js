const repository = require("../repositories/configuracionVentasRepository");
class ConfiguracionVentasService {
    async obtener() { return repository.obtener(); }
    async actualizar(datos, usuarioId) {
        const criterio = String(datos.criterio_ranking || "RECAUDO").toUpperCase();
        if (!["RECAUDO", "VALOR_VENDIDO", "CANTIDAD_VENTAS"].includes(criterio)) throw new Error("Criterio de ranking inválido.");
        const moneda = String(datos.moneda || "USD").trim().toUpperCase();
        const simbolo = String(datos.simbolo_moneda || "$ ").trim();
        if (!moneda || !simbolo) throw new Error("Moneda y símbolo son obligatorios.");
        return repository.actualizar({ moneda, simbolo_moneda: simbolo, permitir_recaudo: Boolean(datos.permitir_recaudo), permitir_recaudo_cero: Boolean(datos.permitir_recaudo_cero), recaudo_no_supera_venta: Boolean(datos.recaudo_no_supera_venta), ranking_activo: Boolean(datos.ranking_activo), ranking_visible_asesores: Boolean(datos.ranking_visible_asesores), criterio_ranking: criterio }, usuarioId);
    }
}
module.exports = new ConfiguracionVentasService();
