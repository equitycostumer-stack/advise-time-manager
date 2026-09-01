import { useEffect, useMemo, useState } from "react";
import api from "../services/api";
import ExportarWord from "./ExportarWord";
import ExportarHistorial from "./ExportarHistorial";
import Alertas from "./Alertas";
import CentroIncidencias from "./CentroIncidencias";
import PanelIncidencias from "./PanelIncidencias";
import HistorialIncidenciasModal from "./HistorialIncidenciasModal";

function convertirFechaColombia(fecha) {
    if (!fecha) return null;
    if (fecha instanceof Date) return fecha;
    const valor = String(fecha).trim();
    if (!valor) return null;
    const fechaConvertida = valor.endsWith("Z") || /[+-]\d{2}:\d{2}$/.test(valor)
        ? new Date(valor)
        : new Date(valor.replace(" ", "T") + "-05:00");
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

function formatearDuracion(ms) {
    const total = Math.max(0, Math.floor(Number(ms || 0) / 1000));
    const horas = Math.floor(total / 3600);
    const minutos = Math.floor((total % 3600) / 60);
    const segundos = total % 60;
    return `${String(horas).padStart(2, "0")}:${String(minutos).padStart(2, "0")}:${String(segundos).padStart(2, "0")}`;
}

function calcularDuracion(inicio, fin) {
    if (!inicio || !fin) return null;
    const fechaInicio = convertirFechaColombia(inicio);
    const fechaFin = convertirFechaColombia(fin);
    if (!fechaInicio || !fechaFin) return null;
    const minutos = Math.max(0, Math.round((fechaFin - fechaInicio) / 60000));
    const horas = Math.floor(minutos / 60);
    return horas > 0 ? `${horas}h ${minutos % 60}min` : `${minutos} min`;
}

const palette = {
    black: "#212529",
    surface: "#ffffff",
    surface2: "#f8f9fa",
    gold: "#0d6efd",
    white: "#212529",
    muted: "#666666",
    red: "#dc3545",
    border: "#dddddd"
};

function Modulo({ title, count, children, defaultOpen = true }) {
    return (
        <details open={defaultOpen} style={{ marginTop: 18 }}>
            <summary
                style={{
                    listStyle: "none",
                    cursor: "pointer",
                    padding: "15px 18px",
                    background: palette.surface2,
                    color: palette.gold,
                    border: `1px solid ${palette.border}`,
                    borderRadius: "10px",
                    fontSize: "17px",
                    fontWeight: "bold"
                }}
            >
                {title}
                {count !== undefined && (
                    <span style={{ float: "right", color: palette.white }}>{count}</span>
                )}
            </summary>
            <div style={{ paddingTop: "14px" }}>{children}</div>
        </details>
    );
}

function KpiCard({ icon, label, value, accent = palette.gold }) {
    const fondos = {
        "#198754": "#eaf7ef",
        "#20c997": "#e8fbf5",
        "#0d6efd": "#edf4ff",
        "#6f42c1": "#f3eeff",
        "#fd7e14": "#fff3e8",
        "#dc3545": "#fff0f1"
    };
    return (
        <div style={{
            position: "relative",
            overflow: "hidden",
            background: "rgba(255,255,255,.96)",
            border: "1px solid #dcebe2",
            borderRadius: "16px",
            padding: "17px 18px",
            minHeight: "116px",
            boxSizing: "border-box",
            boxShadow: "0 8px 22px rgba(36,90,62,.09)"
        }}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "4px", background: `linear-gradient(90deg, ${accent}, transparent)` }} />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "10px" }}>
                <div style={{ color: "#789184", fontSize: "11px", fontWeight: "800", letterSpacing: ".6px", textTransform: "uppercase", lineHeight: 1.3 }}>{label}</div>
                <div style={{ width: "38px", height: "38px", display: "grid", placeItems: "center", flexShrink: 0, borderRadius: "12px", background: fondos[accent] || "#eef5ff", color: accent, fontSize: "19px" }}>{icon}</div>
            </div>
            <div style={{ color: "#214f35", fontSize: "27px", fontWeight: "850", lineHeight: 1.15, marginTop: "13px", fontVariantNumeric: "tabular-nums", letterSpacing: "-.4px" }}>{value}</div>
            <div style={{ width: "34px", height: "3px", background: accent, borderRadius: "99px", marginTop: "11px", opacity: ".75" }} />
        </div>
    );
}

