const mysql = require("mysql2");

// Verificar qué variables está recibiendo Railway
console.log("====================================");
console.log(" VARIABLES DE ENTORNO MYSQL");
console.log("====================================");
console.log("MYSQLHOST:", process.env.MYSQLHOST);
console.log("MYSQLUSER:", process.env.MYSQLUSER);
console.log("MYSQLPASSWORD:", process.env.MYSQLPASSWORD ? "********" : "NO DEFINIDA");
console.log("MYSQLDATABASE:", process.env.MYSQLDATABASE);
console.log("MYSQLPORT:", process.env.MYSQLPORT);
console.log("====================================");

const connection = mysql.createConnection({
    host: process.env.MYSQLHOST,
    user: process.env.MYSQLUSER,
    password: process.env.MYSQLPASSWORD,
    database: process.env.MYSQLDATABASE,
    port: Number(process.env.MYSQLPORT) || 3306
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