import { useEffect, useMemo, useState } from "react";
import api from "../services/api";

function hoyColombia() {
    return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Bogota" }).format(new Date());
}

function duracion(ms) {
    const total = Math.max(0, Math.floor(Number(ms || 0) / 1000));
    return `${String(Math.floor(total / 3600)).padStart(2, "0")}:${String(Math.floor((total % 3600) / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

function descargarCSV(nombre, filas) {
    if (!filas.length) return;
    const columnas = Object.keys(filas[0]);
    const contenido = [columnas.join(","), ...filas.map((fila) => columnas.map((columna) => `"${String(fila[columna] ?? "").replaceAll('"', '""')}"`).join(","))].join("\n");
    const enlace = document.createElement("a");
    enlace.href = URL.createObjectURL(new Blob(["\ufeff" + contenido], { type: "text/csv;charset=utf-8" }));
    enlace.download = nombre;
    enlace.click();
    URL.revokeObjectURL(enlace.href);
}

const card = { background: "#fff", border: "1px solid #dcebe2", borderRadius: 12, padding: 16 };
const button = { border: "none", borderRadius: 10, padding: "10px 14px", cursor: "pointer", fontWeight: 800, boxShadow: "0 7px 16px rgba(35,79,53,.14)", transition: "transform .2s ease, box-shadow .2s ease" };
const input = { padding: 8, border: "1px solid #ccd8d0", borderRadius: 7, width: "100%", boxSizing: "border-box" };

