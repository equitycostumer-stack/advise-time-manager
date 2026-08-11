import { useEffect, useState } from "react";
import Login from "./pages/Login";
import { useAuth } from "./context/AuthContext";
import "./styles/app.css";
import Dashboard from "./components/Dashboard";
import api from "./services/api";

import Header from "./components/Header";
import AdvisorSelect from "./components/AdvisorSelect";
import Buttons from "./components/Buttons";
import StatusCard from "./components/StatusCard";
import MessageCard from "./components/MessageCard";
import Footer from "./components/Footer";
import WorkTimer from "./components/WorkTimer";
import BreakTimer from "./components/BreakTimer";
import ResumenJornada from "./components/ResumenJornada";
function App() {
const { usuario } = useAuth();

if (!localStorage.getItem("token")) {
    return <Login />;
}
    const [asesores, setAsesores] = useState([]);

    const [asesor, setAsesor] = useState("");

    const [estado, setEstado] = useState("Disponible");

    // Inicio del estado actual
    const [inicioEstado, setInicioEstado] = useState(null);

    // Inicio ORIGINAL de la jornada
    const [inicioJornada, setInicioJornada] = useState(null);
    const [resumen, setResumen] = useState(null);
    const [cargando, setCargando] = useState(true);


    // ==========================================
    // MENSAJES
    // ==========================================

    const mensajes = [

        "🌿 Inicia tu día con calma. Inhala profundo... exhala.",

        "💚 Hoy ayudarás a muchas personas.",

        "😊 Tu paz mental es más importante que cualquier llamada.",

        "☀️ Sonríe. Hoy será un excelente día.",

        "🌅 Cada llamada es una nueva oportunidad."

    ];


    const [mensaje] = useState(
        mensajes[
            Math.floor(
                Math.random() * mensajes.length
            )
        ]
    );


    // ==========================================
    // CARGAR ASESORES AL INICIAR
    // ==========================================

    useEffect(() => {

        cargarAsesores();

    }, []);


// ==========================================
// CUANDO CAMBIA EL ASESOR
// ==========================================

useEffect(() => {

    if (!asesor) {

        setEstado("Disponible");
        setInicioEstado(null);
        setInicioJornada(null);
        setResumen(null);

        return;

    }

    (async () => {

        await cargarEstado();
        await cargarResumen();

    })();

}, [asesor]);

// ==========================================
// OBTENER ASESORES
// ==========================================

async function cargarAsesores() {

    try {

        setCargando(true);

        const { data } = await api.get("/asesores");

        console.log("==================================");
        console.log("👥 ASESORES RECIBIDOS");
        console.log(data);
        console.log("==================================");

        const lista = Array.isArray(data) ? data : [];

        setAsesores(lista);

    } catch (error) {

        console.error("❌ ERROR CARGANDO ASESORES");

        console.error(error);

        if (error.response) {

            console.error("STATUS:", error.response.status);
            console.error(error.response.data);

        }

        setAsesores([]);

    } finally {

        setCargando(false);

    }

}

// ==========================================
// OBTENER ESTADO ACTUAL
// ==========================================

async function cargarEstado() {

    try {

        const { data } = await api.get(
    `/movimientos/estado/${asesor}`
);
console.log("================================");
console.log("ESTADO DEVUELTO POR API");
console.log(JSON.stringify(data, null, 2));
console.log("================================");

        if (!data || !data.estado) {

    setEstado("Disponible");
    setInicioEstado(null);
    setInicioJornada(null);
    return;

}

        const estadoBackend = String(data.estado)
            .trim()
            .toUpperCase();

        setInicioEstado(data.inicio_estado || null);
        setInicioJornada(data.inicio_jornada || null);

        switch (estadoBackend) {

            case "TRABAJANDO":
                setEstado("🟢 Trabajando");
                break;

            case "BREAK":
                setEstado("☕ Break");
                break;

            case "ALMUERZO":
                setEstado("🍽 Almuerzo");
                break;

            case "BANO":
            case "BAÑO":
                setEstado("🚻 Baño");
                break;

            case "CAPACITACION":
            case "CAPACITACIÓN":
                setEstado("📚 Capacitación");
                break;

            case "REUNION":
            case "REUNIÓN":
                setEstado("👥 Reunión");
                break;

            case "SALIDA":
                setEstado("🔴 Salida");
                break;

            default:
                setEstado("Disponible");
                break;

        }

    } catch (error) {

        console.error("ERROR CARGANDO ESTADO");
        console.error(error);

        setEstado("Disponible");
        setInicioEstado(null);
        setInicioJornada(null);

    }

}

// ==========================================
// OBTENER RESUMEN DEL DÍA
// ==========================================

async function cargarResumen() {

    try {

        const respuesta =
            await api.get(
                `/movimientos/resumen/${asesor}`
            );

        console.log(
            "RESUMEN RECIBIDO:",
            respuesta.data
        );

        const resumen =
            respuesta.data.data || null;

        setResumen(resumen);


if (resumen?.jornada?.inicio_estado) {

    setInicioEstado(
        resumen.jornada.inicio_estado
    );

}

    } catch (error) {

        console.error(
            "ERROR CARGANDO RESUMEN:",
            error
        );

        setResumen(null);

        setInicioEstado(null);

        setInicioJornada(null);

    }

}
// ==========================================
    // CARGANDO
    // ==========================================

    if (cargando) {

        return (

            <h2
                style={{
                    textAlign: "center",
                    marginTop: "80px"
                }}
            >
                Cargando asesores...
            </h2>

        );

    }

    console.log("ESTADO:", estado);
    console.log("RESUMEN EN APP:", resumen);

    console.log("APP -> inicioJornada:", inicioJornada);
    console.log("APP -> inicioEstado:", inicioEstado);
    console.log("APP -> estado:", estado);

    // ==========================================
    // INTERFAZ
    // ==========================================

    return (

        <div className="container">

            <div className="card">

                <Header />

                {/* ============================== */}
                {/* SELECTOR DE ASESOR */}
                {/* ============================== */}

                <AdvisorSelect
                    asesores={asesores}
                    asesor={asesor}
                    setAsesor={setAsesor}
                />

                {/* ============================== */}
                {/* BOTONES */}
                {/* ============================== */}

                <Buttons
                    asesor={asesor}
                    estado={estado}
                    setEstado={setEstado}
                    setResumen={setResumen}
                    onMovimientoRegistrado={async () => {

                        await cargarEstado();
                        await cargarResumen();

                    }}
                />

                {/* ============================== */}
                {/* ESTADO */}
                {/* ============================== */}

                <StatusCard
                    estado={estado}
                />
              
                {/* ============================== */}
                {/* CONTADOR DE JORNADA */}
                {/* ============================== */}
                 
                 <WorkTimer
                     estado={estado}
                    inicioJornada={inicioJornada}
                />

                {/* ============================== */}
                {/* CONTADOR DE BREAK */}
                {/* ============================== */}

                <BreakTimer
                    estado={estado}
                    inicioEstado={inicioEstado}
                />

                {/* ============================== */}
                {/* RESUMEN DE JORNADA */}
                {/* ============================== */}

                <ResumenJornada
    resumen={resumen}
    asesor={asesores.find(a => a.id === Number(asesor))}
/>

                {/* ============================== */}
                {/* MENSAJE */}
                {/* ============================== */}

                <MessageCard
                    mensaje={mensaje}
                />

                {/* ============================== */}
                {/* FOOTER */}
                {/* ============================== */}

                <Footer />

                {/* ============================== */}
                {/* DASHBOARD */}
                {/* ============================== */}

                <Dashboard />

            </div>

        </div>

    );

}

export default App;