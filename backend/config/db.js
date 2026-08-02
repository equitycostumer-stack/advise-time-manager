const mysql = require("mysql2");

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: Number(process.env.DB_PORT) || 3306,

    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,

    enableKeepAlive: true,
    keepAliveInitialDelay: 0
});

// Verificar conexión al iniciar
pool.getConnection((err, connection) => {

    if (err) {
        console.error("❌ Error conectando a MySQL");
        console.error(err);
        return;
    }

    console.log("✅ Conectado a MySQL");

    connection.query(
        `
        SELECT
            DATABASE() AS base,
            @@hostname AS servidor,
            @@port AS puerto,
            USER() AS usuario
        `,
        (error, rows) => {

            if (!error) {
                console.log("====================================");
                console.log("CONEXIÓN MYSQL");
                console.log(rows[0]);
                console.log("====================================");
            }

            connection.release();

        }
    );

});

module.exports = pool;