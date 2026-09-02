const db = require("../config/db");
class ConfiguracionVentasRepository {
    async obtener() {
        const result = await db.query(`SELECT id, moneda, simbolo_moneda, permitir_recaudo, permitir_recaudo_cero, recaudo_no_supera_venta, ranking_activo, ranking_visible_asesores, criterio_ranking, updated_at FROM configuracion_ventas WHERE id = 1 LIMIT 1`);
        return result.rows[0] || null;
    }
    async actualizar(datos, usuarioId) {
        const result = await db.query(`UPDATE configuracion_ventas SET moneda=$1, simbolo_moneda=$2, permitir_recaudo=$3, permitir_recaudo_cero=$4, recaudo_no_supera_venta=$5, ranking_activo=$6, ranking_visible_asesores=$7, criterio_ranking=$8, updated_at=NOW(), updated_by=$9 WHERE id=1 RETURNING id, moneda, simbolo_moneda, permitir_recaudo, permitir_recaudo_cero, recaudo_no_supera_venta, ranking_activo, ranking_visible_asesores, criterio_ranking, updated_at`, [datos.moneda, datos.simbolo_moneda, datos.permitir_recaudo, datos.permitir_recaudo_cero, datos.recaudo_no_supera_venta, datos.ranking_activo, datos.ranking_visible_asesores, datos.criterio_ranking, usuarioId || null]);
        return result.rows[0] || null;
    }
}
module.exports = new ConfiguracionVentasRepository();
