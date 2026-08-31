import { useState } from "react";
import api from "../services/api";

function convertirFechaColombia(fecha) {
    if (!fecha) return null;
    if (fecha instanceof Date) return fecha;

    const valor = String(fecha).trim();
    if (!valor) return null;

    if (valor.endsWith("Z") || /[+-]\d{2}:\d{2}$/.test(valor)) {
        const fechaConvertida = new Date(valor);
        return Number.isNaN(fechaConvertida.getTime()) ? null : fechaConvertida;
    }

    const fechaConvertida = new Date(valor.replace(" ", "T") + "-05:00");
    return Number.isNaN(fechaConvertida.getTime()) ? null : fechaConvertida;
}

function formatearHoraColombia(fecha) {
    const fechaConvertida = convertirFechaColombia(fecha);
    if (!fechaConvertida) return "--:--:--";

    return fechaConvertida.toLocaleTimeString("es-CO", {
        timeZone: "America/Bogota",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true
    });
}

function calcularDuracion(inicio, fin) {
    if (!inicio || !fin) return null;

    const fechaInicio = convertirFechaColombia(inicio);
    const fechaFin = convertirFechaColombia(fin);
    if (!fechaInicio || !fechaFin) return null;

    const minutos = Math.max(
        0,
        Math.round((fechaFin.getTime() - fechaInicio.getTime()) / 60000)
    );
    const horas = Math.floor(minutos / 60);
    const minutosRestantes = minutos % 60;

    return horas > 0 ? `${horas}h ${minutosRestantes}min` : `${minutosRestantes} min`;
}

const hoy = () => new Date().toISOString().split("T")[0];

