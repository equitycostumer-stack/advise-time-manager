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

    // Revisa si ya existe una incidencia igual SIN revisar hoy (Sintaxis PostgreSQL)
    const verificar = `
      SELECT id
      FROM incidencias
      WHERE asesor_id = $1
        AND tipo = $2
        AND revisada = false
        AND DATE(fecha_hora) = DATE($3)
      LIMIT 1
    `;

    const { rows } = await db.query(verificar, [asesorId, tipo, fechaHora]);

    // Si ya existe la incidencia, se ignora
    if (rows && rows.length > 0) {
      return;
    }

    // Insertar registro
    const sql = `
      INSERT INTO incidencias (
        asesor_id,
        tipo,
        nivel,
        detalle,
        fecha_hora
      )
      VALUES ($1, $2, $3, $4, $5)
    `;

    await db.query(sql, [asesorId, tipo, nivel, detalle, fechaHora]);
  } catch (err) {
    console.error("❌ Error en registrarIncidencia:", err);
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
    revisada = true,
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

module.exports = {
  registrarIncidencia,
  revisarIncidencia
};