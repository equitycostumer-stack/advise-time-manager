const mysql = require("mysql2");

console.log("====================================");
console.log(" VARIABLES DE ENTORNO MYSQL");
console.log("====================================");
console.log("DB_HOST:", process.env.DB_HOST);
console.log("DB_USER:", process.env.DB_USER);
console.log("DB_NAME:", process.env.DB_NAME);
console.log("PORT:", process.env.PORT);
console.log("====================================");

const connection = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: 3306
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