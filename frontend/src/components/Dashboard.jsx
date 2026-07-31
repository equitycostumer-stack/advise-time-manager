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

    async function cargarDashboard() {

        try {

            // Dashboard
            const dashboard = await api.get("/dashboard");

            setAsesores(dashboard.data.asesores);

            // Incidencias reales
            const incidenciasRes = await api.get("/incidencias");

            setIncidencias(incidenciasRes.data);

        } catch (error) {

            console.error("Error cargando dashboard:", error);

        }

    }

    async function verHistorial(asesor) {

        try {

            const res = await api.get(`/movimientos/historial/${asesor.id}`);

            setHistorial(res.data);

            setAsesorSeleccionado(asesor);

        } catch (error) {

            console.error(error);

            alert("No fue posible cargar el historial.");

        }

    }

    useEffect(() => {

        cargarDashboard();

        const intervalo = setInterval(cargarDashboard, 5000);

        return () => clearInterval(intervalo);

    }, []);
    useEffect(() => {

        cargarDashboard();

        const intervalo = setInterval(cargarDashboard, 5000);

        return () => clearInterval(intervalo);

    }, []);

    return (

        <div
            style={{
                marginTop: 40,
                background: "#fff",
                borderRadius: 10,
                padding: 20
            }}
        >

            <h2>📊 Dashboard en tiempo real</h2>
              {/* INDICADORES */}

<div
    style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))",
        gap: "15px",
        marginBottom: "25px",
        marginTop: "20px"
    }}
>

    <div style={{
        background: "#0d6efd",
        color: "white",
        padding: "15px",
        borderRadius: "10px",
        textAlign: "center"
    }}>
        <h2>{asesores.length}</h2>
        <small>👥 Asesores</small>
    </div>

    <div style={{
        background: "#198754",
        color: "white",
        padding: "15px",
        borderRadius: "10px",
        textAlign: "center"
    }}>
        <h2>
            {
                asesores.filter(a =>
                    a.estado === "TRABAJANDO"
                ).length
            }
        </h2>

        <small>🟢 Trabajando</small>

    </div>

    <div style={{
        background: "#ffc107",
        padding: "15px",
        borderRadius: "10px",
        textAlign: "center"
    }}>
        <h2>
            {
                asesores.filter(a =>
                    a.estado === "BREAK"
                ).length
            }
        </h2>

        <small>☕ Break</small>

    </div>

    <div style={{
        background: "#fd7e14",
        color: "white",
        padding: "15px",
        borderRadius: "10px",
        textAlign: "center"
    }}>
        <h2>
            {
                asesores.filter(a =>
                    a.estado === "ALMUERZO"
                ).length
            }
        </h2>

        <small>🍽 Almuerzo</small>

    </div>

    <div style={{
        background: "#17a2b8",
        color: "white",
        padding: "15px",
        borderRadius: "10px",
        textAlign: "center"
    }}>
        <h2>
            {
                asesores.filter(a =>
                    a.estado === "CAPACITACION"
                ).length
            }
        </h2>

        <small>📚 Capacitación</small>

    </div>

    <div
    style={{
        background:

            asesores.filter(a => a.llego_tarde).length > 0

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
                asesores.filter(a =>
                    a.llego_tarde
                ).length
            }
        </h2>

        <small>🚨 Llegadas tarde</small>

    </div>

</div>
            <ExportarExcel asesores={asesores} />
            <div
    style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))",
        gap: "20px",
        marginTop: "20px"
    }}
