const express = require("express");
const router = express.Router();
const db = require("../config/db");
const verificarToken = require("../middleware/authMiddleware");
const verificarRol = require("../middleware/rolesMiddleware");

router.use(verificarToken, verificarRol("ADMINISTRADOR"));

router.get("/", async (req, res) => {
    try {
        const { rows } = await db.query(`
            SELECT id, dia_semana, nombre_dia, activo,
                   TO_CHAR(hora_entrada, 'HH24:MI') AS hora_entrada,
                   TO_CHAR(hora_salida, 'HH24:MI') AS hora_salida,
                   tolerancia_minutos, break_max, bano_max, almuerzo_max,
                   actualizado_por, actualizado_en
            FROM configuracion_horarios ORDER BY dia_semana
        `);
        return res.json({ ok: true, horarios: rows });
    } catch (error) {
        console.error("Error consultando horarios:", error);
        return res.status(500).json({ ok: false, mensaje: "No fue posible consultar los horarios." });
    }
});

router.put("/", async (req, res) => {
    const horarios = req.body?.horarios;
    if (!Array.isArray(horarios) || horarios.length !== 7) {
        return res.status(400).json({ ok: false, mensaje: "Debe enviar la configuración de los siete días." });
    }
    try {
        for (const h of horarios) {
                const dia = Number(h.dia_semana);
                if (!Number.isInteger(dia) || dia < 0 || dia > 6) throw new Error("Día inválido.");
                const enter = h.activo ? String(h.hora_entrada || "") : "";
                const salida = h.activo ? String(h.hora_salida || "") : "";
                if (h.activo && (!/^([01]\d|2[0-3]):[0-5]\d$/.test(enter) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(salida))) throw new Error(`Horario inválido para ${h.nombre_dia || dia}.`);
                for (const key of ["tolerancia_minutos", "break_max", "bano_max", "almuerzo_max"]) if (!Number.isInteger(Number(h[key])) || Number(h[key]) < 0) throw new Error(`Valor inválido: ${key}.`);
                await db.query(`UPDATE configuracion_horarios SET activo=$1, hora_entrada=NULLIF($2,'')::time, hora_salida=NULLIF($3,'')::time, tolerancia_minutos=$4, break_max=$5, bano_max=$6, almuerzo_max=$7, actualizado_por=$8, actualizado_en=NOW() WHERE dia_semana=$9`, [Boolean(h.activo), enter, salida, Number(h.tolerancia_minutos), Number(h.break_max), Number(h.bano_max), Number(h.almuerzo_max), req.usuario.id || null, dia]);
        }
        const { rows } = await db.query(`SELECT id, dia_semana, nombre_dia, activo, TO_CHAR(hora_entrada, 'HH24:MI') AS hora_entrada, TO_CHAR(hora_salida, 'HH24:MI') AS hora_salida, tolerancia_minutos, break_max, bano_max, almuerzo_max, actualizado_por, actualizado_en FROM configuracion_horarios ORDER BY dia_semana`);
        return res.json({ ok: true, horarios: rows });
    } catch (error) {
        console.error("Error actualizando horarios:", error);
        return res.status(400).json({ ok: false, mensaje: error.message || "No fue posible guardar los horarios." });
    }
});

module.exports = router;
