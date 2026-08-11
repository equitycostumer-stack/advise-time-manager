// ======================================================
// EQUITY LINE PROFESSIONAL SERVICES
// TIME MANAGER
// MYSQL CONNECTION
// ======================================================

const mysql = require("mysql2");

// ======================================================
// POOL DE CONEXIONES
// ======================================================

const pool = mysql.createPool({

    host: process.env.DB_HOST,

    port: Number(process.env.DB_PORT),

    user: process.env.DB_USER,

    password: process.env.DB_PASSWORD,

    database: process.env.DB_NAME,

    waitForConnections: true,

    connectionLimit: 10,

    maxIdle: 10,

    idleTimeout: 60000,

    queueLimit: 0,

    enableKeepAlive: true,

    keepAliveInitialDelay: 0,

    connectTimeout: 30000,

    charset: "utf8mb4",

    timezone: "-05:00",

    // Evita conversiones automáticas de fechas
    dateStrings: true

});

// ======================================================
// VERIFICAR CONEXIÓN
// ======================================================

pool.getConnection((err, connection) => {

    if (err) {

        console.error("❌ ERROR MYSQL");
        console.error(err);
        return;

    }

    connection.query(
        "SET time_zone='-05:00'",
        (e) => {

            if (e) {

                console.error("No fue posible cambiar la zona horaria");
                console.error(e);

            }

            connection.query(

                `
                SELECT

                    DATABASE() AS base,

                    @@hostname AS servidor,

                    @@port AS puerto,

                    USER() AS usuario,

                    @@system_time_zone AS zona_servidor,

                    @@session.time_zone AS zona_sesion,

                    NOW() AS fecha_mysql,

                    UTC_TIMESTAMP() AS fecha_utc,

                    CURRENT_TIMESTAMP() AS timestamp_mysql
                `,

                (error, rows) => {

                    if (error) {

                        console.error(error);

                    } else {

                        console.log(rows[0]);

                    }

                    connection.release();

                }

            );

        }

    );

});

// ======================================================
// EXPORTAR
// ======================================================

module.exports = pool;