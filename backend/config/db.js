// ======================================================
// ADVISE SOLUTIONS SERVICES
// TIME MANAGER
// POSTGRESQL (SUPABASE) CONNECTION
// ======================================================

const { Pool } = require("pg");
require("dotenv").config();

// ======================================================
// POOL DE CONEXIONES
// ======================================================

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // Requerido para Supabase
  },
  max: 10,
  idleTimeoutMillis: 60000,
  connectionTimeoutMillis: 30000
});

// Configurar zona horaria automáticamente en cada nueva conexión del pool
pool.on("connect", async (client) => {
  try {
    await client.query("SET TIME ZONE 'America/Bogota';");
  } catch (err) {
    console.error("❌ Error configurando la zona horaria en el cliente PostgreSQL:", err);
  }
});

// ======================================================
// VERIFICAR CONEXIÓN Y DIAGNÓSTICO (Solo en desarrollo/producción)
// ======================================================

if (process.env.NODE_ENV !== "test") {
  (async () => {
    try {
      const client = await pool.connect();
      console.log("✅ Conexión exitosa a PostgreSQL (Supabase)");

      const res = await client.query(`
        SELECT 
          current_database() AS base,
          inet_server_addr() AS servidor,
          inet_server_port() AS puerto,
          current_user AS usuario,
          current_setting('TIMEZONE') AS zona_sesion,
          NOW() AS fecha_postgres,
          NOW() AT TIME ZONE 'UTC' AS fecha_utc,
          CURRENT_TIMESTAMP AS timestamp_postgres
      `);

      console.log("📊 Diagnóstico de conexión:", res.rows[0]);
      client.release();
    } catch (err) {
      console.error("❌ ERROR POSTGRESQL (SUPABASE):");
      console.error(err);
    }
  })();
}

// ======================================================
// EXPORTAR MÉTODO QUERY Y POOL
// ======================================================

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool
};