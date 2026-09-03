// Divide este contenido en los cuatro archivos indicados.

// backend/repositories/configuracionVentasRepository.js
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

// backend/services/configuracionVentasService.js
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

// backend/controllers/configuracionVentasController.js
const service = require("../services/configuracionVentasService");
module.exports = {
    async obtener(req, res) { try { return res.json({ ok: true, data: await service.obtener() }); } catch (error) { return res.status(500).json({ ok: false, mensaje: error.message }); } },
    async actualizar(req, res) { try { return res.json({ ok: true, data: await service.actualizar(req.body, req.usuario?.id) }); } catch (error) { return res.status(400).json({ ok: false, mensaje: error.message }); } }
};

// backend/routes/configuracionVentas.js
const express = require("express");
const router = express.Router();
const controller = require("../controllers/configuracionVentasController");
const verificarToken = require("../middleware/authMiddleware");
const verificarRol = require("../middleware/rolesMiddleware");
router.get("/", verificarToken, controller.obtener);
router.put("/", verificarToken, verificarRol("ADMINISTRADOR"), controller.actualizar);
module.exports = router;
