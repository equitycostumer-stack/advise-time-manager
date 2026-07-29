const mysql = require("mysql2");

// =====================================
// DIAGNÓSTICO DE VARIABLES DE ENTORNO
// =====================================

console.log("====================================");
console.log(" VARIABLES DE ENTORNO MYSQL");
console.log("====================================");
console.log("MYSQLHOST:", process.env.MYSQLHOST || "NO DEFINIDA");
console.log("MYSQLPORT:", process.env.MYSQLPORT || "NO DEFINIDA");
console.log("MYSQLDATABASE:", process.env.MYSQLDATABASE || "NO DEFINIDA");
console.log("MYSQLUSER:", process.env.MYSQLUSER || "NO DEFINIDA");
console.log(
    "MYSQLPASSWORD:",
    process.env.MYSQLPASSWORD ? "********" : "NO DEFINIDA"
);
console.log("====================================");

// =====================================
// CONEXIÓN MYSQL
// =====================================

const connection = mysql.createConnection({
    host: process.env.MYSQLHOST,
    port: Number(process.env.MYSQLPORT || 3306),
    user: process.env.MYSQLUSER,
    password: process.env.MYSQLPASSWORD,
    database: process.env.MYSQLDATABASE,
    connectTimeout: 10000
});

// =====================================
// CONECTAR
// =====================================

connection.connect((err) => {
    if (err) {
        console.error("❌ Error conectando a MySQL");
        console.error(err);
        process.exit(1);
    }

    console.log("✅ Conectado correctamente a MySQL");
});

module.exports = connection;