function IncidenciaCard({ inc }) {
    const revisada = inc.revisada === 1 || inc.revisada === true;
    return (
        <div style={{
            border: `1px solid ${palette.border}`,
            borderRadius: "9px",
            padding: "14px",
            background: revisada ? palette.surface : "rgba(212,175,55,.12)"
        }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: "10px", flexWrap: "wrap" }}>
                <strong style={{ color: palette.gold }}>👤 {inc.nombre || inc.asesor_nombre || "Asesor"}</strong>
                <span style={{ color: revisada ? palette.gold : "#ffb3aa", fontWeight: "bold", fontSize: "12px" }}>
                    {revisada ? "✅ Revisada" : "⏳ Pendiente"}
                </span>
            </div>
            <p style={{ margin: "7px 0" }}><strong>Tipo:</strong> {inc.tipo} ({inc.nivel})</p>
            <p style={{ margin: "7px 0" }}><strong>Detalle:</strong> {inc.detalle}</p>
            {inc.tipo === "PAUSA DE LLAMADAS" ? (
                <>
                    <p style={{ margin: "5px 0", color: palette.black, fontSize: "13px" }}><strong>Inicio:</strong> {formatearHoraColombia(inc.fecha_hora)}</p>
                    <p style={{ margin: "5px 0", color: palette.black, fontSize: "13px" }}><strong>Fin:</strong> {inc.fecha_fin ? formatearHoraColombia(inc.fecha_fin) : "⏳ En curso"}</p>
                    {inc.fecha_fin && <p style={{ margin: "5px 0", color: palette.gold, fontWeight: "bold", fontSize: "13px" }}>Duración: {calcularDuracion(inc.fecha_hora, inc.fecha_fin)}</p>}
                </>
            ) : (
                <p style={{ margin: "5px 0", color: palette.black, fontSize: "13px" }}><strong>Hora:</strong> {formatearHoraColombia(inc.fecha_hora)}</p>
            )}
            {revisada && (
                <div style={{ marginTop: "9px", padding: "9px", borderRadius: "6px", background: "#e2f0d9", fontSize: "13px" }}>
                    <p style={{ margin: "2px 0" }}><strong>Coach revisor:</strong> {inc.revisada_por || "—"}</p>
                    <p style={{ margin: "2px 0" }}><strong>Comentario:</strong> {inc.comentario || "—"}</p>
                </div>
            )}
        </div>
    );
}

