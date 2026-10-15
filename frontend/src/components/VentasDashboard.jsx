import { useEffect, useState } from "react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import RankingPodium from "./RankingPodium";
import VentasChart from "./VentasChart";
import ActivityTimeline from "./ActivityTimeline";

function ahoraColombia() {
    const partes = new Intl.DateTimeFormat("en-CA", {
        timeZone: "America/Bogota",
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
    }).formatToParts(new Date()).reduce((resultado, parte) => ({ ...resultado, [parte.type]: parte.value }), {});
    return { year: Number(partes.year), month: Number(partes.month), day: Number(partes.day) };
}

function obtenerPeriodoInicial() {
    const ahora = ahoraColombia();
    const mes = `${ahora.year}-${String(ahora.month).padStart(2, "0")}`;
    return { mes, quincena: ahora.day <= 15 ? "1" : "2" };
}

function formatearHoraColombia(valor) {
    if (!valor) return "Hora no disponible";
    const texto = String(valor).trim();
    const incluyeZona = /(?:Z|[+-]\d{2}:?\d{2})$/iu.test(texto);
    const fecha = new Date(incluyeZona ? texto : `${texto.replace(" ", "T")}-05:00`);
    if (Number.isNaN(fecha.getTime())) return "Hora no disponible";
    return new Intl.DateTimeFormat("es-CO", {
        timeZone: "America/Bogota",
        hour: "2-digit",
        minute: "2-digit"
    }).format(fecha);
}

function asesorIdDeSesion(usuario) {
    const directo = Number(usuario?.asesor_id);
    if (Number.isInteger(directo) && directo > 0) return directo;
    try {
        const token = localStorage.getItem("token");
        const payload = token ? JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/"))) : null;
        const asesorId = Number(payload?.asesor_id);
        return Number.isInteger(asesorId) && asesorId > 0 ? asesorId : null;
    } catch {
        return null;
    }
}

