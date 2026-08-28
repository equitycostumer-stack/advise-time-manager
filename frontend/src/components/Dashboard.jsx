import { useEffect, useState } from "react";
import api from "../services/api";
import ExportarWord from "./ExportarWord";
import ExportarHistorial from "./ExportarHistorial";
import Alertas from "./Alertas";
import CentroIncidencias from "./CentroIncidencias";
import PanelIncidencias from "./PanelIncidencias";
import HistorialIncidenciasModal from "./HistorialIncidenciasModal";

// =====================================================
// CONVERTIR FECHA MYSQL -> COLOMBIA
// =====================================================

function convertirFechaColombia(fecha) {
    if (!fecha) {
        return null;
    }

    if (fecha instanceof Date) {
        return fecha;
    }

    const valor = String(fecha).trim();

    if (!valor) {
        return null;
    }

    // Si ya contiene zona horaria, respetarla
    if (valor.endsWith("Z") || /[+-]\d{2}:\d{2}$/.test(valor)) {
        const fechaConvertida = new Date(valor);
        return Number.isNaN(fechaConvertida.getTime()) ? null : fechaConvertida;
    }

    // MySQL DATETIME: YYYY-MM-DD HH:mm:ss (Hora Colombia UTC-05:00)
    const fechaConvertida = new Date(valor.replace(" ", "T") + "-05:00");

    return Number.isNaN(fechaConvertida.getTime()) ? null : fechaConvertida;
}

// =====================================================
// DURACIÓN ENTRE DOS FECHAS
// =====================================================

function calcularDuracion(inicio, fin) {
    if (!inicio || !fin) return null;

    const fechaInicio = convertirFechaColombia(inicio);
    const fechaFin = convertirFechaColombia(fin);

    if (!fechaInicio || !fechaFin) return null;

    const minutos = Math.max(0, Math.round((fechaFin.getTime() - fechaInicio.getTime()) / 60000));

    const horas = Math.floor(minutos / 60);
    const minutosRestantes = minutos % 60;

    if (horas > 0) {
        return `${horas}h ${minutosRestantes}min`;
    }

    return `${minutosRestantes} min`;
}

// =====================================================
// FORMATO DE HORA COLOMBIA
// =====================================================

function formatearHoraColombia(fecha) {
    const fechaConvertida = convertirFechaColombia(fecha);

    if (!fechaConvertida) {
        return "--:--:--";
    }

    return fechaConvertida.toLocaleTimeString("es-CO", {
        timeZone: "America/Bogota",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true
    });
}