>

    {

        asesores.map((a) => (

            <div
                key={a.id}
                style={{
                    background: "#ffffff",
                    borderRadius: "8px",
                    padding: "10px",
                    boxShadow: "0 3px 10px rgba(0,0,0,0.15)",
                    border: a.llego_tarde ? "3px solid #dc3545" : "1px solid #ddd",
                    borderLeft: `8px solid ${
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
                            : "#6c757d"
                    }`
                }}
            >

                <h3
    style={{
        marginBottom: "8px",
        fontSize: "18px",
        fontWeight: "bold"
    }}
>
    👤 {a.nombre}
</h3>

                <p>
    <strong>Estado</strong>
    <br />

    {
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

        : a.estado
    }

</p>

                <p>
                    <strong>Inicio</strong>
                    <br />
                    {
                        a.inicio_estado
                            ? new Date(a.inicio_estado).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit"
                              })
                            : "--:--"
                    }
                </p>
<p>
    <strong>⏱ Tiempo en estado</strong>
    <br />
    {
        a.inicio_estado
            ? (() => {

                // Si el asesor ya salió, detener el cronómetro
                if (a.estado === "SALIDA") {

                    return "✅ Finalizado";

                }

                const segundos = Math.floor(
                    (Date.now() - new Date(a.inicio_estado).getTime()) / 1000
                );

                const horas = Math.floor(segundos / 3600);

                const minutos = Math.floor((segundos % 3600) / 60);

                const seg = segundos % 60;

                return (
                    String(horas).padStart(2, "0") +
                    ":" +
                    String(minutos).padStart(2, "0") +
                    ":" +
                    String(seg).padStart(2, "0")
                );

            })()
            : "--:--:--"
    }
</p>

<p>
    <strong>Retraso</strong>
    <br />
    {
        a.llego_tarde
            ? `🔴 ${a.minutos_retraso} min`
            : "🟢 Puntual"
    }
</p>

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

        ))

    }

</div>
         <Alertas asesores={asesores} />

<CentroIncidencias incidencias={incidencias} />

<PanelIncidencias
    incidencias={incidencias}
    onActualizar={cargarDashboard}
/>
         {

    asesorSeleccionado && (

        <div
            style={{
                position: "fixed",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                background: "rgba(0,0,0,.5)",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                zIndex: 9999
            }}
        >

            <div
                style={{
                    background: "white",
                    width: "500px",
                    maxHeight: "80vh",
                    overflowY: "auto",
                    borderRadius: "12px",
                    padding: "25px"
                }}
            >

                <h2>

                    📋 Historial de {asesorSeleccionado.nombre}

                </h2>

                <hr />
<ExportarHistorial

    historial={historial}

    asesor={asesorSeleccionado}

/>
                {

                    historial.length === 0

                        ?

                        <p>No hay movimientos hoy.</p>

                        :

                        historial.map((m) => (

                            <div
                                key={m.id}
                                style={{
                                    padding: "10px 0",
                                    borderBottom: "1px solid #ddd"
                                }}
                            >

                                <strong>

    {

        m.tipo === "ENTRADA" ? "✅ Entrada"

        : m.tipo === "SALIDA" ? "🚪 Salida"

        : m.tipo === "BREAK_INICIO" ? "☕ Inicio Break"

        : m.tipo === "BREAK_FIN" ? "☕ Fin Break"

        : m.tipo === "ALMUERZO_INICIO" ? "🍽 Inicio Almuerzo"

        : m.tipo === "ALMUERZO_FIN" ? "🍽 Fin Almuerzo"

        : m.tipo === "BANO_INICIO" ? "🚻 Inicio Baño"

        : m.tipo === "BANO_FIN" ? "🚻 Fin Baño"

        : m.tipo === "CAPACITACION_INICIO" ? "📚 Inicio Capacitación"

        : m.tipo === "CAPACITACION_FIN" ? "📚 Fin Capacitación"

        : m.tipo === "REUNION_INICIO" ? "👥 Inicio Reunión"

        : m.tipo === "REUNION_FIN" ? "👥 Fin Reunión"

        : m.tipo

    }

</strong>

                                <br />

                                {

                                    new Date(m.fecha_hora)

                                        .toLocaleTimeString([], {

                                            hour: "2-digit",

                                            minute: "2-digit",

                                            second: "2-digit"

                                        })

                                }

                            </div>

                        ))

                }

                <button

                    onClick={() => {

                        setAsesorSeleccionado(null);

                        setHistorial([]);

                    }}

                    style={{

                        marginTop: "20px",

                        width: "100%",

                        padding: "10px",

                        border: "none",

                        background: "#dc3545",

                        color: "white",

                        borderRadius: "8px",

                        cursor: "pointer"

                    }}

                >

                    Cerrar

                </button>

            </div>

        </div>

    )

}
        </div>

    );

}