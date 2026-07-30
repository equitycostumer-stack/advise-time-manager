const mysql = require("mysql2");

const connection = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: Number(process.env.DB_PORT) || 3306
});

connection.connect((err) => {
    if (err) {
        console.error("❌ Error conectando a MySQL");
        console.error(err);
        return;
    }

    console.log("✅ Conectado a MySQL");
});

module.exports = connection;