export default function Dashboard() {
    const [asesores, setAsesores] = useState([]);
    const [incidencias, setIncidencias] = useState([]);
    const [productividad, setProductividad] = useState({
        tiempo_trabajado: 0,
        tiempo_productivo: 0,
        tiempo_break: 0,
        tiempo_almuerzo: 0,
        tiempo_bano: 0,
        porcentaje: 0
    });
    const [historial, setHistorial] = useState([]);
    const [asesorSeleccionado, setAsesorSeleccionado] = useState(null);
    const [resumenJornada, setResumenJornada] = useState(null);
    const [ahora, setAhora] = useState(Date.now());
    const [mostrarHistorialIncidencias, setMostrarHistorialIncidencias] = useState(false);
    const [listaHistorialGeneral, setListaHistorialGeneral] = useState([]);
    const [cargandoHistorialGeneral, setCargandoHistorialGeneral] = useState(false);
    const [mostrarHistorialGeneral, setMostrarHistorialGeneral] = useState(false);
    const [filtrosHistorialGeneral, setFiltrosHistorialGeneral] = useState({ fechaDesde: "", fechaHasta: "", asesorId: "", tipo: "", nivel: "" });
    const [filtroEstado, setFiltroEstado] = useState("");

    async function cargarDashboard() {
        try {
            const [dashboard, incidenciasRes] = await Promise.all([
                api.get("/dashboard"),
                api.get("/incidencias")
            ]);
            setAsesores(dashboard.data.asesores || []);
            setProductividad(dashboard.data.productividad || {});
            setIncidencias(incidenciasRes.data?.incidencias || incidenciasRes.data || []);
        } catch (error) {
            console.error("ERROR DASHBOARD", error);
        }
    }

    useEffect(() => {
        cargarDashboard();
        const actualizar = () => cargarDashboard();
        window.addEventListener("datos-actualizados", actualizar);
        const intervalo = setInterval(cargarDashboard, 5000);
        return () => {
            window.removeEventListener("datos-actualizados", actualizar);
            clearInterval(intervalo);
        };
    }, []);

    useEffect(() => {
        const timer = setInterval(() => setAhora(Date.now()), 1000);
        return () => clearInterval(timer);
    }, []);

    async function verHistorial(asesor) {
        try {
            const [historialRes, resumenRes] = await Promise.all([
                api.get(`/movimientos/historial/${asesor.id}`),
                api.get(`/movimientos/resumen/${asesor.id}`)
            ]);
            let movimientos = [];
            if (Array.isArray(historialRes.data)) movimientos = historialRes.data;
            else if (Array.isArray(historialRes.data?.data)) movimientos = historialRes.data.data;
            else if (Array.isArray(historialRes.data?.data?.movimientos)) movimientos = historialRes.data.data.movimientos;
            setHistorial(movimientos);
            setResumenJornada(resumenRes.data?.data?.resumen || resumenRes.data?.resumen || null);
            setAsesorSeleccionado(asesor);
        } catch (error) {
            console.error("❌ ERROR CARGANDO HISTORIAL", error);
            alert("No fue posible cargar el historial.");
        }
    }

    async function buscarHistorialIncidenciasGeneral(filtros = filtrosHistorialGeneral) {
        if (filtros.fechaDesde && filtros.fechaHasta && filtros.fechaDesde > filtros.fechaHasta) {
            alert("La fecha Desde no puede ser posterior a la fecha Hasta.");
            return;
        }
        const params = new URLSearchParams();
        Object.entries({ fecha_desde: filtros.fechaDesde, fecha_hasta: filtros.fechaHasta, asesor_id: filtros.asesorId, tipo: filtros.tipo, nivel: filtros.nivel })
            .forEach(([key, value]) => value && params.set(key, value));
        if (![...params].length) {
            setListaHistorialGeneral([]);
            return;
        }
        try {
            setCargandoHistorialGeneral(true);
            const response = await api.get(`/incidencias/historial?${params.toString()}`);
            setListaHistorialGeneral(response.data?.incidencias || response.data || []);
        } catch (error) {
            console.error("Error al cargar incidencias filtradas", error);
            setListaHistorialGeneral([]);
        } finally {
            setCargandoHistorialGeneral(false);
        }
    }

    function actualizarFiltro(campo, valor) {
        setFiltrosHistorialGeneral((anterior) => ({ ...anterior, [campo]: valor }));
    }

    function limpiarFiltros() {
        setFiltrosHistorialGeneral({ fechaDesde: "", fechaHasta: "", asesorId: "", tipo: "", nivel: "" });
        setListaHistorialGeneral([]);
    }

    const trabajando = asesores.filter((a) => a.estado === "TRABAJANDO").length;
    const pausas = asesores.filter((a) => ["BREAK", "ALMUERZO", "BANO", "CAPACITACION", "REUNION"].includes(a.estado)).length;
    const llegadasTarde = asesores.filter((a) => a.llego_tarde).length;
    const asesoresConJornada = asesores.filter((a) => Number(a.tiempo_trabajado) > 0);
    const tiempoPromedio = asesoresConJornada.length > 0
        ? productividad.tiempo_trabajado / asesoresConJornada.length
        : 0;
    const iniciosJornada = asesores
        .map((a) => convertirFechaColombia(a.inicio_jornada))
        .filter(Boolean)
        .map((fecha) => fecha.getTime());
    const inicioOperacion = iniciosJornada.length ? Math.min(...iniciosJornada) : null;
    const jornadaTranscurrida = inicioOperacion
        ? Math.max(0, ahora - inicioOperacion)
        : 0;
    const asesoresVisibles = useMemo(() => filtroEstado ? asesores.filter((a) => a.estado === filtroEstado) : asesores, [asesores, filtroEstado]);

    const inputStyle = { padding: "9px", borderRadius: "7px", border: "1px solid #555", background: palette.surface2, color: palette.black, width: "100%", boxSizing: "border-box" };

    return (
        <div style={{ marginTop: 30, background: "#ffffff", color: palette.black, border: `1px solid ${palette.border}`, borderRadius: "14px", padding: "20px", boxSizing: "border-box" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "15px", flexWrap: "wrap" }}>
                <div>
                    <h2 style={{ color: palette.gold, margin: 0 }}>📊 Dashboard en tiempo real</h2>
                    <p style={{ color: palette.muted, margin: "6px 0 0" }}>Supervisión general de la operación</p>
                </div>
                <ExportarWord />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "12px", marginTop: "20px" }}>
                <KpiCard icon="👥" label="Asesores" value={asesores.length} accent="#0d6efd" />
                <KpiCard icon="☕" label="En pausa" value={pausas} accent="#fd7e14" />
                <KpiCard icon="🚨" label="Llegadas tarde" value={llegadasTarde} accent="#dc3545" />
                <KpiCard icon="📌" label="Incidencias pendientes" value={incidencias.length} accent="#6f42c1" />
            </div>

            <Modulo title="📊 Productividad del día" defaultOpen={true}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(165px, 1fr))", gap: "12px" }}>
                    <KpiCard icon="⏱" label="Tiempo trabajado del equipo" value={formatearDuracion(productividad.tiempo_trabajado)} accent="#198754" />
                    <KpiCard icon="🕒" label="Jornada transcurrida" value={formatearDuracion(jornadaTranscurrida)} accent="#0d6efd" />
                    <KpiCard icon="👥" label="Promedio por asesor" value={formatearDuracion(tiempoPromedio)} accent="#6f42c1" />
                    <KpiCard icon="📈" label="Tiempo productivo" value={formatearDuracion(productividad.tiempo_productivo)} accent="#20c997" />
                    <KpiCard icon="✅" label="Productividad" value={`${productividad.porcentaje || 0}%`} accent="#0d6efd" />
                    <KpiCard icon="☕" label="Break utilizado" value={formatearDuracion(productividad.tiempo_break)} accent="#fd7e14" />
                    <KpiCard icon="🚻" label="Baño utilizado" value={formatearDuracion(productividad.tiempo_bano)} accent="#6f42c1" />
                </div>
            </Modulo>

            <Modulo title="👥 Asesores" count={`${asesoresVisibles.length}/${asesores.length}`}>
                <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "12px" }}>
                    <select value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)} style={{ ...inputStyle, maxWidth: "220px" }}>
                        <option value="">Todos los estados</option>
                        <option value="TRABAJANDO">Trabajando</option>
                        <option value="BREAK">Break</option>
                        <option value="ALMUERZO">Almuerzo</option>
                        <option value="BANO">Baño</option>
                        <option value="CAPACITACION">Capacitación</option>
                        <option value="REUNION">Reunión</option>
                        <option value="SALIDA">Salida</option>
                        <option value="DISPONIBLE">Disponible</option>
                    </select>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(255px, 1fr))", gap: "16px" }}>
                    {asesoresVisibles.map((a) => {
                        const inicio = convertirFechaColombia(a.inicio_estado);
                        const segundos = inicio && a.estado !== "SALIDA" ? Math.max(0, Math.floor((ahora - inicio.getTime()) / 1000)) : 0;
                        const tiempo = `${String(Math.floor(segundos / 3600)).padStart(2, "0")}:${String(Math.floor((segundos % 3600) / 60)).padStart(2, "0")}:${String(segundos % 60).padStart(2, "0")}`;
                        const estado = a.estado || "DISPONIBLE";
                        const estadoConfig = {
                            TRABAJANDO: { color: "#198754", fondo: "#e8f7ee", icono: "●" },
                            BREAK: { color: "#fd7e14", fondo: "#fff2e6", icono: "☕" },
                            ALMUERZO: { color: "#b7791f", fondo: "#fff8df", icono: "🍽" },
                            BANO: { color: "#6f42c1", fondo: "#f1ebff", icono: "🚻" },
                            CAPACITACION: { color: "#0d6efd", fondo: "#eaf2ff", icono: "📚" },
                            REUNION: { color: "#0891b2", fondo: "#e6f8fb", icono: "👥" },
                            SALIDA: { color: "#6c757d", fondo: "#f1f3f5", icono: "○" },
                            DISPONIBLE: { color: "#6c757d", fondo: "#f1f3f5", icono: "○" }
                        }[estado] || { color: palette.gold, fondo: "#eef5ff", icono: "●" };
                        return (
                            <div key={a.id} style={{ background: "linear-gradient(145deg, #ffffff 0%, #f7fbf8 100%)", border: `1px solid ${a.llego_tarde ? "#f1aeb5" : "#d9ebe0"}`, borderTop: `4px solid ${estadoConfig.color}`, borderRadius: "16px", padding: "18px", boxShadow: "0 8px 20px rgba(35, 90, 62, .08)", transition: "transform .2s ease, box-shadow .2s ease" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "10px", marginBottom: "16px" }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
                                        <div style={{ width: "40px", height: "40px", borderRadius: "12px", display: "grid", placeItems: "center", background: estadoConfig.fondo, color: estadoConfig.color, fontSize: "18px", flexShrink: 0 }}>{estadoConfig.icono}</div>
                                        <div style={{ minWidth: 0, flex: 1 }}><h3 style={{ color: "#245b3a", margin: 0, fontSize: "17px", lineHeight: 1.2, whiteSpace: "normal", overflowWrap: "anywhere" }}>{a.nombre}</h3><span style={{ color: "#789184", fontSize: "12px" }}>Asesor operativo</span></div>
                                    </div>
                                    <span style={{ background: estadoConfig.fondo, color: estadoConfig.color, borderRadius: "999px", padding: "5px 9px", fontSize: "11px", fontWeight: "800", whiteSpace: "nowrap" }}>{estado}</span>
                                </div>
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "9px", marginBottom: "14px" }}>
                                    <div style={{ background: "#f3f8f4", borderRadius: "10px", padding: "10px" }}><div style={{ color: "#789184", fontSize: "11px", fontWeight: "700", textTransform: "uppercase" }}>Inicio</div><strong style={{ color: "#245b3a", fontSize: "14px" }}>{a.inicio_estado ? formatearHoraColombia(a.inicio_estado) : "--:--"}</strong></div>
                                    <div style={{ background: "#f3f8f4", borderRadius: "10px", padding: "10px" }}><div style={{ color: "#789184", fontSize: "11px", fontWeight: "700", textTransform: "uppercase" }}>En estado</div><strong style={{ color: "#245b3a", fontSize: "14px", fontVariantNumeric: "tabular-nums" }}>{a.inicio_estado && estado !== "SALIDA" ? tiempo : "--:--:--"}</strong></div>
                                </div>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0 14px", borderTop: "1px solid #e4efe7" }}><span style={{ color: "#789184", fontSize: "13px", fontWeight: "700" }}>Puntualidad</span><span style={{ color: a.llego_tarde ? "#dc3545" : "#198754", fontWeight: "800", fontSize: "13px" }}>{a.llego_tarde ? `🔴 ${a.minutos_retraso ?? 0} min tarde` : "🟢 Puntual"}</span></div>
                                <button onClick={() => verHistorial(a)} style={{ width: "100%", padding: "11px 14px", background: "#245b3a", color: "#ffffff", border: "none", borderRadius: "10px", fontWeight: "800", cursor: "pointer", boxShadow: "0 5px 12px rgba(36,91,58,.18)" }}>📋 Abrir historial</button>
                            </div>
                        );
                    })}
                </div>
            </Modulo>

            <Modulo title="🚨 Incidencias pendientes" count={incidencias.length}>
                <Alertas asesores={asesores} incidencias={incidencias} />
                <CentroIncidencias incidencias={incidencias} />
                <PanelIncidencias incidencias={incidencias} onActualizar={cargarDashboard} />
            </Modulo>

            <Modulo title="📋 Historial de incidencias" count={listaHistorialGeneral.length} defaultOpen={false}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(155px, 1fr))", gap: "10px", marginBottom: "14px" }}>
                    <label>Desde<input type="date" value={filtrosHistorialGeneral.fechaDesde} onChange={(e) => actualizarFiltro("fechaDesde", e.target.value)} style={inputStyle} /></label>
                    <label>Hasta<input type="date" value={filtrosHistorialGeneral.fechaHasta} onChange={(e) => actualizarFiltro("fechaHasta", e.target.value)} style={inputStyle} /></label>
                    <label>Asesor<select value={filtrosHistorialGeneral.asesorId} onChange={(e) => actualizarFiltro("asesorId", e.target.value)} style={inputStyle}><option value="">Todos</option>{asesores.map((a) => <option key={a.id} value={a.id}>{a.nombre}</option>)}</select></label>
                    <label>Tipo<select value={filtrosHistorialGeneral.tipo} onChange={(e) => actualizarFiltro("tipo", e.target.value)} style={inputStyle}><option value="">Todos</option><option value="BREAK">BREAK</option><option value="ALMUERZO">ALMUERZO</option><option value="BAÑO">BAÑO</option><option value="CAPACITACIÓN">CAPACITACIÓN</option><option value="REUNIÓN">REUNIÓN</option><option value="PAUSA DE LLAMADAS">PAUSA DE LLAMADAS</option></select></label>
                    <label>Nivel<select value={filtrosHistorialGeneral.nivel} onChange={(e) => actualizarFiltro("nivel", e.target.value)} style={inputStyle}><option value="">Todos</option><option value="BAJO">BAJO</option><option value="MEDIO">MEDIO</option><option value="ALTO">ALTO</option><option value="INFORMATIVA">INFORMATIVA</option></select></label>
                </div>
                <div style={{ display: "flex", gap: "8px", marginBottom: "14px" }}><button onClick={() => buscarHistorialIncidenciasGeneral()} style={{ padding: "10px 16px", background: palette.gold, color: "#ffffff", border: "none", borderRadius: "7px", fontWeight: "bold", cursor: "pointer" }}>{cargandoHistorialGeneral ? "Consultando..." : "🔍 Consultar"}</button><button onClick={limpiarFiltros} style={{ padding: "10px 16px", background: palette.surface2, color: palette.black, border: `1px solid ${palette.border}`, borderRadius: "7px", cursor: "pointer" }}>Limpiar</button></div>
                {listaHistorialGeneral.length === 0 ? <p style={{ color: palette.muted }}>Selecciona filtros y presiona Consultar.</p> : <div style={{ display: "grid", gap: "12px" }}>{listaHistorialGeneral.map((inc) => <IncidenciaCard key={inc.id} inc={inc} />)}</div>}
            </Modulo>

            <Modulo title="💰 Ventas del día" defaultOpen={false}>
                <div style={{ padding: "4px" }}><p style={{ color: palette.muted }}>El resumen de ventas se muestra en el módulo de ventas del dashboard.</p></div>
            </Modulo>

            {asesorSeleccionado && (
                <div role="dialog" aria-modal="true" onClick={(e) => e.target === e.currentTarget && setAsesorSeleccionado(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.55)", display: "flex", justifyContent: "center", alignItems: "center", padding: "20px", zIndex: 9999 }}>
                    <div style={{ background: palette.surface, color: palette.black, width: "100%", maxWidth: "700px", maxHeight: "90vh", overflowY: "auto", border: `1px solid ${palette.border}`, borderTop: `5px solid ${palette.gold}`, borderRadius: "14px", padding: "24px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", alignItems: "center" }}><h2 style={{ color: palette.gold, margin: 0 }}>📋 Historial de {asesorSeleccionado.nombre}</h2><button onClick={() => setAsesorSeleccionado(null)} style={{ background: palette.red, color: "#fff", border: "none", borderRadius: "6px", padding: "8px 12px", cursor: "pointer" }}>Cerrar</button></div>
                        <hr style={{ borderColor: palette.border, margin: "18px 0" }} />
                        <ExportarHistorial historial={historial} asesor={asesorSeleccionado} />
                        <button onClick={() => setMostrarHistorialIncidencias(true)} style={{ width: "100%", marginTop: "14px", padding: "10px", background: palette.gold, color: "#ffffff", border: "none", borderRadius: "7px", fontWeight: "bold", cursor: "pointer" }}>🚨 Ver Historial de Incidencias</button>
                        {historial.length === 0 ? <p style={{ color: palette.muted, textAlign: "center", padding: "20px" }}>📭 No hay movimientos hoy.</p> : historial.map((m) => <div key={m.id} style={{ padding: "12px 0", borderBottom: `1px solid ${palette.border}` }}><strong>{m.tipo || "Movimiento"}</strong><br /><span style={{ color: palette.muted }}>{formatearHoraColombia(m.fecha_hora)}</span></div>)}
                        {mostrarHistorialIncidencias && <HistorialIncidenciasModal asesorId={asesorSeleccionado.id} asesores={asesores} onClose={() => setMostrarHistorialIncidencias(false)} />}
                    </div>
                </div>
            )}
        </div>
    );
}
