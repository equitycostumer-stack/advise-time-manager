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
    res.status(200).send("EQUITY LINE API funcionando");
});

// =====================================
// HEALTH CHECK
// =====================================

app.get("/health", (req, res) => {
    res.status(200).json({
        status: "ok"
    });
});

// =====================================
// INICIAR SERVIDOR
// =====================================

const PORT = process.env.PORT || 5000;

app.listen(PORT, "0.0.0.0", () => {

    console.log("====================================");
    console.log(" EQUITY LINE API");
    console.log("====================================");
    console.log(`Servidor iniciado en puerto ${PORT}`);
    console.log("");

});