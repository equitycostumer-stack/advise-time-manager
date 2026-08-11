import { useEffect, useState } from "react";
import api from "../services/api";
import ExportarExcel from "./ExportarExcel";
import ExportarHistorial from "./ExportarHistorial";
import Alertas from "./Alertas";
import CentroIncidencias from "./CentroIncidencias";
import PanelIncidencias from "./PanelIncidencias";

export default function Dashboard() {

    const [asesores, setAsesores] = useState([]);
    const [incidencias, setIncidencias] = useState([]);
    const [historial, setHistorial] = useState([]);
    const [asesorSeleccionado, setAsesorSeleccionado] = useState(null);
    const [resumenJornada, setResumenJornada] = useState(null);
    const [incidenciasHistorial, setIncidenciasHistorial] = useState([]);
    const [ahora, setAhora] = useState(Date.now());

// =====================================================
// CARGAR DASHBOARD
// =====================================================

async function cargarDashboard() {

    try {

        const dashboard = await api.get("/dashboard");

console.log("====================================");
console.log("RESPUESTA COMPLETA");
console.log(dashboard.data);
console.log("====================================");

console.log("dashboard.data.asesores");
console.log(dashboard.data.asesores);

console.log("Array.isArray:");
console.log(Array.isArray(dashboard.data.asesores));

setAsesores(dashboard.data.asesores || []);

        const incidenciasRes = await api.get("/incidencias");

        console.log("INCIDENCIAS:", incidenciasRes.data);

        setIncidencias(incidenciasRes.data || []);

    } catch (error) {

        console.error("ERROR DASHBOARD");

        console.error(error);

        if (error.response) {

            console.error(error.response.data);

        }

    }

}
// =====================================================
// RELOJ DEL DASHBOARD
// =====================================================

useEffect(() => {

    const timer = setInterval(() => {

        setAhora(Date.now());

    }, 1000);

    return () => clearInterval(timer);

}, []);
// =====================================================
// VER HISTORIAL DE UN ASESOR
// =====================================================

async function verHistorial(asesor) {

    try {

        console.clear();

        console.log("========================================");
        console.log("📋 CARGANDO HISTORIAL");
        console.log("Asesor:", asesor.nombre);
        console.log("ID:", asesor.id);
        console.log("========================================");

        const [

            historialRes,

            resumenRes,

            incidenciasRes

        ] = await Promise.all([

            api.get(`/movimientos/historial/${asesor.id}`),

            api.get(`/movimientos/resumen/${asesor.id}`),

            api.get(`/incidencias/asesor/${asesor.id}`)

        ]);

        console.log("✅ Historial:", historialRes.data);
        console.log("✅ Resumen:", resumenRes.data);
        console.log("✅ Incidencias:", incidenciasRes.data);

        let movimientos = [];

        if (Array.isArray(historialRes.data)) {

            movimientos = historialRes.data;

        }

        else if (Array.isArray(historialRes.data?.data)) {

            movimientos = historialRes.data.data;

        }

        else if (Array.isArray(historialRes.data?.data?.movimientos)) {

            movimientos = historialRes.data.data.movimientos;

        }

        else if (

            Array.isArray(

                historialRes.data?.data?.data?.movimientos

            )

        ) {

            movimientos =

                historialRes.data.data.data.movimientos;

        }

        setHistorial(movimientos);

        setResumenJornada(

            resumenRes.data?.data?.resumen ||

            resumenRes.data?.resumen ||

            null

        );

        setIncidenciasHistorial(

            incidenciasRes.data?.data ||

            incidenciasRes.data ||

            []

        );

        setAsesorSeleccionado(asesor);

        console.log("✅ Historial abierto correctamente.");

    }

    catch (error) {

        console.error("========================================");
        console.error("❌ ERROR CARGANDO HISTORIAL");
        console.error("========================================");

        console.error(error);

        if (error.response) {

            console.error("STATUS:", error.response.status);

            console.error("URL:", error.config?.url);

            console.error("DATA:", error.response.data);

        }

        else if (error.request) {

            console.error("No hubo respuesta del servidor.");

            console.error(error.request);

        }

        else {

            console.error("Error:", error.message);

        }

        alert("No fue posible cargar el historial.");

    }

}
// =====================================================
// INICIALIZAR DASHBOARD
// =====================================================

useEffect(() => {

    cargarDashboard();

    const intervalo = setInterval(() => {

        cargarDashboard();

    }, 5000);

    return () => {

        clearInterval(intervalo);

    };

}, []);
console.log("==================================");
console.log("RENDER DASHBOARD");
console.log("ASESORES:", asesores);
console.log("TOTAL:", asesores.length);
console.log("==================================");
    // =====================================================
    // INTERFAZ
    // =====================================================

    return (

        <div
            style={{
                marginTop: 40,
                background: "#fff",
                borderRadius: 10,
                padding: 20
            }}
        >

            <h2>
                📊 Dashboard en tiempo real
            </h2>

            {/* =================================================
                INDICADORES
            ================================================= */}

            <div
                style={{
                    display: "grid",
                    gridTemplateColumns:
                        "repeat(auto-fit,minmax(180px,1fr))",
                    gap: "15px",
                    marginBottom: "25px",
                    marginTop: "20px"
                }}
            >

                {/* ASESORES */}

                <div
                    style={{
                        background: "#0d6efd",
                        color: "white",
                        padding: "15px",
                        borderRadius: "10px",
                        textAlign: "center"
                    }}
                >

                    <h2>
                        {asesores.length}
                    </h2>

                    <small>
                        👥 Asesores
                    </small>

                </div>

                {/* TRABAJANDO */}

                <div
                    style={{
                        background: "#198754",
                        color: "white",
                        padding: "15px",
                        borderRadius: "10px",
                        textAlign: "center"
                    }}
                >

                    <h2>
                        {
                            asesores.filter(
                                (a) =>
                                    a.estado === "TRABAJANDO"
                            ).length
                        }
                    </h2>

                    <small>
                        🟢 Trabajando
                    </small>

                </div>

                {/* BREAK */}

                <div
                    style={{
                        background: "#ffc107",
                        padding: "15px",
                        borderRadius: "10px",
                        textAlign: "center"
                    }}
                >

                    <h2>
                        {
                            asesores.filter(
                                (a) =>
                                    a.estado === "BREAK"
                            ).length
                        }
                    </h2>

                    <small>
                        ☕ Break
                    </small>

                </div>

                {/* ALMUERZO */}

                <div
                    style={{
                        background: "#fd7e14",
                        color: "white",
                        padding: "15px",
                        borderRadius: "10px",
                        textAlign: "center"
                    }}
                >

                    <h2>
                        {
                            asesores.filter(
                                (a) =>
                                    a.estado === "ALMUERZO"
                            ).length
                        }
                    </h2>

                    <small>
                        🍽 Almuerzo
                    </small>

                </div>

    {/* =====================================================
    INDICADOR: CAPACITACIÓN
===================================================== */}

<div
    style={{
        background: "#17a2b8",
        color: "white",
        padding: "15px",
        borderRadius: "10px",
        textAlign: "center"
    }}
>
    <h2>
        {
            asesores.filter(
                (a) => a.estado === "CAPACITACION"
            ).length
        }
    </h2>

    <small>
        📚 Capacitación
    </small>
</div>


{/* =====================================================
    INDICADOR: LLEGADAS TARDE
===================================================== */}

<div
    style={{
        background:
            asesores.some((a) => a.llego_tarde)
                ? "#dc3545"
                : "#198754",

        color: "white",

        padding: "15px",

        borderRadius: "10px",

        textAlign: "center",

        transition: "0.4s"
    }}
>
    <h2>
        {
            asesores.filter(
                (a) => a.llego_tarde
            ).length
        }
    </h2>

    <small>
        🚨 Llegadas tarde
    </small>
</div>

</div>


{/* =====================================================
    EXPORTAR EXCEL
===================================================== */}

<ExportarExcel
    asesores={asesores}
/>


{/* =====================================================
    TARJETAS DE ASESORES
===================================================== */}

<div
    style={{
        display: "grid",
        gridTemplateColumns:
            "repeat(auto-fit,minmax(200px,1fr))",
        gap: "20px",
        marginTop: "20px"
    }}
>

{
    asesores.map((a) => {

        // -------------------------------------------------
        // COLOR DEL ESTADO
        // -------------------------------------------------

        const colorEstado =
            a.estado === "TRABAJANDO"
                ? "#198754"
            : a.estado === "BREAK"
                ? "#ffc107"
            : a.estado === "ALMUERZO"
                ? "#fd7e14"
            : a.estado === "BANO"
                ? "#17a2b8"
            : a.estado === "CAPACITACION"
                ? "#0d6efd"
            : a.estado === "REUNION"
                ? "#6f42c1"
            : a.estado === "SALIDA"
                ? "#dc3545"
            : "#6c757d";

        // -------------------------------------------------
        // TEXTO DEL ESTADO
        // -------------------------------------------------

        const textoEstado =
            a.estado === "TRABAJANDO"
                ? "🟢 TRABAJANDO"
            : a.estado === "BREAK"
                ? "🟡 BREAK"
            : a.estado === "ALMUERZO"
                ? "🟠 ALMUERZO"
            : a.estado === "BANO"
                ? "🔵 BAÑO"
            : a.estado === "CAPACITACION"
                ? "🟣 CAPACITACIÓN"
            : a.estado === "REUNION"
                ? "⚫ REUNIÓN"
            : a.estado === "SALIDA"
                ? "🔴 SALIDA"
            : a.estado || "DISPONIBLE";

        return (

            <div
                key={a.id}
                style={{
                    background: "#ffffff",
                    borderRadius: "8px",
                    padding: "10px",
                    boxShadow:
                        "0 3px 10px rgba(0,0,0,0.15)",
                    border:
                        a.llego_tarde
                            ? "3px solid #dc3545"
                            : "1px solid #ddd",
                    borderLeft:
                        `8px solid ${colorEstado}`
                }}
            >

                {/* NOMBRE */}

                <h3
                    style={{
                        marginBottom: "8px",
                        fontSize: "18px",
                        fontWeight: "bold"
                    }}
                >
                    👤 {a.nombre}
                </h3>

                {/* ESTADO */}

                <p>
                    <strong>Estado</strong>
                    <br />
                    {textoEstado}
                </p>

                {/* =====================================================
                    HORA DE INICIO DEL ESTADO
                ===================================================== */}

                <p>
                    <strong>Inicio</strong>
                    <br />

                    {
                        a.inicio_estado
                            ? new Date(a.inicio_estado).toLocaleTimeString(
                                  [],
                                  {
                                      hour: "2-digit",
                                      minute: "2-digit"
                                  }
                              )
                            : "--:--"
                    }
                </p>

{/* =====================================================
    TIEMPO EN ESTADO
===================================================== */}

<p>
    <strong>⏱ Tiempo en estado</strong>
    <br />

    {(() => {

        if (!a.inicio_estado) {

            return "--:--:--";

        }

        if (a.estado === "SALIDA") {

            return "✅ Finalizado";

        }

        const inicio = new Date(a.inicio_estado);

        if (Number.isNaN(inicio.getTime())) {

            return "--:--:--";

        }

        const fechaActual = new Date(ahora);

        const diferencia = Math.max(
            0,
            Math.floor((fechaActual.getTime() - inicio.getTime()) / 1000)
        );

        const horas = Math.floor(diferencia / 3600);

        const minutos = Math.floor(
            (diferencia % 3600) / 60
        );

        const segundos = diferencia % 60;

        return `${String(horas).padStart(2, "0")}:${String(minutos).padStart(2, "0")}:${String(segundos).padStart(2, "0")}`;

    })()}

</p>


{/* =====================================================
    RETRASO
===================================================== */}

<p>

    <strong>Retraso</strong>

    <br />

    {

        a.llego_tarde

            ? `🔴 ${a.minutos_retraso ?? 0} min`

            : "🟢 Puntual"

    }

</p>


{/* =====================================================
    HISTORIAL
===================================================== */}

<button

    onClick={() => verHistorial(a)}

    style={{

        marginTop: "10px",

        width: "100%",

        padding: "10px",

        border: "none",

        borderRadius: "8px",

        background: "#0d6efd",

        color: "#fff",

        cursor: "pointer",

        fontWeight: "bold",

        transition: "0.2s"

    }}

>

    📋 Ver historial

</button>

            </div>
        );

    })}

</div>

{/* =====================================================
    ALERTAS
===================================================== */}

<Alertas
    asesores={asesores}
/>


{/* =====================================================
    CENTRO DE INCIDENCIAS
===================================================== */}

<CentroIncidencias
    incidencias={incidencias}
/>


{/* =====================================================
    PANEL DE INCIDENCIAS
===================================================== */}

<PanelIncidencias
    incidencias={incidencias}
    onActualizar={cargarDashboard}
/>


{/* =====================================================
    MODAL HISTORIAL
===================================================== */}

{

    asesorSeleccionado && (

        <div

            role="dialog"

            aria-modal="true"

            aria-labelledby="historial-titulo"

            onClick={(e) => {

                if (e.target === e.currentTarget) {

                    setAsesorSeleccionado(null);

                    setHistorial([]);

                }

            }}

            style={{

                position: "fixed",

                inset: 0,

                background: "rgba(0,0,0,.55)",

                display: "flex",

                justifyContent: "center",

                alignItems: "center",

                padding: "20px",

                zIndex: 9999

            }}

        >

            <div

                style={{

                    background: "#fff",

                    width: "100%",

                    maxWidth: "700px",

                    maxHeight: "90vh",

                    overflowY: "auto",

                    borderRadius: "14px",

                    padding: "25px",

                    boxShadow:
                        "0 12px 35px rgba(0,0,0,.30)"

                }}

            >

                <h2
                    id="historial-titulo"
                    style={{
                        marginTop: 0
                    }}
                >

                    📋 Historial de {asesorSeleccionado.nombre}

                </h2>

                <hr />

                {/* ==========================================
                    AQUÍ VAMOS A PONER EL RESUMEN DEL DÍA
                ========================================== */}

                {/* ==========================================
                    AQUÍ VAN A IR LAS ALERTAS DEL DÍA
                ========================================== */}
            
                     {/* =================================================
                            EXPORTAR HISTORIAL
                        ================================================= */}

                        <ExportarHistorial
                            historial={historial}
                            asesor={asesorSeleccionado}
                        />


                        {/* =================================================
                            MOVIMIENTOS
                        ================================================= */}

                        {
                            historial.length === 0

                                ? (

                                    <div
                                        style={{
                                            textAlign: "center",
                                            padding: "25px 10px",
                                            color: "#666"
                                        }}
                                    >

                                        <p
                                            style={{
                                                fontSize: "16px",
                                                margin: 0
                                            }}
                                        >
                                            📭 No hay movimientos hoy.
                                        </p>

                                    </div>

                                )

                                : (

                                    <div
                                        style={{
                                            marginTop: "15px"
                                        }}
                                    >

                                        {
                                            historial.map((m) => {

                                                // =================================================
                                                // NOMBRE AMIGABLE DEL MOVIMIENTO
                                                // =================================================

                                                const nombresMovimientos = {

                                                    ENTRADA:
                                                        "✅ Entrada",

                                                    SALIDA:
                                                        "🚪 Salida",

                                                    BREAK_INICIO:
                                                        "☕ Inicio Break",

                                                    BREAK_FIN:
                                                        "☕ Fin Break",

                                                    ALMUERZO_INICIO:
                                                        "🍽 Inicio Almuerzo",

                                                    ALMUERZO_FIN:
                                                        "🍽 Fin Almuerzo",

                                                    BANO_INICIO:
                                                        "🚻 Inicio Baño",

                                                    BANO_FIN:
                                                        "🚻 Fin Baño",

                                                    CAPACITACION_INICIO:
                                                        "📚 Inicio Capacitación",

                                                    CAPACITACION_FIN:
                                                        "📚 Fin Capacitación",

                                                    REUNION_INICIO:
                                                        "👥 Inicio Reunión",

                                                    REUNION_FIN:
                                                        "👥 Fin Reunión"

                                                };


                                                const nombreMovimiento =
                                                    nombresMovimientos[m.tipo]
                                                    || m.tipo
                                                    || "Movimiento";


                                                // =================================================
                                                // FECHA SEGURA
                                                // =================================================

                                                const fechaMovimiento =
                                                    m.fecha_hora
                                                        ? new Date(
                                                            m.fecha_hora
                                                        )
                                                        : null;


                                                const fechaValida =
                                                fechaMovimiento instanceof Date &&
                                                !Number.isNaN(fechaMovimiento.getTime());

                                                return (

                                                    <div
                                                        key={m.id}
                                                        style={{
                                                            padding:
                                                                "12px 0",

                                                            borderBottom:
                                                                "1px solid #e5e5e5"
                                                        }}
                                                    >

                                                        <strong
                                                            style={{
                                                                fontSize:
                                                                    "15px"
                                                            }}
                                                        >
                                                            {
                                                                nombreMovimiento
                                                            }
                                                        </strong>


                                                        <br />


                                                        <span
                                                            style={{
                                                                color:
                                                                    "#666",

                                                                fontSize:
                                                                    "14px"
                                                            }}
                                                        >

                                                            {
                                                                fechaValida

                                                                    ? fechaMovimiento.toLocaleTimeString(
                                                                        [],
                                                                        {
                                                                            hour:
                                                                                "2-digit",

                                                                            minute:
                                                                                "2-digit",

                                                                            second:
                                                                                "2-digit"
                                                                        }
                                                                    )

                                                                    : "--:--:--"
                                                            }

                                                        </span>


                                                        {/* OBSERVACIÓN */}

{m.observacion && (

    <div
        style={{
            marginTop: "6px",
            padding: "6px 10px",
            background: "#f8f9fa",
            borderRadius: "6px",
            fontSize: "13px",
            color: "#666"
        }}
    >
        📝 {m.observacion}
    </div>

)}

</div>

);

})

}

</div>

)

}

{/* =================================================
    BOTÓN CERRAR
================================================= */}

<button
    type="button"
    onClick={() => {

        setAsesorSeleccionado(null);
        setHistorial([]);
        setResumenJornada(null);
        setIncidenciasHistorial([]);

    }}
    style={{
        marginTop: "20px",
        width: "100%",
        padding: "12px",
        border: "none",
        borderRadius: "8px",
        background: "#dc3545",
        color: "#fff",
        cursor: "pointer",
        fontWeight: "bold",
        fontSize: "15px",
        transition: "0.2s"
    }}
>
    ✕ Cerrar
</button>

</div>

</div>

)}

</div>

);

}