const mysql = require("mysql2");

const connection = mysql.createConnection({
    host: "127.0.0.1",
    user: "root",
    password: "",
    database: "equityline",
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