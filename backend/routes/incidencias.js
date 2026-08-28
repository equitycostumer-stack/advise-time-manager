// ======================================================
// ADVISE SOLUTIONS SERVICES - TIME MANAGER
// RUTAS DE INCIDENCIAS (POSTGRESQL / SUPABASE)
// ======================================================

const express = require("express");
const router = express.Router();

const db = require("../config/db");

const {
    revisarIncidencia,
    registrarPausaLlamadas,
    finalizarPausaLlamadas,
    obtenerPausaActiva
} = require("../controllers/incidenciasController");

const verificarToken = require("../middleware/authMiddleware");
const verificarPropioAsesor = require("../middleware/verificarPropioAsesor");

router.use(verificarToken);

// ======================================================
// INCIDENCIAS PENDIENTES (Dashboard)
// ======================================================

router.get("/", async (req, res) => {
  const sql = `
    SELECT
      i.id,
      i.asesor_id,
      i.tipo,
      i.nivel,
      i.detalle,
      i.fecha_hora,
      i.revisada,
      i.revisada_por,
      i.comentario,
      i.fecha_revision,
      i.fecha_fin,
      a.nombre
    FROM incidencias i
    INNER JOIN asesores a
      ON a.id = i.asesor_id
    WHERE
      i.revisada = 0
      AND DATE(i.fecha_hora) = CURRENT_DATE
    ORDER BY
      i.fecha_hora DESC
  `;

  try {
    const { rows } = await db.query(sql);
    res.json(rows);
  } catch (err) {
    console.error("❌ Error obteniendo incidencias pendientes:", err);
    return res.status(500).json({
      ok: false,
      mensaje: "Error obteniendo incidencias."
    });
  }
});

// ======================================================
// HISTORIAL COMPLETO DE INCIDENCIAS DEL DÍA
// ======================================================

router.get("/asesor/:asesorId", async (req, res) => {
  const sql = `
    SELECT
      id,
      tipo,
      nivel,
      detalle AS descripcion,
      fecha_hora,
      revisada,
      revisada_por,
      comentario,
      fecha_revision,
      fecha_fin
    FROM incidencias
    WHERE
      asesor_id = $1
      AND DATE(fecha_hora) = CURRENT_DATE
    ORDER BY
      fecha_hora DESC
  `;

  try {
    const { rows } = await db.query(sql, [req.params.asesorId]);
    res.json({
      ok: true,
      incidencias: rows
    });
  } catch (err) {
    console.error("❌ Error obteniendo historial por asesor:", err);
    return res.status(500).json({
      ok: false,
      mensaje: "Error obteniendo historial."
    });
  }
});

// ======================================================
// REVISAR INCIDENCIA
// ======================================================

router.put(
  "/:id/revisar",
  revisarIncidencia
);

router.post(
  "/pausa",
  verificarPropioAsesor,
  registrarPausaLlamadas
);

router.put(
  "/pausa/:id/fin",
  finalizarPausaLlamadas
);

router.get(
  "/pausa/activa/:asesorId",
  verificarPropioAsesor,
  obtenerPausaActiva
);

// ======================================================
// HISTORIAL DE INCIDENCIAS POR FECHA (Para el Modal)
// ======================================================
router.get("/historial", async (req, res) => {
  const { fecha } = req.query;
  const fechaConsulta = fecha || new Date().toISOString().split("T")[0];

  const sql = `
    SELECT
      i.id,
      i.asesor_id,
      i.tipo,
      i.nivel,
      i.detalle,
      i.fecha_hora,
      i.revisada,
      i.revisada_por,
      i.comentario,
      i.fecha_revision,
      i.fecha_fin,
      a.nombre
    FROM incidencias i
    INNER JOIN asesores a
      ON a.id = i.asesor_id
    WHERE DATE(i.fecha_hora) = $1
    ORDER BY i.fecha_hora DESC
  `;

  try {
    const { rows } = await db.query(sql, [fechaConsulta]);
    res.json({
      ok: true,
      incidencias: rows
    });
  } catch (err) {
    console.error("❌ Error obteniendo historial por fecha:", err);
    return res.status(500).json({
      ok: false,
      mensaje: "Error obteniendo historial de incidencias."
    });
  }
});

module.exports = router;