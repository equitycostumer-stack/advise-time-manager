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

      await client.query("SELECT 1");
      console.log("✅ Base de datos lista; zona horaria Colombia configurada");
      client.release();
    } catch (err) {
      console.error("❌ Error de conexión PostgreSQL:", err.code || err.message);
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