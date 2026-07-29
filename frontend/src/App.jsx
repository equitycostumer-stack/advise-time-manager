import { useEffect, useState } from "react";
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

            return;

        }

        cargarEstado();

    }, [asesor]);


    // ==========================================
    // OBTENER ASESORES
    // ==========================================

    async function cargarAsesores() {

        try {

            const respuesta =
                await api.get("/asesores");

            console.log(
                "ASESORES RECIBIDOS:",
                respuesta.data
            );

            setAsesores(
                Array.isArray(respuesta.data)
                    ? respuesta.data
                    : []
            );

        } catch (error) {

            console.error(
                "ERROR CARGANDO ASESORES:",
                error
            );

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

            const respuesta =
                await api.get(
                    `/movimientos/estado/${asesor}`
                );

            console.log(
                "ESTADO RECIBIDO:",
                respuesta.data
            );


            const datos = respuesta.data;


            // ==========================================
            // SI NO EXISTE ESTADO
            // ==========================================

            if (!datos || !datos.estado) {

                setEstado("Disponible");
                setInicioEstado(null);
                setInicioJornada(null);

                return;

            }


            const estadoBackend =
                String(datos.estado).toUpperCase();


            // ==========================================
            // INICIO DEL ESTADO ACTUAL
            // ==========================================

            setInicioEstado(
                datos.inicio_estado || null
            );


            // ==========================================
            // INICIO REAL DE LA JORNADA
            // ==========================================


            if (
                datos.inicio_jornada
            ) {

                setInicioJornada(
                    datos.inicio_jornada
                );

            } else {

                setInicioJornada(null);

            }


            // ==========================================
            // TRABAJANDO
            // ==========================================

            if (

                estadoBackend === "ENTRADA" ||

                estadoBackend === "TRABAJANDO" ||

                estadoBackend === "BREAK_FIN" ||

                estadoBackend === "ALMUERZO_FIN" ||

                estadoBackend === "BANO_FIN" ||

                estadoBackend === "CAPACITACION_FIN" ||

                estadoBackend === "REUNION_FIN"

            ) {

                setEstado(
                    "🟢 Trabajando"
                );

                return;

            }


            // ==========================================
            // BREAK
            // ==========================================

            if (

                estadoBackend === "BREAK" ||

                estadoBackend === "BREAK_INICIO"

            ) {

                setEstado(
                    "☕ Break"
                );

                return;

            }


            // ==========================================
            // ALMUERZO
            // ==========================================

            if (

                estadoBackend === "ALMUERZO" ||

                estadoBackend === "ALMUERZO_INICIO"

            ) {

                setEstado(
                    "🍽 Almuerzo"
                );

                return;

            }


            // ==========================================
            // BAÑO
            // ==========================================

            if (

                estadoBackend === "BANO" ||

                estadoBackend === "BANO_INICIO"

            ) {

                setEstado(
                    "🚻 Baño"
                );

                return;

            }


            // ==========================================
            // CAPACITACIÓN
            // ==========================================

            if (

                estadoBackend === "CAPACITACION" ||

                estadoBackend === "CAPACITACION_INICIO"

            ) {

                setEstado(
                    "📚 Capacitación"
                );

                return;

            }


            // ==========================================
            // REUNIÓN
            // ==========================================

            if (

                estadoBackend === "REUNION" ||

                estadoBackend === "REUNION_INICIO"

            ) {

                setEstado(
                    "👥 Reunión"
                );

                return;

            }


            // ==========================================
            // SALIDA
            // ==========================================

            if (
                estadoBackend === "SALIDA"
            ) {

                setEstado(
                    "🔴 Salida"
                );

                /*
                 * Al salir termina la jornada visual.
                 * No borramos inicioJornada aquí porque
                 * puede ser útil para datos internos,
                 * pero WorkTimer no se mostrará.
                 */

                return;

            }


            // ==========================================
            // CUALQUIER OTRO ESTADO
            // ==========================================

            setEstado("Disponible");

        } catch (error) {

            console.error(
                "ERROR CARGANDO ESTADO:",
                error
            );

            setEstado("Disponible");
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


    // ==========================================
    // INTERFAZ
    // ==========================================
console.log("RESUMEN EN APP:", resumen);
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

    onMovimientoRegistrado={
        cargarEstado
    }

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
<ResumenJornada

    resumen={resumen}

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

<Dashboard />

</div>

</div>

    );

}

export default App;