export default function HistorialIncidenciasModal({
    onClose,
    asesorId = "",
    asesores = []
}) {
    const [filtros, setFiltros] = useState({
        fechaDesde: hoy(),
        fechaHasta: hoy(),
        asesorId: asesorId ? String(asesorId) : "",
        tipo: "",
        nivel: ""
    });
    const [incidencias, setIncidencias] = useState([]);
    const [loading, setLoading] = useState(false);
    const [consultado, setConsultado] = useState(false);

    function cambiarFiltro(campo, valor) {
        setFiltros((anterior) => ({ ...anterior, [campo]: valor }));
    }

    async function cargarHistorial(filtrosConsulta = filtros) {
        if (filtrosConsulta.fechaDesde && filtrosConsulta.fechaHasta && filtrosConsulta.fechaDesde > filtrosConsulta.fechaHasta) {
            alert("La fecha Desde no puede ser posterior a la fecha Hasta.");
            return;
        }

        const params = new URLSearchParams();
        if (filtrosConsulta.fechaDesde) params.set("fecha_desde", filtrosConsulta.fechaDesde);
        if (filtrosConsulta.fechaHasta) params.set("fecha_hasta", filtrosConsulta.fechaHasta);
        if (filtrosConsulta.asesorId) params.set("asesor_id", filtrosConsulta.asesorId);
        if (filtrosConsulta.tipo) params.set("tipo", filtrosConsulta.tipo);
        if (filtrosConsulta.nivel) params.set("nivel", filtrosConsulta.nivel);

        setLoading(true);
        try {
            const res = await api.get(`/incidencias/historial?${params.toString()}`);
            setIncidencias(res.data?.incidencias || res.data || []);
            setConsultado(true);
        } catch (err) {
            console.error("Error cargando historial de incidencias:", err);
            setIncidencias([]);
        } finally {
            setLoading(false);
        }
    }

    function limpiarFiltros() {
        const nuevos = {
            fechaDesde: "",
            fechaHasta: "",
            asesorId: "",
            tipo: "",
            nivel: ""
        };
        setFiltros(nuevos);
        setIncidencias([]);
        setConsultado(false);
    }

    const inputStyle = {
        width: "100%",
        padding: "8px",
        borderRadius: "6px",
        border: "1px solid #555",
        background: "#1b1b1b",
        color: "#F4F4F4",
        boxSizing: "border-box"
    };

    return (
        <div
            role="dialog"
            aria-modal="true"
            style={{
                position: "fixed",
                inset: 0,
                background: "rgba(0,0,0,0.68)",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                padding: "20px",
                zIndex: 9999
            }}
        >
            <div
                style={{
                    background: "#171717",
                    color: "#F4F4F4",
                    width: "100%",
                    maxWidth: "760px",
                    maxHeight: "90vh",
                    overflowY: "auto",
                    padding: "25px",
                    borderRadius: "12px",
                    border: "1px solid rgba(212,175,55,.58)",
                    borderTop: "5px solid #D4AF37",
                    boxShadow: "0 15px 40px rgba(0,0,0,.55)"
                }}
            >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", marginBottom: "15px" }}>
                    <h2 style={{ color: "#D4AF37", margin: 0 }}>📊 Historial de Incidencias</h2>
                    <button
                        onClick={onClose}
                        style={{ background: "#C0392B", color: "#fff", border: "none", padding: "6px 12px", borderRadius: "6px", cursor: "pointer", fontWeight: "bold" }}
                    >
                        ✕ Cerrar
                    </button>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "10px", marginBottom: "20px" }}>
                    <label style={{ fontWeight: "bold" }}>Desde<input type="date" value={filtros.fechaDesde} onChange={(e) => cambiarFiltro("fechaDesde", e.target.value)} style={inputStyle} /></label>
                    <label style={{ fontWeight: "bold" }}>Hasta<input type="date" value={filtros.fechaHasta} onChange={(e) => cambiarFiltro("fechaHasta", e.target.value)} style={inputStyle} /></label>
                    <label style={{ fontWeight: "bold" }}>Asesor
                        <select value={filtros.asesorId} onChange={(e) => cambiarFiltro("asesorId", e.target.value)} style={inputStyle}>
                            <option value="">Todos los asesores</option>
                            {asesores.map((asesor) => <option key={asesor.id} value={asesor.id}>{asesor.nombre}</option>)}
                        </select>
                    </label>
                    <label style={{ fontWeight: "bold" }}>Tipo
                        <select value={filtros.tipo} onChange={(e) => cambiarFiltro("tipo", e.target.value)} style={inputStyle}>
                            <option value="">Todos los tipos</option>
                            <option value="BREAK">BREAK</option>
                            <option value="ALMUERZO">ALMUERZO</option>
                            <option value="BAÑO">BAÑO</option>
                            <option value="CAPACITACIÓN">CAPACITACIÓN</option>
                            <option value="REUNIÓN">REUNIÓN</option>
                            <option value="PAUSA DE LLAMADAS">PAUSA DE LLAMADAS</option>
                        </select>
                    </label>
                    <label style={{ fontWeight: "bold" }}>Nivel
                        <select value={filtros.nivel} onChange={(e) => cambiarFiltro("nivel", e.target.value)} style={inputStyle}>
                            <option value="">Todos los niveles</option>
                            <option value="BAJO">BAJO</option>
                            <option value="MEDIO">MEDIO</option>
                            <option value="ALTO">ALTO</option>
                            <option value="INFORMATIVA">INFORMATIVA</option>
                        </select>
                    </label>
                    <div style={{ display: "flex", alignItems: "flex-end", gap: "8px" }}>
                        <button onClick={() => cargarHistorial()} disabled={loading} style={{ flex: 1, padding: "9px", background: loading ? "#6b5520" : "#D4AF37", color: "#111", border: "none", borderRadius: "6px", fontWeight: "bold", cursor: loading ? "default" : "pointer" }}>
                            {loading ? "Consultando..." : "🔍 Consultar"}
                        </button>
                        <button onClick={limpiarFiltros} style={{ padding: "9px", background: "#222", color: "#F4F4F4", border: "1px solid #777", borderRadius: "6px", cursor: "pointer" }}>
                            Limpiar
                        </button>
                    </div>
                </div>

                {loading ? (
                    <p style={{ color: "#C9C9C9" }}>Cargando incidencias...</p>
                ) : !consultado ? (
                    <p style={{ color: "#C9C9C9", fontStyle: "italic" }}>Selecciona los filtros y presiona Consultar.</p>
                ) : incidencias.length === 0 ? (
                    <p style={{ color: "#C9C9C9", fontStyle: "italic" }}>No se registraron incidencias con los filtros seleccionados.</p>
                ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                        {incidencias.map((i) => {
                            const revisada = i.revisada === 1 || i.revisada === true;
                            return (
                                <div key={i.id} style={{ border: "1px solid rgba(212,175,55,.35)", borderRadius: "8px", padding: "15px", background: revisada ? "#1b1b1b" : "rgba(212,175,55,.14)" }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", gap: "10px", marginBottom: "5px" }}>
                                        <strong style={{ color: "#D4AF37" }}>👤 {i.nombre || i.asesor_nombre || "Asesor"}</strong>
                                        <span style={{ padding: "3px 8px", borderRadius: "4px", fontSize: "12px", fontWeight: "bold", background: revisada ? "rgba(212,175,55,.2)" : "rgba(192,57,43,.22)", color: revisada ? "#D4AF37" : "#ffb3aa" }}>
                                            {revisada ? "✅ Revisada" : "⏳ Pendiente"}
                                        </span>
                                    </div>
                                    <p style={{ margin: "4px 0" }}><strong>Tipo:</strong> {i.tipo} ({i.nivel})</p>
                                    <p style={{ margin: "4px 0" }}><strong>Detalle:</strong> {i.detalle}</p>
                                    {i.tipo === "PAUSA DE LLAMADAS" ? (
                                        <>
                                            <p style={{ margin: "4px 0", fontSize: "13px", color: "#C9C9C9" }}><strong>Inicio:</strong> {formatearHoraColombia(i.fecha_hora)}</p>
                                            <p style={{ margin: "4px 0", fontSize: "13px", color: "#C9C9C9" }}><strong>Fin:</strong> {i.fecha_fin ? formatearHoraColombia(i.fecha_fin) : "⏳ En curso"}</p>
                                            {i.fecha_fin && <p style={{ margin: "4px 0", fontSize: "13px", fontWeight: "bold", color: "#D4AF37" }}>Duración: {calcularDuracion(i.fecha_hora, i.fecha_fin)}</p>}
                                        </>
                                    ) : (
                                        <p style={{ margin: "4px 0", fontSize: "13px", color: "#C9C9C9" }}><strong>Hora:</strong> {formatearHoraColombia(i.fecha_hora)}</p>
                                    )}
                                    {revisada && <div style={{ marginTop: "8px", background: "rgba(212,175,55,.1)", padding: "8px", borderRadius: "6px", fontSize: "13px" }}><p style={{ margin: "2px 0" }}><strong>Coach revisor:</strong> {i.revisada_por}</p><p style={{ margin: "2px 0" }}><strong>Comentario:</strong> {i.comentario}</p></div>}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
