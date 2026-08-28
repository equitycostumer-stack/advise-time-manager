const db = require("../config/db");

// ==============================================
// GENERAR FECHA EN HORA COLOMBIA
// ==============================================

function generarFechaColombia() {
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: "America/Bogota",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false
  })
    .format(new Date())
    .replace(",", "");
}

// ==============================================
// REGISTRAR INCIDENCIA
// ==============================================

const registrarIncidencia = async (asesorId, tipo, nivel, detalle) => {
  try {
    const fechaHora = generarFechaColombia();

    // Revisa si ya existe una incidencia igual SIN revisar hoy (Usando 0 para falso en PostgreSQL)
    const verificar = `
      SELECT id
      FROM incidencias
      WHERE asesor_id = $1
        AND tipo = $2
        AND revisada = 0
        AND DATE(fecha_hora) = DATE($3)
      LIMIT 1
    `;

    const { rows } = await db.query(verificar, [asesorId, tipo, fechaHora]);

    // Si ya existe la incidencia, se ignora
    if (rows && rows.length > 0) {
      return;
    }

    // Insertar registro (por defecto revisada = 0)
    const sql = `
      INSERT INTO incidencias (
        asesor_id,
        tipo,
        nivel,
        detalle,
        fecha_hora,
        revisada
      )
      VALUES ($1, $2, $3, $4, $5, 0)
    `;

    await db.query(sql, [asesorId, tipo, nivel, detalle, fechaHora]);
  } catch (err) {
    console.error("❌ Error en registrarIncidencia:", err);
  }
};

// ==============================================
// REGISTRAR PAUSA DE LLAMADAS (auto-declarada por el asesor)
// ==============================================

const registrarPausaLlamadas = async (req, res) => {
  const { asesor_id, motivo, comentario } = req.body;

  if (!asesor_id || !motivo) {
    return res.status(400).json({
      ok: false,
      mensaje: "Falta el asesor o el motivo."
    });
  }

  try {
    const fechaHora = generarFechaColombia();

        const sql = `
      INSERT INTO incidencias (
        asesor_id,
        tipo,
        nivel,
        detalle,
        fecha_hora,
        fecha_fin,
        revisada,
        revisada_por,
        comentario,
        fecha_revision
      )
      VALUES ($1, 'PAUSA DE LLAMADAS', 'INFORMATIVA', $2, $3, NULL, 1, $4, $5, $3)
      RETURNING id
    `;

    const { rows } = await db.query(sql, [asesor_id, motivo, fechaHora, "Auto-registro (asesor)", comentario || null]);

    return res.json({
      ok: true,
      mensaje: "Pausa registrada correctamente.",
      id: rows[0].id
    });
  } catch (err) {
    console.error("❌ Error en registrarPausaLlamadas:", err);
    return res.status(500).json({
      ok: false,
      error: "No fue posible registrar la pausa."
    });
  }
};

// ==============================================
// REVISAR INCIDENCIA
// ==============================================

const revisarIncidencia = async (req, res) => {
  const { id } = req.params;
  const { coach, comentario } = req.body;

  try {
    const sql = `
      UPDATE incidencias
      SET
        revisada = 1,
        revisada_por = $1,
        comentario = $2,
        fecha_revision = NOW()
      WHERE id = $3
    `;

    await db.query(sql, [coach, comentario, id]);

    return res.json({
      ok: true,
      mensaje: "Incidencia revisada correctamente."
    });
  } catch (err) {
    console.error("❌ Error en revisarIncidencia:", err);
    return res.status(500).json({
      ok: false,
      error: "No fue posible revisar la incidencia."
    });
  }
};

// ==============================================
// FINALIZAR PAUSA DE LLAMADAS
// ==============================================

const finalizarPausaLlamadas = async (req, res) => {
  const { id } = req.params;

  try {
    const consulta = await db.query(
      `SELECT asesor_id FROM incidencias WHERE id = $1 AND tipo = 'PAUSA DE LLAMADAS'`,
      [id]
    );

    if (!consulta.rows.length) {
      return res.status(404).json({ ok: false, mensaje: "Pausa no encontrada." });
    }

    const esAdmin = req.usuario?.rol === "ADMINISTRADOR";
    const esPropia = Number(consulta.rows[0].asesor_id) === Number(req.usuario?.asesor_id);

    if (!esAdmin && !esPropia) {
      return res.status(403).json({ ok: false, mensaje: "No tiene permiso sobre esta pausa." });
    }

    const fechaHora = generarFechaColombia();

    await db.query(
      `UPDATE incidencias SET fecha_fin = $1 WHERE id = $2 AND fecha_fin IS NULL`,
      [fechaHora, id]
    );

    return res.json({ ok: true, mensaje: "Pausa finalizada correctamente." });
  } catch (err) {
    console.error("❌ Error en finalizarPausaLlamadas:", err);
    return res.status(500).json({ ok: false, error: "No fue posible finalizar la pausa." });
  }
};

// ==============================================
// OBTENER PAUSA ACTIVA (si el asesor tiene una sin cerrar hoy)
// ==============================================

const obtenerPausaActiva = async (req, res) => {
  const { asesorId } = req.params;

  try {
    const sql = `
      SELECT id, motivo:detalle AS motivo, detalle, fecha_hora
      FROM incidencias
      WHERE asesor_id = $1
        AND tipo = 'PAUSA DE LLAMADAS'
        AND fecha_fin IS NULL
        AND DATE(fecha_hora) = CURRENT_DATE
      ORDER BY fecha_hora DESC
      LIMIT 1
    `;

    const { rows } = await db.query(
      `SELECT id, detalle, fecha_hora
       FROM incidencias
       WHERE asesor_id = $1
         AND tipo = 'PAUSA DE LLAMADAS'
         AND fecha_fin IS NULL
         AND DATE(fecha_hora) = CURRENT_DATE
       ORDER BY fecha_hora DESC
       LIMIT 1`,
      [asesorId]
    );

    return res.json({ ok: true, pausa: rows[0] || null });
  } catch (err) {
    console.error("❌ Error en obtenerPausaActiva:", err);
    return res.status(500).json({ ok: false, error: "No fue posible consultar la pausa activa." });
  }
};

module.exports = {
  registrarIncidencia,
  registrarPausaLlamadas,
  finalizarPausaLlamadas,
  obtenerPausaActiva,
  revisarIncidencia
};