export default function Dashboard() {
    const [asesores, setAsesores] = useState([]);
    const [incidencias, setIncidencias] = useState([]);
    const [historial, setHistorial] = useState([]);
    const [asesorSeleccionado, setAsesorSeleccionado] = useState(null);
    const [resumenJornada, setResumenJornada] = useState(null);
    const [incidenciasHistorial, setIncidenciasHistorial] = useState([]);
    const [ahora, setAhora] = useState(Date.now());
    const [mostrarHistorialIncidencias, setMostrarHistorialIncidencias] = useState(false);
    const [fechaHistorialGeneral, setFechaHistorialGeneral] = useState("");
    const [listaHistorialGeneral, setListaHistorialGeneral] = useState([]);
    const [cargandoHistorialGeneral, setCargandoHistorialGeneral] = useState(false);
    const [mostrarHistorialGeneral, setMostrarHistorialGeneral] = useState(false);

    // =====================================================
    // CARGAR DASHBOARD
    // =====================================================

    async function cargarDashboard() {
        try {
            const dashboard = await api.get("/dashboard");
            setAsesores(dashboard.data.asesores || []);

            const incidenciasRes = await api.get("/incidencias");
            setIncidencias(incidenciasRes.data || []);
        } catch (error) {
            console.error("ERROR DASHBOARD", error);
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

            const [historialRes, resumenRes, incidenciasRes] = await Promise.all([
                api.get(`/movimientos/historial/${asesor.id}`),
                api.get(`/movimientos/resumen/${asesor.id}`),
                api.get(`/incidencias/asesor/${asesor.id}`)
            ]);

            let movimientos = [];

            if (Array.isArray(historialRes.data)) {
                movimientos = historialRes.data;
            } else if (Array.isArray(historialRes.data?.data)) {
                movimientos = historialRes.data.data;
            } else if (Array.isArray(historialRes.data?.data?.movimientos)) {
                movimientos = historialRes.data.data.movimientos;
            } else if (Array.isArray(historialRes.data?.data?.data?.movimientos)) {
                movimientos = historialRes.data.data.data.movimientos;
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
        } catch (error) {
            console.error("❌ ERROR CARGANDO HISTORIAL", error);
            alert("No fue posible cargar el historial.");
        }
    }

    // =====================================================
    // BUSCAR HISTORIAL DE INCIDENCIAS GENERAL
    // =====================================================

    async function buscarHistorialIncidenciasGeneral(fecha) {
        setFechaHistorialGeneral(fecha);
        if (!fecha) {
            setListaHistorialGeneral([]);
            return;
        }

                try {
            setCargandoHistorialGeneral(true);
            const response = await api.get(`/incidencias/historial?fecha=${fecha}`);

            setListaHistorialGeneral(
                response.data?.incidencias ||
                response.data ||
                []
            );

        } catch (error) {

            console.error("Error al cargar incidencias por fecha", error);
            setListaHistorialGeneral([]);
        } finally {
            setCargandoHistorialGeneral(false);
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
                    gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))",
                    gap: "15px",
                    marginBottom: "25px",
                    marginTop: "20px"
                }}
            >
                {/* ASESORES */}
                <div style={{ background: "#0d6efd", color: "white", padding: "15px", borderRadius: "10px", textAlign: "center" }}>
                    <h2>{asesores.length}</h2>
                    <small>👥 Asesores</small>
                </div>

                {/* TRABAJANDO */}
                <div style={{ background: "#198754", color: "white", padding: "15px", borderRadius: "10px", textAlign: "center" }}>
                    <h2>{asesores.filter((a) => a.estado === "TRABAJANDO").length}</h2>
                    <small>🟢 Trabajando</small>
                </div>

                {/* BREAK */}
                <div style={{ background: "#ffc107", padding: "15px", borderRadius: "10px", textAlign: "center" }}>
                    <h2>{asesores.filter((a) => a.estado === "BREAK").length}</h2>
                    <small>☕ Break</small>
                </div>

                {/* ALMUERZO */}
                <div style={{ background: "#fd7e14", color: "white", padding: "15px", borderRadius: "10px", textAlign: "center" }}>
                    <h2>{asesores.filter((a) => a.estado === "ALMUERZO").length}</h2>
                    <small>🍽 Almuerzo</small>
                </div>

                {/* CAPACITACIÓN */}
                <div style={{ background: "#17a2b8", color: "white", padding: "15px", borderRadius: "10px", textAlign: "center" }}>
                    <h2>{asesores.filter((a) => a.estado === "CAPACITACION").length}</h2>
                    <small>📚 Capacitación</small>
                </div>

                {/* LLEGADAS TARDE */}
                <div
                    style={{
                        background: asesores.some((a) => a.llego_tarde) ? "#dc3545" : "#198754",
                        color: "white",
                        padding: "15px",
                        borderRadius: "10px",
                        textAlign: "center",
                        transition: "0.4s"
                    }}
                >
                    <h2>{asesores.filter((a) => a.llego_tarde).length}</h2>
                    <small>🚨 Llegadas tarde</small>
                </div>
            </div>

            {/* EXPORTAR WORD */}
            <ExportarWord />

            {/* =================================================
                TARJETAS DE ASESORES
            ================================================= */}
            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))",
                    gap: "20px",
                    marginTop: "20px"
                }}
            >
                {asesores.map((a) => {
                    const colorEstado =
                        a.estado === "TRABAJANDO" ? "#198754"
                        : a.estado === "BREAK" ? "#ffc107"
                        : a.estado === "ALMUERZO" ? "#fd7e14"
                        : a.estado === "BANO" ? "#17a2b8"
                        : a.estado === "CAPACITACION" ? "#0d6efd"
                        : a.estado === "REUNION" ? "#6f42c1"
                        : a.estado === "SALIDA" ? "#dc3545"
                        : "#6c757d";

                    const textoEstado =
                        a.estado === "TRABAJANDO" ? "🟢 TRABAJANDO"
                        : a.estado === "BREAK" ? "🟡 BREAK"
                        : a.estado === "ALMUERZO" ? "🟠 ALMUERZO"
                        : a.estado === "BANO" ? "🔵 BAÑO"
                        : a.estado === "CAPACITACION" ? "🟣 CAPACITACIÓN"
                        : a.estado === "REUNION" ? "⚫ REUNIÓN"
                        : a.estado === "SALIDA" ? "🔴 SALIDA"
                        : a.estado || "DISPONIBLE";

                    return (
                        <div
                            key={a.id}
                            style={{
                                background: "#ffffff",
                                borderRadius: "8px",
                                padding: "10px",
                                boxShadow: "0 3px 10px rgba(0,0,0,0.15)",
                                border: a.llego_tarde ? "3px solid #dc3545" : "1px solid #ddd",
                                borderLeft: `8px solid ${colorEstado}`
                            }}
                        >
                            <h3 style={{ marginBottom: "8px", fontSize: "18px", fontWeight: "bold" }}>
                                👤 {a.nombre}
                            </h3>

                            <p>
                                <strong>Estado</strong>
                                <br />
                                {textoEstado}
                            </p>

                            <p>
                                <strong>Inicio</strong>
                                <br />
                                {a.inicio_estado ? formatearHoraColombia(a.inicio_estado) : "--:--"}
                            </p>

                            <p>
                                <strong>⏱ Tiempo en estado</strong>
                                <br />
                                {(() => {
                                    if (!a.inicio_estado) return "--:--:--";
                                    if (a.estado === "SALIDA") return "✅ Finalizado";

                                    const inicio = convertirFechaColombia(a.inicio_estado);
                                    if (!inicio) return "--:--:--";

                                    const fechaActual = new Date(ahora);
                                    const diferencia = Math.max(
                                        0,
                                        Math.floor((fechaActual.getTime() - inicio.getTime()) / 1000)
                                    );

                                    const horas = Math.floor(diferencia / 3600);
                                    const minutos = Math.floor((diferencia % 3600) / 60);
                                    const segundos = diferencia % 60;

                                    return (
                                        `${String(horas).padStart(2, "0")}:` +
                                        `${String(minutos).padStart(2, "0")}:` +
                                        `${String(segundos).padStart(2, "0")}`
                                    );
                                })()}
                            </p>

                            <p>
                                <strong>Retraso</strong>
                                <br />
                                {a.llego_tarde ? `🔴 ${a.minutos_retraso ?? 0} min` : "🟢 Puntual"}
                            </p>

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

            {/* ALERTAS */}
            <Alertas asesores={asesores} incidencias={incidencias} />

            {/* CENTRO DE INCIDENCIAS */}
            <CentroIncidencias incidencias={incidencias} />

            {/* PANEL DE INCIDENCIAS */}
            <PanelIncidencias incidencias={incidencias} onActualizar={cargarDashboard} />

            {/* =====================================================
                BOTÓN Y CONTENEDOR DESPLEGABLE: HISTORIAL DE INCIDENCIAS
            ==================================================== */}
            <div style={{ marginTop: "20px" }}>
                <button
                    onClick={() => setMostrarHistorialGeneral(!mostrarHistorialGeneral)}
                    style={{
                        width: "100%",
                        padding: "12px",
                        backgroundColor: "#17a2b8",
                        color: "white",
                        border: "none",
                        borderRadius: "8px",
                        fontWeight: "bold",
                        fontSize: "15px",
                        cursor: "pointer",
                        boxShadow: "0 2px 5px rgba(0,0,0,0.1)"
                    }}
                >
                    🚨 Ver Historial de Incidencias
                </button>

                {mostrarHistorialGeneral && (
                    <div style={{ marginTop: "15px", padding: "15px", background: "#f8f9fa", borderRadius: "8px", border: "1px solid #ddd" }}>
                        <h3 style={{ marginTop: 0 }}>📊 Historial de Incidencias</h3>
                        
                        <div style={{ marginBottom: "15px" }}>
                            <label style={{ fontWeight: "bold", display: "block", marginBottom: "5px" }}>Seleccionar fecha:</label>
                            <input 
                                type="date"
                                value={fechaHistorialGeneral}
                                onChange={(e) => buscarHistorialIncidenciasGeneral(e.target.value)}
                                style={{ padding: "8px", borderRadius: "6px", border: "1px solid #ccc" }}
                            />
                        </div>

                                                {cargandoHistorialGeneral ? (
                            <div style={{ padding: "20px", textAlign: "center", color: "#666" }}>
                                Cargando incidencias...
                            </div>
                        ) : listaHistorialGeneral.length > 0 ? (
                            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                                {listaHistorialGeneral.map((inc) => {
                                    const revisada = inc.revisada === 1 || inc.revisada === true;
                                    return (
                                        <div
                                            key={inc.id}
                                            style={{
                                                border: "1px solid #ddd",
                                                borderRadius: "8px",
                                                padding: "15px",
                                                background: revisada ? "#f8f9fa" : "#fff3cd"
                                            }}
                                        >
                                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px" }}>
                                                <strong>👤 {inc.nombre || inc.asesor_nombre || "Asesor"}</strong>
                                                <span
                                                    style={{
                                                        padding: "3px 8px",
                                                        borderRadius: "4px",
                                                        fontSize: "12px",
                                                        fontWeight: "bold",
                                                        background: revisada ? "#d1e7dd" : "#ffeeba",
                                                        color: revisada ? "#0f5132" : "#856404"
                                                    }}
                                                >
                                                    {revisada ? "✅ Revisada" : "⏳ Pendiente"}
                                                </span>
                                            </div>
                                            <p style={{ margin: "4px 0" }}><strong>Tipo:</strong> {inc.tipo} ({inc.nivel})</p>
                                            <p style={{ margin: "4px 0" }}><strong>Detalle:</strong> {inc.detalle}</p>

                                            {inc.tipo === "PAUSA DE LLAMADAS" ? (
                                                <>
                                                    <p style={{ margin: "4px 0", fontSize: "13px", color: "#555" }}>
                                                        <strong>Inicio:</strong> {formatearHoraColombia(inc.fecha_hora)}
                                                    </p>
                                                    <p style={{ margin: "4px 0", fontSize: "13px", color: "#555" }}>
                                                        <strong>Fin:</strong> {inc.fecha_fin ? formatearHoraColombia(inc.fecha_fin) : "⏳ En curso"}
                                                    </p>
                                                    {inc.fecha_fin && (
                                                        <p style={{ margin: "4px 0", fontSize: "13px", fontWeight: "bold", color: "#dc3545" }}>
                                                            Duración: {calcularDuracion(inc.fecha_hora, inc.fecha_fin)}
                                                        </p>
                                                    )}
                                                </>
                                            ) : (
                                                <p style={{ margin: "4px 0", fontSize: "13px", color: "#555" }}><strong>Hora:</strong> {inc.fecha_hora}</p>
                                            )}

                                            {revisada && (
                                                <div style={{ marginTop: "8px", background: "#e2f0d9", padding: "8px", borderRadius: "6px", fontSize: "13px" }}>
                                                    <p style={{ margin: "2px 0" }}><strong>Coach revisor:</strong> {inc.revisada_por}</p>
                                                    <p style={{ margin: "2px 0" }}><strong>Comentario:</strong> {inc.comentario}</p>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div style={{ padding: "20px", textAlign: "center", color: "#666", background: "#fff", borderRadius: "6px", border: "1px dashed #ccc" }}>
                                {fechaHistorialGeneral ? "No se registraron incidencias para la fecha seleccionada." : "Selecciona una fecha para ver las incidencias."}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* =====================================================
                MODAL HISTORIAL
            ==================================================== */}
            {asesorSeleccionado && (
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
                            boxShadow: "0 12px 35px rgba(0,0,0,.30)"
                        }}
                    >
                        <h2 id="historial-titulo" style={{ marginTop: 0 }}>
                            📋 Historial de {asesorSeleccionado.nombre}
                        </h2>

                        <hr />

                        {/* EXPORTAR HISTORIAL */}
                        <ExportarHistorial
                            historial={historial}
                            asesor={asesorSeleccionado}
                        />

                        {/* BOTÓN PARA ABRIR MODAL HISTORIAL INCIDENCIAS */}
                        <div style={{ marginTop: "15px" }}>
                            <button
                                onClick={() => setMostrarHistorialIncidencias(true)}
                                style={{
                                    width: "100%",
                                    padding: "10px",
                                    backgroundColor: "#17a2b8",
                                    color: "white",
                                    border: "none",
                                    borderRadius: "8px",
                                    fontWeight: "bold",
                                    cursor: "pointer"
                                }}
                            >
                                🚨 Ver Historial de Incidencias
                            </button>
                        </div>

                        {/* MODAL SECUNDARIO DE HISTORIAL DE INCIDENCIAS */}
                        {mostrarHistorialIncidencias && (
                            <HistorialIncidenciasModal
                                asesorId={asesorSeleccionado.id}
                                onClose={() => setMostrarHistorialIncidencias(false)}
                            />
                        )}

                        {/* MOVIMIENTOS */}
                        {historial.length === 0 ? (
                            <div style={{ textAlign: "center", padding: "25px 10px", color: "#666" }}>
                                <p style={{ fontSize: "16px", margin: 0 }}>
                                    📭 No hay movimientos hoy.
                                </p>
                            </div>
                        ) : (
                            <div style={{ marginTop: "15px" }}>
                                {historial.map((m) => {
                                    const nombresMovimientos = {
                                        ENTRADA: "✅ Entrada",
                                        SALIDA: "🚪 Salida",
                                        BREAK_INICIO: "☕ Inicio Break",
                                        BREAK_FIN: "☕ Fin Break",
                                        ALMUERZO_INICIO: "🍽 Inicio Almuerzo",
                                        ALMUERZO_FIN: "🍽 Fin Almuerzo",
                                        BANO_INICIO: "🚻 Inicio Baño",
                                        BANO_FIN: "🚻 Fin Baño",
                                        CAPACITACION_INICIO: "📚 Inicio Capacitación",
                                        CAPACITACION_FIN: "📚 Fin Capacitación",
                                        REUNION_INICIO: "👥 Inicio Reunión",
                                        REUNION_FIN: "👥 Fin Reunión"
                                    };

                                    const nombreMovimiento =
                                        nombresMovimientos[m.tipo] || m.tipo || "Movimiento";

                                    const fechaMovimiento = m.fecha_hora
                                        ? convertirFechaColombia(m.fecha_hora)
                                        : null;

                                    const fechaValida =
                                        fechaMovimiento instanceof Date &&
                                        !Number.isNaN(fechaMovimiento.getTime());

                                    return (
                                        <div
                                            key={m.id}
                                            style={{
                                                padding: "12px 0",
                                                borderBottom: "1px solid #e5e5e5"
                                            }}
                                        >
                                            <strong style={{ fontSize: "15px" }}>
                                                {nombreMovimiento}
                                            </strong>
                                            <br />
                                            <span style={{ color: "#666", fontSize: "14px" }}>
                                                {fechaValida
                                                    ? fechaMovimiento.toLocaleTimeString("es-CO", {
                                                          timeZone: "America/Bogota",
                                                          hour: "2-digit",
                                                          minute: "2-digit",
                                                          second: "2-digit"
                                                      })
                                                    : "--:--:--"}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        <div style={{ marginTop: "20px", textAlign: "right" }}>
                            <button
                                onClick={() => setAsesorSeleccionado(null)}
                                style={{
                                    padding: "8px 16px",
                                    backgroundColor: "#6c757d",
                                    color: "white",
                                    border: "none",
                                    borderRadius: "6px",
                                    cursor: "pointer"
                                }}
                            >
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
