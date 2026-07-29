require("dotenv").config();

const express = require("express");
const cors = require("cors");

const app = express();

// =====================================
// MIDDLEWARES
// =====================================

app.use(cors());
app.use(express.json());

// =====================================
// CONEXIÓN A MYSQL
// =====================================

require("./config/db");

// =====================================
// RUTAS
// =====================================

app.use("/asesores", require("./routes/asesores"));
app.use("/movimientos", require("./routes/movimientos"));
app.use("/dashboard", require("./routes/dashboardRoutes"));
app.use("/incidencias", require("./routes/incidencias"));

// =====================================
// RUTA PRINCIPAL
// =====================================

app.get("/", (req, res) => {
    res.send("EQUITY LINE API funcionando");
});

// =====================================
// INICIAR SERVIDOR
// =====================================

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {

    console.clear();

    console.log("====================================");
    console.log(" EQUITY LINE API");
    console.log("====================================");
    console.log(`Servidor: http://localhost:${PORT}`);
    console.log("");

});