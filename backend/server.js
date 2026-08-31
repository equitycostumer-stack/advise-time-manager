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
console.log("JWT_SECRET:", process.env.JWT_SECRET ? "DEFINIDA ✅" : "NO DEFINIDA ❌");
console.log("JWT_EXPIRES_IN:", process.env.JWT_EXPIRES_IN || "NO DEFINIDA");
console.log("PORT:", process.env.PORT || 5000);
console.log("====================================");

// ======================================================
// IMPORTACIONES
// ======================================================

const express = require("express");
const cors = require("cors");

const app = express();

// ======================================================
// CORS
// ======================================================

const corsOptions = {
    origin: (origin, callback) => {

        const allowedOrigins = [
            "http://localhost:5173",
            "https://advise-time-manager-seven.vercel.app"
        ];

        // Permitir peticiones sin Origin
        // (Postman, servidor, etc.)
        if (!origin) {
            return callback(null, true);
        }

        if (allowedOrigins.includes(origin)) {
            return callback(null, true);
        }

        return callback(
            new Error(`Origen no permitido por CORS: ${origin}`)
        );
    },

    methods: [
        "GET",
        "POST",
        "PUT",
        "PATCH",
        "DELETE",
        "OPTIONS"
    ],

    allowedHeaders: [
        "Content-Type",
        "Authorization"
    ],

    credentials: true,

    optionsSuccessStatus: 204
};

app.use(cors(corsOptions));

// ======================================================
// MIDDLEWARES
// ======================================================

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ======================================================
// MYSQL
// ======================================================

require("./config/db");

// ======================================================
// RUTAS API
// ======================================================

console.log("Cargando rutas...");

app.use("/api/auth", require("./routes/authRoutes"));
console.log("✓ auth");

app.use("/api/dashboard", require("./routes/dashboardRoutes"));
console.log("✓ dashboard");

app.use("/api/asesores", require("./routes/asesores"));
console.log("✓ asesores");

app.use("/api/movimientos", require("./routes/movimientos"));
app.use("/api/horarios", require("./routes/horarios"));
console.log("✓ movimientos");

app.use("/api/incidencias", require("./routes/incidencias"));
console.log("✓ incidencias");

app.use("/api/ventas", require("./routes/ventas"));
console.log("✓ ventas");

app.use("/api/reportes", require("./routes/reportes"));
console.log("✓ reportes");

app.use("/api/usuarios", require("./routes/usuariosRoutes"));
console.log("✓ usuarios");

app.use("/api/notificaciones", require("./routes/notificaciones"));

// ======================================================
// RUTA PRINCIPAL
// ======================================================

app.get("/", (req, res) => {

    res.json({
        ok: true,
        mensaje: "EQUITY LINE API funcionando"
    });

});

// ======================================================
// HEALTH
// ======================================================

app.get("/health", (req, res) => {

    res.json({
        ok: true,
        status: "online"
    });

});

// ======================================================
// 404
// ======================================================

app.use((req, res) => {

    res.status(404).json({
        ok: false,
        mensaje: `Ruta no encontrada: ${req.originalUrl}`
    });

});

// ======================================================
// SERVIDOR
// ======================================================

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {

    console.log("====================================");
    console.log("EQUITY LINE API");
    console.log(`Servidor iniciado en puerto ${PORT}`);
    console.log("====================================");

});