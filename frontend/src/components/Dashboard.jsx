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

    // =====================================================
    // CARGAR DASHBOARD
    // =====================================================

    async function cargarDashboard() {

        try {

            // Dashboard
            const dashboard = await api.get("/dashboard");

            setAsesores(dashboard.data.asesores || []);

            // Incidencias reales
            const incidenciasRes = await api.get("/incidencias");

            setIncidencias(incidenciasRes.data || []);

        } catch (error) {

            console.error(
                "❌ Error cargando dashboard:",
                error
            );

        }

    }

    // =====================================================
    // VER HISTORIAL DE UN ASESOR
    // =====================================================

    async function verHistorial(asesor) {

        try {

            const res = await api.get(
                `/movimientos/historial/${asesor.id}`
            );

            setHistorial(
    res.data?.data?.movimientos || []
);

            setAsesorSeleccionado(asesor);

        } catch (error) {

            console.error(
                "❌ Error cargando historial:",
                error
            );

            alert(
                "No fue posible cargar el historial."
            );

        }

    }

    // =====================================================
    // ACTUALIZACIÓN AUTOMÁTICA
    // =====================================================

    useEffect(() => {

        // Cargar inmediatamente
        cargarDashboard();

        // Actualizar cada 5 segundos
        const intervalo = setInterval(() => {

            cargarDashboard();

        }, 5000);

        // Limpiar intervalo cuando el componente se desmonta
        return () => {

            clearInterval(intervalo);

        };

    }, []);

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

                    {

                        !a.inicio_estado

                            ? "--:--:--"

                        : a.estado === "SALIDA"

                            ? "✅ Finalizado"

                        : (() => {

                            const inicio =
                                new Date(a.inicio_estado).getTime();

                            const ahora = Date.now();

                            let segundos = Math.floor(
                                (ahora - inicio) / 1000
                            );

                            if (segundos < 0) {
                                segundos = 0;
                            }

                            const horas = Math.floor(segundos / 3600);

                            const minutos = Math.floor(
                                (segundos % 3600) / 60
                            );

                            const seg = segundos % 60;

                            return (
                                String(horas).padStart(2, "0") +
                                ":" +
                                String(minutos).padStart(2, "0") +
                                ":" +
                                String(seg).padStart(2, "0")
                            );

                        })()

                    }

</p>

                {/* =====================================================
                    RETRASO
                ===================================================== */}

                <p>
                    <strong>Retraso</strong>
                    <br />

                    {
                        a.llego_tarde
                            ? `🔴 ${a.minutos_retraso} min`
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
                        padding: "8px",
                        border: "none",
                        borderRadius: "6px",
                        background: "#0d6efd",
                        color: "white",
                        cursor: "pointer",
                        fontWeight: "bold"
                    }}
                >
                    📋 Ver historial
                </button>

            </div>

        );

    })

}

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
            MODAL DE HISTORIAL
        ===================================================== */}

        {
            asesorSeleccionado && (

                <div
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="historial-titulo"

                    onClick={(e) => {

                        // Permite cerrar haciendo clic fuera
                        if (e.target === e.currentTarget) {

                            setAsesorSeleccionado(null);
                            setHistorial([]);

                        }

                    }}

                    style={{
                        position: "fixed",
                        top: 0,
                        left: 0,
                        width: "100%",
                        height: "100%",

                        background:
                            "rgba(0,0,0,0.55)",

                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",

                        padding: "20px",

                        boxSizing: "border-box",

                        zIndex: 9999
                    }}
                >

                    {/* =================================================
                        VENTANA DEL HISTORIAL
                    ================================================= */}

                    <div
                        style={{
                            background: "#ffffff",

                            width: "100%",
                            maxWidth: "550px",

                            maxHeight: "85vh",

                            overflowY: "auto",

                            borderRadius: "14px",

                            padding: "25px",

                            boxSizing: "border-box",

                            boxShadow:
                                "0 10px 40px rgba(0,0,0,0.30)"
                        }}
                    >

                        {/* =================================================
                            ENCABEZADO
                        ================================================= */}

                        <h2
                            id="historial-titulo"
                            style={{
                                marginTop: 0,
                                marginBottom: "10px",
                                fontSize: "22px"
                            }}
                        >
                            📋 Historial de{" "}
                            {asesorSeleccionado.nombre}
                        </h2>


                        <hr
                            style={{
                                border: 0,
                                borderTop:
                                    "1px solid #ddd",
                                marginBottom: "20px"
                            }}
                        />


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
                                                    fechaMovimiento &&
                                                    !Number.isNaN(
                                                        fechaMovimiento.getTime()
                                                    );


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

                                                        {
                                                            m.observacion && (

                                                                <div
                                                                    style={{
                                                                        marginTop:
                                                                            "5px",

                                                                        fontSize:
                                                                            "13px",

                                                                        color:
                                                                            "#777"
                                                                    }}
                                                                >
                                                                    📝{" "}
                                                                    {
                                                                        m.observacion
                                                                    }
                                                                </div>

                                                            )
                                                        }

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

                            }}

                            style={{
                                marginTop: "20px",

                                width: "100%",

                                padding: "11px",

                                border: "none",

                                background:
                                    "#dc3545",

                                color: "white",

                                borderRadius: "8px",

                                cursor: "pointer",

                                fontWeight: "bold",

                                fontSize: "15px"
                            }}
                        >
                            ✕ Cerrar
                        </button>

                    </div>

                </div>

            )
        }

    </div>

    );

}