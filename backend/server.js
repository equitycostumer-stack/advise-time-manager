// ======================================================
// EQUITY LINE PROFESSIONAL SERVICES
// TIME MANAGER
// SERVER
// ======================================================

require("dotenv").config();

// ======================================================
// CAPTURA DE ERRORES
// ======================================================

process.on("uncaughtException", (err) => {

    console.error("====================================");
    console.error("UNCAUGHT EXCEPTION");
    console.error(err);
    console.error(err.stack);
    console.error("====================================");

});

process.on("unhandledRejection", (reason) => {

    console.error("====================================");
    console.error("UNHANDLED REJECTION");
    console.error(reason);
    console.error("====================================");

});

// ======================================================
// VARIABLES
// ======================================================

console.log("====================================");
console.log("VARIABLES DE ENTORNO");
console.log("====================================");
console.log("JWT_SECRET:", process.env.JWT_SECRET || "❌ NO DEFINIDA");
console.log("JWT_EXPIRES_IN:", process.env.JWT_EXPIRES_IN || "❌ NO DEFINIDA");
console.log("PORT:", process.env.PORT || "5000 (Local)");
console.log("====================================");

// ======================================================
// IMPORTACIONES
// ======================================================

const express = require("express");
const cors = require("cors");

const app = express();

// ======================================================
// CONFIGURACIÓN CORS
// ======================================================

const corsOptions = {

    origin: [

        "http://localhost:5173",

        "https://advise-time-manager-seven.vercel.app"

    ],

    credentials: true,

    methods: [

        "GET",
        "POST",
        "PUT",
        "PATCH",
        "DELETE",
        "OPTIONS"

    ],

    allowedHeaders: [

        "Origin",
        "X-Requested-With",
        "Content-Type",
        "Accept",
        "Authorization"

    ]

};

app.use(cors(corsOptions));

app.options("*", cors(corsOptions));

// ======================================================
// MIDDLEWARES
// ======================================================

app.use(express.json());

app.use(express.urlencoded({ extended: true }));

// ======================================================
// CONEXIÓN MYSQL
// ======================================================

require("./config/db");

// ======================================================
// RUTAS
// ======================================================

console.log("Cargando rutas...");

app.use("/auth", require("./routes/authRoutes"));
console.log("✓ auth");

app.use("/dashboard", require("./routes/dashboardRoutes"));
console.log("✓ dashboard");

app.use("/asesores", require("./routes/asesores"));
console.log("✓ asesores");

app.use("/movimientos", require("./routes/movimientos"));
console.log("✓ movimientos");

app.use("/incidencias", require("./routes/incidencias"));
console.log("✓ incidencias");

app.use("/usuarios", require("./routes/usuariosRoutes"));
console.log("✓ usuarios");

// ======================================================
// RUTA PRINCIPAL
// ======================================================

app.get("/", (req, res) => {

    res.status(200).json({

        ok: true,

        mensaje: "EQUITY LINE API funcionando"

    });

});

// ======================================================
// HEALTH CHECK
// ======================================================

app.get("/health", (req, res) => {

    res.status(200).json({

        ok: true,

        status: "online",

        version: "1.0.0"

    });

});

// ======================================================
// SERVIDOR
// ======================================================

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {

    console.log("====================================");
    console.log("EQUITY LINE API");
    console.log(`Servidor iniciado en puerto ${PORT}`);
    console.log("====================================");

});

server.on("error", (err) => {

    console.error("ERROR DEL SERVIDOR");
    console.error(err);

});