export default function VentasDashboard({ esAdministrador = false, movimientos = [], asesorSeleccionadoId = null, asesorSeleccionadoNombre = "" }) {

    const { usuario } = useAuth();
    const asesorActualId = asesorIdDeSesion(usuario);

    const [resumenDia, setResumenDia] = useState({
        cantidad_ventas: 0,
        total_vendido: 0
    });

    const [porAsesor, setPorAsesor] = useState([]);

    const [ventasDia, setVentasDia] = useState([]);

    const [filtroAsesorId, setFiltroAsesorId] = useState("todos");
    const [busquedaVentas, setBusquedaVentas] = useState("");
    const [filtroEstadoVenta, setFiltroEstadoVenta] = useState("TODAS");

    const [actualizandoPanel, setActualizandoPanel] = useState(false);

    const [ultimaActualizacion, setUltimaActualizacion] = useState(null);

    const [revisionGrafica, setRevisionGrafica] = useState(0);

    const [errorVentas, setErrorVentas] = useState("");

    const [anulando, setAnulando] = useState(null);

    const [desplegado, setDesplegado] = useState(false);
    const periodoInicial = obtenerPeriodoInicial();
    const [mesRanking, setMesRanking] = useState(periodoInicial.mes);
    const [quincenaRanking, setQuincenaRanking] = useState(periodoInicial.quincena);
    const [rankingQuincenal, setRankingQuincenal] = useState([]);
    const [cargandoRanking, setCargandoRanking] = useState(false);
    const [configVentas, setConfigVentas] = useState({ moneda: "USD", simbolo_moneda: "$", ranking_activo: true, ranking_visible_asesores: true, criterio_ranking: "RECAUDO" });

    // ======================================================
    // CARGAR DATOS
    // ======================================================

    async function cargarVentas({ manual = false } = {}) {

        if (manual) setActualizandoPanel(true);

        try {

            const [resDia, resAsesores, resListado, resConfig] = await Promise.all([
                api.get("/ventas/resumen/dia"),
                api.get("/ventas/resumen/asesores"),
                api.get("/ventas/dia"),
                api.get("/configuracion-ventas")
            ]);
            if (resConfig.data?.data) setConfigVentas((actual) => ({ ...actual, ...resConfig.data.data }));

            setResumenDia(
                resDia.data?.data || { cantidad_ventas: 0, total_vendido: 0 }
            );

            setPorAsesor(
                Array.isArray(resAsesores.data?.data)
                    ? resAsesores.data.data
                    : []
            );

            setVentasDia(
                Array.isArray(resListado.data?.data)
                    ? resListado.data.data
                    : []
            );

            setUltimaActualizacion(new Date());
            setErrorVentas("");

        } catch (error) {

            console.error("Error cargando ventas:", error);
            setErrorVentas("No se pudieron actualizar las ventas. Intenta de nuevo.");

        } finally {

            if (manual) setActualizandoPanel(false);
        }

    }

    function obtenerFechasRanking() {
        const [anio, mes] = mesRanking.split("-").map(Number);
        if (!anio || !mes) return null;
        const ultimoDia = new Date(anio, mes, 0).getDate();
        return quincenaRanking === "1"
            ? { desde: `${mesRanking}-01`, hasta: `${mesRanking}-15` }
            : { desde: `${mesRanking}-16`, hasta: `${mesRanking}-${String(ultimoDia).padStart(2, "0")}` };
    }

    async function cargarRankingQuincenal() {
        const fechas = obtenerFechasRanking();
        if (!fechas) return;
        setCargandoRanking(true);
        try {
            const { data } = await api.get(`/ventas/resumen/asesores/periodo?fecha_desde=${fechas.desde}&fecha_hasta=${fechas.hasta}`);
            setRankingQuincenal(Array.isArray(data?.data) ? data.data : []);
        } catch (error) {
            console.error("Error cargando ranking quincenal:", error);
            setRankingQuincenal([]);
        } finally {
            setCargandoRanking(false);
        }
    }

    async function actualizarPanel() {
        setRevisionGrafica((revision) => revision + 1);
        await Promise.all([
            cargarVentas({ manual: true }),
            cargarRankingQuincenal()
        ]);
    }

    // ======================================================
    // ANULAR VENTA
    // ======================================================

    async function anularVenta(id, clienteId) {

        const motivo = window.prompt("Escribe el motivo de la anulación (mínimo 5 caracteres):", "");
        if (motivo === null || motivo.trim().length < 5) {
            if (motivo !== null) window.alert("La anulación requiere un motivo de al menos 5 caracteres.");
            return;
        }
        const confirmar = window.confirm(
            `¿Confirmas anular esta venta${clienteId ? ` (cliente: ${clienteId})` : ""}?\n\nMotivo: ${motivo.trim()}\n\nEsta acción quedará auditada.`
        );
        if (!confirmar) return;
        setAnulando(id);
        try {
            await api.patch(`/ventas/${id}/anular`, { motivo: motivo.trim() });

            await cargarVentas();

        } catch (error) {

            console.error("Error anulando venta:", error);

            alert(
                error.response?.data?.mensaje ||
                error.message ||
                "No fue posible anular la venta."
            );

        } finally {

            setAnulando(null);

        }

    }

    useEffect(() => {

        cargarVentas();
        cargarRankingQuincenal();

        const intervalo = setInterval(() => {
            cargarVentas();
            cargarRankingQuincenal();
        }, 5000);

        return () => clearInterval(intervalo);

    }, [mesRanking, quincenaRanking]);

    useEffect(() => {
        const actualizarDespuesDeVenta = () => {
            cargarVentas();
            cargarRankingQuincenal();
            setRevisionGrafica((revision) => revision + 1);
        };
        window.addEventListener("venta-registrada", actualizarDespuesDeVenta);
        return () => window.removeEventListener("venta-registrada", actualizarDespuesDeVenta);
    }, [mesRanking, quincenaRanking]);

    // ======================================================
    // FORMATO DE MONEDA
    // ======================================================

    function formatearMoneda(valor) {

        const numero = Number(valor) || 0;

        return `${configVentas.simbolo_moneda || "$"}${numero.toLocaleString("es-CO", { maximumFractionDigits: 0 })}`;

    }

    const asesoresFiltrados = filtroAsesorId === "todos"
        ? porAsesor
        : porAsesor.filter((asesor) => String(asesor.asesor_id) === filtroAsesorId);
    const ventasDiaFiltradas = filtroAsesorId === "todos"
        ? ventasDia
        : ventasDia.filter((venta) => String(venta.asesor_id) === filtroAsesorId);
    const busquedaNormalizada = busquedaVentas.trim().toLocaleLowerCase("es");
    const ventasDetalleFiltradas = ventasDiaFiltradas.filter((venta) => {
        const coincideEstado = filtroEstadoVenta === "TODAS" || venta.estado === filtroEstadoVenta;
        const contenido = [venta.cliente_id, venta.asesor_nombre, venta.observacion, venta.valor, venta.recaudo]
            .filter((valor) => valor !== null && valor !== undefined)
            .join(" ")
            .toLocaleLowerCase("es");
        return coincideEstado && (!busquedaNormalizada || contenido.includes(busquedaNormalizada));
    });
    const asesorActividadId = asesorSeleccionadoId != null && String(asesorSeleccionadoId) !== ""
        ? String(asesorSeleccionadoId)
        : asesorActualId != null ? String(asesorActualId) : null;
    const movimientosActividad = String(asesorActividadId) === String(asesorSeleccionadoId) ? movimientos : [];
    const ventasActividad = asesorActividadId == null
        ? []
        : ventasDia.filter((venta) => String(venta.asesor_id) === String(asesorActividadId));
    const asesorEncontrado = porAsesor.find((asesor) => String(asesor.asesor_id) === String(asesorActividadId));
    const nombreAsesorActividad = asesorEncontrado?.asesor_nombre
        || (String(asesorActividadId) === String(asesorSeleccionadoId) ? asesorSeleccionadoNombre : "");
    const resumenDiaVisible = filtroAsesorId === "todos"
        ? resumenDia
        : porAsesor.find((asesor) => String(asesor.asesor_id) === filtroAsesorId)
            || { cantidad_ventas: 0, total_vendido: 0 };
    const periodoActual = obtenerPeriodoInicial();
    const esPeriodoVigente = mesRanking === periodoActual.mes && quincenaRanking === periodoActual.quincena;
    const rankingFuente = rankingQuincenal.length > 0
        ? rankingQuincenal
        : esPeriodoVigente
            ? porAsesor
            : [];
    const ranking = [...rankingFuente].sort((a, b) => {
        const ventas = Number(b.cantidad_ventas || 0) - Number(a.cantidad_ventas || 0);
        const recaudo = Number(b.total_recaudo || 0) - Number(a.total_recaudo || 0);
        const vendido = Number(b.total_vendido || 0) - Number(a.total_vendido || 0);
        return ventas || recaudo || vendido || String(a.asesor_nombre || "").localeCompare(String(b.asesor_nombre || ""));
    });

    // ======================================================
    // INTERFAZ
    // ======================================================

    return (

        <div
            className="ventas-dashboard"
            style={{
                marginTop: 0,
                minWidth: 0,
                width: "100%",
                background: "#ffffff",
                border: "1px solid #dddddd",
                boxShadow: "0 8px 24px rgba(0,0,0,0.3)",
                borderRadius: 10,
                padding: 20
            }}
        >

            <button
                type="button"
                aria-expanded={desplegado}
                aria-controls="ventas-del-dia-contenido"
                onClick={() => setDesplegado(!desplegado)}
                style={{
                    width: "100%",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    background: "#f8f9fa",
                    border: "1px solid #dddddd",
                    borderRadius: "10px",
                    padding: "15px 20px",
                    cursor: "pointer",
                    fontSize: "20px",
                    fontWeight: "bold",
                    color: "#0d6efd"
                }}
            >
                <span>💰 Ventas del día</span>
                <span>{desplegado ? "▲" : "▼"}</span>
            </button>

            {desplegado && (

            <div id="ventas-del-dia-contenido" style={{ marginTop: "20px", minWidth: 0 }}>

            <div className="ventas-toolbar" aria-live="polite">
                <p>
                    {ultimaActualizacion
                        ? `Actualizado a las ${new Intl.DateTimeFormat("es-CO", { timeZone: "America/Bogota", hour: "2-digit", minute: "2-digit", second: "2-digit" }).format(ultimaActualizacion)}`
                        : "Cargando información de ventas…"}
                </p>
                <button type="button" className="ventas-refresh-button" onClick={actualizarPanel} disabled={actualizandoPanel}>
                    {actualizandoPanel ? "Actualizando…" : "🔄 Actualizar ventas"}
                </button>
            </div>

            {errorVentas && <p role="alert" style={{ margin: "0 0 16px", padding: "10px 12px", borderRadius: 8, background: "#fff1f0", color: "#a3271b" }}>{errorVentas}</p>}

            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))",
                    gap: "15px",
                    marginBottom: "25px"
                }}
            >

                <div
                    style={{
                        background: "#D4AF37",
                        color: "#212529",
                        padding: "15px",
                        borderRadius: "10px",
                        textAlign: "center"
                    }}
                >
                    <h2 style={{ color: "#212529", margin: 0 }}>{resumenDiaVisible.cantidad_ventas}</h2>
                    <small>💰 Ventas</small>
                </div>

                <div
                    style={{
                        background: "#D4AF37",
                        color: "#212529",
                        padding: "15px",
                        borderRadius: "10px",
                        textAlign: "center"
                    }}
                >
                    <h2 style={{ color: "#212529", margin: 0 }}>{formatearMoneda(resumenDiaVisible.total_vendido)}</h2>
                    <small>💵 Total vendido</small>
                </div>

            </div>

            <div className="ventas-filterbar">
                <label htmlFor="filtro-asesor-ventas">Filtrar resumen y detalle por asesor</label>
                <select id="filtro-asesor-ventas" value={filtroAsesorId} onChange={(evento) => setFiltroAsesorId(evento.target.value)}>
                    <option value="todos">Todos los asesores</option>
                    {porAsesor.map((asesor) => (
                        <option key={asesor.asesor_id} value={String(asesor.asesor_id)}>{asesor.asesor_nombre}</option>
                    ))}
                </select>
                <small>El ranking quincenal sigue mostrando al equipo completo.</small>
            </div>

            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))",
                    gap: "20px"
                }}
            >

                {asesoresFiltrados.map((a) => (

                    <div
                        key={a.asesor_id}
                        style={{
                            background: "#f8f9fa",
                            borderRadius: "8px",
                            padding: "12px",
                            boxShadow: "0 3px 10px rgba(0,0,0,0.15)",
                            border: "1px solid #dddddd",
                            borderLeft: "8px solid #D4AF37"
                        }}
                    >

                        <h3 style={{ marginBottom: "8px", fontSize: "16px" }}>
                            👤 {a.asesor_nombre}
                        </h3>

                        <p style={{ margin: "4px 0" }}>
                            💰 Ventas: <strong>{a.cantidad_ventas}</strong>
                        </p>

                        <p style={{ margin: "4px 0" }}>
                            💵 Total vendido: <strong>{formatearMoneda(a.total_vendido)}</strong>
                        </p>

                        <p style={{ margin: "4px 0", color: "#198754" }}>
                            📥 Recaudo: <strong>{formatearMoneda(a.total_recaudo)}</strong>
                        </p>

                    </div>

                ))}

            </div>

            <ActivityTimeline
                movimientos={movimientosActividad}
                ventas={ventasActividad}
                asesorNombre={nombreAsesorActividad}
                formatearMoneda={formatearMoneda}
            />

            <VentasChart simboloMoneda={configVentas.simbolo_moneda} refreshKey={revisionGrafica} />

            {configVentas.ranking_activo && (esAdministrador || configVentas.ranking_visible_asesores) && (
            <div style={{ marginTop: "25px", background: "#ffffff", border: "1px solid #dddddd", borderRadius: "10px", padding: "15px" }}>
                <h3 style={{ margin: "0 0 12px", color: "#0d6efd" }}>🏆 Ranking de ventas y recaudo</h3>
                <p style={{ margin: "0 0 12px", color: "#66756b", fontSize: 13 }}>Ordenado primero por cantidad de ventas, después por recaudo y luego por valor vendido.</p>
                <p style={{ margin: "0 0 12px", color: "#666" }}>
                    Periodo calculado automáticamente: {quincenaRanking === "1" ? "del 01 al 15" : "del 16 al último día"} de {new Date(`${mesRanking}-02T12:00:00`).toLocaleDateString("es-CO", { month: "long", year: "numeric" })}.
                </p>
                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "flex-end", marginBottom: "15px" }}>
                    <label style={{ color: "#212529", fontWeight: "bold" }}>Mes<input type="month" value={mesRanking} onChange={(e) => setMesRanking(e.target.value)} style={{ display: "block", marginTop: "5px", padding: "8px", border: "1px solid #ccc", borderRadius: "6px" }} /></label>
                    <label style={{ color: "#212529", fontWeight: "bold" }}>Periodo<select value={quincenaRanking} onChange={(e) => setQuincenaRanking(e.target.value)} style={{ display: "block", marginTop: "5px", padding: "9px", border: "1px solid #ccc", borderRadius: "6px" }}><option value="1">Primera quincena (01–15)</option><option value="2">Segunda quincena (16–fin de mes)</option></select></label>
                    <button onClick={cargarRankingQuincenal} disabled={cargandoRanking} style={{ padding: "10px 15px", background: "#0d6efd", color: "#fff", border: "none", borderRadius: "6px", fontWeight: "bold", cursor: "pointer" }}>{cargandoRanking ? "Consultando..." : "🔍 Consultar ranking"}</button>
                </div>
                <RankingPodium ranking={ranking} asesorId={asesorActualId} formatearMoneda={formatearMoneda} />
                {ranking.length === 0 ? (
                    <p style={{ color: "#666", margin: 0 }}>No hay ventas activas en la quincena seleccionada.</p>
                ) : (
                    <div style={{ overflowX: "auto" }}>
                        <table className="ventas-ranking-table" style={{ width: "100%", borderCollapse: "collapse", minWidth: "560px" }}>
                            <thead>
                                <tr>
                                    {["Posición", "Asesor", "Ventas", "Total vendido", "Recaudo quincenal"].map((encabezado) => (
                                        <th key={encabezado} style={{ textAlign: "left", padding: "9px", color: "#666666", borderBottom: "1px solid #dddddd" }}>{encabezado}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {ranking.map((a, indice) => (
                                    <tr key={a.asesor_id} className={asesorActualId != null && String(a.asesor_id) === String(asesorActualId) ? "ventas-ranking-current" : ""}>
                                        <td style={{ padding: "9px", color: indice === 0 ? "#9a7412" : "#35465e", fontWeight: "bold" }}>{indice === 0 ? "🥇 1" : indice === 1 ? "🥈 2" : indice === 2 ? "🥉 3" : indice + 1}</td>
                                        <td style={{ padding: "9px", color: "#0d6efd", fontWeight: "bold" }}>{a.asesor_nombre}</td>
                                        <td style={{ padding: "9px" }}>{a.cantidad_ventas || 0}</td>
                                        <td style={{ padding: "9px" }}>{formatearMoneda(a.total_vendido)}</td>
                                        <td style={{ padding: "9px", color: "#198754", fontWeight: "bold" }}>{formatearMoneda(a.total_recaudo)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
            )}

            {/* =====================================================
                LISTADO INDIVIDUAL DE VENTAS DEL DÍA
            ===================================================== */}

            <section className="sales-detail-section" aria-labelledby="ventas-detail-title">
                <div className="sales-detail-heading">
                    <div>
                        <h3 id="ventas-detail-title" className="ventas-detail-title">📋 Detalle de ventas de hoy</h3>
                        {filtroAsesorId !== "todos" && <p>Mostrando ventas del asesor seleccionado.</p>}
                    </div>
                    <span className="sales-detail-count">{ventasDetalleFiltradas.length} resultado{ventasDetalleFiltradas.length === 1 ? "" : "s"}</span>
                </div>

                <div className="sales-record-controls" role="search" aria-label="Buscar y filtrar ventas del día">
                    <label className="sales-search-field" htmlFor="buscar-ventas-dia">
                        <span>Buscar por cliente, asesor o nota</span>
                        <input
                            id="buscar-ventas-dia"
                            type="search"
                            value={busquedaVentas}
                            onChange={(evento) => setBusquedaVentas(evento.target.value)}
                            placeholder="Ej.: cliente o comentario"
                        />
                    </label>
                    <label className="sales-state-field" htmlFor="estado-ventas-dia">
                        <span>Estado</span>
                        <select id="estado-ventas-dia" value={filtroEstadoVenta} onChange={(evento) => setFiltroEstadoVenta(evento.target.value)}>
                            <option value="TODAS">Todas las ventas</option>
                            <option value="ACTIVA">Activas</option>
                            <option value="ANULADA">Anuladas</option>
                        </select>
                    </label>
                    {(busquedaVentas || filtroEstadoVenta !== "TODAS") && (
                        <button
                            type="button"
                            className="sales-clear-filters"
                            onClick={() => { setBusquedaVentas(""); setFiltroEstadoVenta("TODAS"); }}
                        >
                            Limpiar filtros
                        </button>
                    )}
                </div>

                {ventasDiaFiltradas.length === 0 ? (
                    <div className="sales-record-empty">
                        <span aria-hidden="true">🧾</span>
                        <strong>{ventasDia.length === 0 ? "No hay ventas registradas hoy." : "Este asesor no tiene ventas registradas hoy."}</strong>
                        <small>Cuando se registren ventas, podrás consultarlas aquí.</small>
                    </div>
                ) : ventasDetalleFiltradas.length === 0 ? (
                    <div className="sales-record-empty">
                        <span aria-hidden="true">🔎</span>
                        <strong>No encontramos ventas con esos filtros.</strong>
                        <small>Prueba otra búsqueda o muestra todos los estados.</small>
                        <button type="button" onClick={() => { setBusquedaVentas(""); setFiltroEstadoVenta("TODAS"); }}>Mostrar todas</button>
                    </div>
                ) : (
                    <div className="sales-record-grid">
                        {ventasDetalleFiltradas.map((venta) => (
                            <article className={`sale-record-card ${venta.estado === "ANULADA" ? "is-voided" : ""}`} key={venta.id}>
                                <div className="sale-record-card-top">
                                    <div className="sale-record-total">
                                        <span aria-hidden="true">💰</span>
                                        <div><small>Total vendido</small><strong>{formatearMoneda(venta.valor)}</strong></div>
                                    </div>
                                    <span className={`sale-record-status ${venta.estado === "ANULADA" ? "is-voided" : "is-active"}`}>
                                        {venta.estado === "ANULADA" ? "Anulada" : "Activa"}
                                    </span>
                                </div>
                                <div className="sale-record-data">
                                    <div><span>Asesor</span><strong>{venta.asesor_nombre || "—"}</strong></div>
                                    <div><span>Hora</span><strong><time dateTime={venta.fecha_hora || undefined}>{formatearHoraColombia(venta.fecha_hora)}</time></strong></div>
                                    <div><span>Cliente</span><strong>{venta.cliente_id ? `#${venta.cliente_id}` : "Sin cliente"}</strong></div>
                                    <div><span>Recaudo</span><strong>{formatearMoneda(venta.recaudo)}</strong></div>
                                </div>
                                <p className="sale-record-note">{venta.observacion || "Sin observación adicional."}</p>
                                {venta.estado === "ACTIVA" && (
                                    <button
                                        type="button"
                                        className="sale-record-cancel"
                                        onClick={() => anularVenta(venta.id, venta.cliente_id)}
                                        disabled={anulando === venta.id}
                                    >
                                        {anulando === venta.id ? "Anulando…" : "✕ Anular venta"}
                                    </button>
                                )}
                            </article>
                        ))}
                    </div>
                )}
            </section>

            </div>

            )}

        </div>

    );

}