export default function AdminPanel() {
    const [desde, setDesde] = useState(hoyColombia());
    const [hasta, setHasta] = useState(hoyColombia());
    const [asesorFiltro, setAsesorFiltro] = useState("");
    const [datos, setDatos] = useState({ asesores: [], asistencia: [], alertas: [], auditoria: [], productividad: {} });
    const [movimientos, setMovimientos] = useState([]);
    const [cargando, setCargando] = useState(false);
    const [error, setError] = useState("");

    async function cargar() {
        if (desde > hasta) return setError("La fecha inicial no puede ser posterior a la fecha final.");
        setCargando(true); setError("");
        try {
            const query = `desde=${desde}&hasta=${hasta}`;
            const resumen = await api.get(`/admin/resumen?${query}`);
            setDatos(resumen.data?.data || {});
            try {
                const movimientosRes = await api.get(`/admin/movimientos?${query}${asesorFiltro ? `&asesor_id=${asesorFiltro}` : ""}`);
                setMovimientos(movimientosRes.data?.data || []);
            } catch (movimientosError) {
                console.warn("La ruta de movimientos administrativos aún no está desplegada:", movimientosError);
                setMovimientos([]);
                setError("El resumen está disponible. Falta desplegar la ruta de movimientos del backend para habilitar correcciones.");
            }
        } catch (e) {
            setError(e.response?.data?.mensaje || "No fue posible cargar el panel administrativo.");
        } finally { setCargando(false); }
    }

    useEffect(() => { cargar(); }, []);

    const asesoresActivos = useMemo(() => (datos.asesores || []).filter((a) => a.activo), [datos.asesores]);
    const alertaAlta = (datos.alertas || []).filter((a) => a.tipo === "JORNADA_ANTERIOR").length;

    async function cambiarEstado(asesor) {
        const activo = !asesor.activo;
        const motivo = window.prompt(`Motivo para ${activo ? "activar" : "desactivar"} a ${asesor.nombre}:`);
        if (!motivo || motivo.trim().length < 5) return alert("Debes indicar un motivo de al menos 5 caracteres.");
        try { await api.patch(`/admin/asesores/${asesor.id}/estado`, { activo, motivo }); await cargar(); }
        catch (e) { alert(e.response?.data?.mensaje || "No fue posible cambiar el estado."); }
    }

    async function corregirMovimiento(movimiento) {
        const tipo = window.prompt("Tipo de movimiento:", movimiento.tipo);
        if (!tipo) return;
        const fechaHora = window.prompt("Fecha y hora (YYYY-MM-DD HH:MM:SS):", movimiento.fecha_hora);
        if (!fechaHora) return;
        const observacion = window.prompt("Observación:", movimiento.observacion || "") ?? "";
        const motivo = window.prompt("Motivo de la corrección (obligatorio):");
        if (!motivo) return;
        try {
            await api.patch(`/admin/movimientos/${movimiento.id}`, { tipo, fecha_hora: fechaHora, observacion, motivo });
            window.dispatchEvent(new Event("datos-actualizados"));
            alert("Movimiento corregido, estado actualizado y auditado."); await cargar();
        } catch (e) { alert(e.response?.data?.mensaje || "No fue posible corregir el movimiento."); }
    }

    async function corregirResumen(resumen) {
        const salida = window.prompt("Hora de salida (YYYY-MM-DD HH:MM:SS; vacío para conservar):", resumen.hora_salida || "");
        if (salida === null) return;
        const trabajado = window.prompt("Tiempo trabajado en milisegundos:", resumen.tiempo_trabajado ?? 0);
        if (trabajado === null) return;
        const motivo = window.prompt("Motivo de la corrección (obligatorio):");
        if (!motivo) return;
        try {
            await api.patch(`/admin/resumenes/${resumen.id}`, { hora_salida: salida || null, tiempo_trabajado: Number(trabajado), motivo });
            alert("Resumen corregido y auditado."); await cargar();
        } catch (e) { alert(e.response?.data?.mensaje || "No fue posible corregir el resumen."); }
    }

    return <section style={{ marginTop: 22, display: "grid", gap: 14 }}>
        <div style={{ ...card, borderTop: "5px solid #6f42c1" }}>
            <h2 style={{ margin: "0 0 6px", color: "#4f2b91" }}>✨ Panel de control administrativo</h2>
            <p style={{ margin: 0, color: "#666" }}>Gestión, alertas, correcciones y auditoría de asesores.</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(170px,1fr))", gap: 10, marginTop: 14 }}>
                <label>Desde<input type="date" value={desde} onChange={(e) => setDesde(e.target.value)} style={input} /></label>
                <label>Hasta<input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} style={input} /></label>
                <label>Asesor<select value={asesorFiltro} onChange={(e) => setAsesorFiltro(e.target.value)} style={input}><option value="">Todos</option>{(datos.asesores || []).map((a) => <option key={a.id} value={a.id}>{a.nombre}</option>)}</select></label>
                <div style={{ display: "flex", gap: 8, alignItems: "end" }}><button onClick={cargar} disabled={cargando} style={{ ...button, background: "#6f42c1", color: "#fff" }}>{cargando ? "Cargando..." : "🔍 Consultar"}</button><button onClick={() => descargarCSV("asistencia.csv", datos.asistencia || [])} style={{ ...button, background: "#198754", color: "#fff" }}>⬇ CSV</button></div>
            </div>
            {error && <p style={{ color: "#b02a37", fontWeight: 700 }}>{error}</p>}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 10 }}>
            {[ ["👥", datos.asesores?.length || 0, "Asesores"], ["✅", asesoresActivos.length, "Activos"], ["🚨", datos.alertas?.length || 0, "Alertas"], ["⚠️", alertaAlta, "Jornadas anteriores"], ["⏱", duracion(datos.productividad?.tiempo_trabajado), "Tiempo trabajado"], ["📈", `${datos.productividad?.porcentaje || 0}%`, "Productividad"] ].map(([icon, value, label]) => <div key={label} style={card}><div style={{ color: "#789184", fontSize: 12, fontWeight: 800 }}>{icon} {label}</div><strong style={{ display: "block", color: "#214f35", fontSize: 22, marginTop: 8 }}>{value}</strong></div>)}
        </div>

        <div style={card}><h3>🚨 Alertas administrativas</h3>{!datos.alertas?.length ? <p>No hay alertas para mostrar.</p> : <div style={{ display: "grid", gap: 8 }}>{datos.alertas.map((a, i) => <div key={`${a.tipo}-${a.asesor_id}-${i}`} style={{ padding: 10, borderRadius: 8, background: a.tipo === "JORNADA_ANTERIOR" ? "#fff0f1" : "#fff8df" }}><strong>{a.tipo === "JORNADA_ANTERIOR" ? "🔴" : "🟡"} {a.nombre}</strong><span> — {a.detalle}</span></div>)}</div>}</div>

        <div style={card}><h3>👥 Activar o desactivar asesores</h3><div style={{ overflowX: "auto" }}><table style={{ width: "100%", borderCollapse: "collapse" }}><thead><tr><th>Asesor</th><th>Estado</th><th>Jornada</th><th>Acción</th></tr></thead><tbody>{(datos.asesores || []).map((a) => <tr key={a.id}><td style={{ padding: 8, borderBottom: "1px solid #eee" }}>{a.nombre}</td><td style={{ padding: 8, borderBottom: "1px solid #eee" }}>{a.activo ? "Activo" : "Inactivo"}</td><td style={{ padding: 8, borderBottom: "1px solid #eee" }}>{a.estado || "DISPONIBLE"}</td><td style={{ padding: 8, borderBottom: "1px solid #eee" }}><button onClick={() => cambiarEstado(a)} style={{ ...button, background: a.activo ? "#dc3545" : "#198754", color: "#fff" }}>{a.activo ? "Desactivar" : "Activar"}</button></td></tr>)}</tbody></table></div></div>

        <div style={card}><h3>📊 Asistencia y productividad</h3><div style={{ overflowX: "auto" }}><table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}><thead><tr>{["Fecha", "Asesor", "Entrada", "Salida", "Trabajado", "Productivo", "Retraso", "Acción"].map((x) => <th key={x} style={{ padding: 8, background: "#0d6efd", color: "#fff", textAlign: "left" }}>{x}</th>)}</tr></thead><tbody>{(datos.asistencia || []).map((a) => <tr key={a.id}>{[a.fecha, a.asesor_nombre, a.hora_entrada || "—", a.hora_salida || "—", duracion(a.tiempo_trabajado), duracion(a.tiempo_productivo), a.llego_tarde ? `${a.minutos_retraso} min` : "No"].map((x, i) => <td key={i} style={{ padding: 8, borderBottom: "1px solid #eee" }}>{x}</td>)}<td style={{ padding: 8 }}><button onClick={() => corregirResumen(a)} style={{ ...button, background: "#ffc107" }}>✏ Corregir</button></td></tr>)}</tbody></table></div></div>

        <div style={card}><h3>📝 Movimientos corregibles</h3><div style={{ overflowX: "auto" }}><table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}><thead><tr><th>Fecha</th><th>Asesor</th><th>Tipo</th><th>Observación</th><th>Acción</th></tr></thead><tbody>{movimientos.map((m) => <tr key={m.id}><td style={{ padding: 8 }}>{m.fecha_hora}</td><td style={{ padding: 8 }}>{m.asesor_nombre}</td><td style={{ padding: 8 }}>{m.tipo}</td><td style={{ padding: 8 }}>{m.observacion || "—"}</td><td style={{ padding: 8 }}><button onClick={() => corregirMovimiento(m)} style={{ ...button, background: "#ffc107" }}>✏ Corregir</button></td></tr>)}</tbody></table></div></div>

        <div style={card}><div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}><div><h3 style={{ margin: 0 }}>🔐 Auditoría administrativa</h3><p style={{ color: "#66756b", margin: "6px 0 0" }}>El historial está disponible en una vista independiente.</p></div><button type="button" onClick={() => { window.location.href = `${window.location.pathname}?vista=auditoria`; }} style={{ ...button, background: "#6f42c1", color: "#fff" }}>Ver historial de auditoría</button></div></div>
    </section>;
}
