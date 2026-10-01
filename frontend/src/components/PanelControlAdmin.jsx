import { useEffect, useMemo, useState } from "react";
import api from "../services/api";

function hoyISO() { return new Date().toISOString().slice(0, 10); }
function inicioMes() { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`; }
function finMes() { const d = new Date(); return new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().slice(0, 10); }
function moneda(valor, simbolo = "$", codigo = "USD") { return `${simbolo}${Number(valor || 0).toLocaleString("es-CO", { maximumFractionDigits: 0 })} ${codigo}`; }
function duracion(milisegundos) { const total = Math.max(0, Math.floor(Number(milisegundos || 0) / 1000)); const h = Math.floor(total / 3600); const m = Math.floor((total % 3600) / 60); return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`; }

const tarjeta = { background: "#fff", border: "1px solid #dcebe2", borderRadius: 14, padding: 16, boxShadow: "0 6px 18px rgba(36,90,62,.08)" };
const input = { width: "100%", boxSizing: "border-box", padding: 9, border: "1px solid #cbd5cf", borderRadius: 7 };

export default function PanelControlAdmin() {
    const [ejecutivo, setEjecutivo] = useState(null);
    const [asesores, setAsesores] = useState([]);
    const [metas, setMetas] = useState([]);
    const [periodo, setPeriodo] = useState({ inicio: inicioMes(), fin: finMes(), tipo: "MES" });
    const [config, setConfig] = useState({ simbolo_moneda: "$", moneda: "USD" });
    const [cargando, setCargando] = useState(true);
    const [mensaje, setMensaje] = useState("");

    async function cargar() {
        setCargando(true);
        try {
            const [ej, as, ms, cv] = await Promise.all([
                api.get("/dashboard/ejecutivo"), api.get("/asesores"),
                api.get(`/metas?periodo_inicio=${periodo.inicio}&periodo_fin=${periodo.fin}`),
                api.get("/configuracion-ventas")
            ]);
            setEjecutivo(ej.data?.data || null);
            setAsesores(Array.isArray(as.data) ? as.data : as.data?.data || []);
            setMetas(Array.isArray(ms.data?.data) ? ms.data.data : []);
            setConfig(cv.data?.data || config);
        } catch (error) { setMensaje(error.response?.data?.mensaje || "No fue posible cargar el panel ejecutivo."); }
        finally { setCargando(false); }
    }

    useEffect(() => { cargar(); const id = setInterval(cargar, 15000); return () => clearInterval(id); }, [periodo.inicio, periodo.fin]);

    const filas = useMemo(() => asesores.map((asesor) => {
        const existente = metas.find((m) => Number(m.asesor_id) === Number(asesor.id));
        return existente || { asesor_id: asesor.id, asesor_nombre: asesor.nombre, periodo_tipo: periodo.tipo, periodo_inicio: periodo.inicio, periodo_fin: periodo.fin, meta_ventas: 0, meta_recaudo: 0, ventas_actuales: 0, recaudo_actual: 0 };
    }), [asesores, metas, periodo]);

    function cambiarMeta(asesorId, campo, valor) { setMetas((actual) => { const encontrada = actual.find((m) => Number(m.asesor_id) === Number(asesorId)); const base = encontrada || filas.find((m) => Number(m.asesor_id) === Number(asesorId)); const nueva = { ...base, [campo]: valor }; return encontrada ? actual.map((m) => Number(m.asesor_id) === Number(asesorId) ? nueva : m) : [...actual, nueva]; }); }

    async function guardarMeta(fila) {
        try {
            await api.put("/metas", { asesor_id: fila.asesor_id, periodo_tipo: periodo.tipo, periodo_inicio: periodo.inicio, periodo_fin: periodo.fin, meta_ventas: Number(fila.meta_ventas || 0), meta_recaudo: Number(fila.meta_recaudo || 0) });
            setMensaje(`Meta guardada para ${fila.asesor_nombre || "el asesor"}.`); await cargar();
        } catch (error) { setMensaje(error.response?.data?.mensaje || "No fue posible guardar la meta."); }
    }

    if (cargando && !ejecutivo) return <section style={{ ...tarjeta, marginTop: 24 }}><strong>⏳ Cargando Centro de Control...</strong></section>;
    const e = ejecutivo || { asesores: {}, productividad: {}, ventas: {}, incidencias_pendientes: 0 };
    return <section style={{ marginTop: 24, display: "grid", gap: 16 }}>
        <div style={{ ...tarjeta, borderTop: "4px solid #b8941f" }}>
            <h2 style={{ margin: 0, color: "#245b3a" }}>🎯 Centro de Control Ejecutivo</h2>
            <p style={{ color: "#66756b", marginBottom: 0 }}>Indicadores operativos y comerciales del día. Actualización automática cada 15 segundos.</p>
            {mensaje && <p style={{ color: "#245b3a", fontWeight: "bold" }}>{mensaje}</p>}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 10, marginTop: 14 }}>
                {[["👥", "Asesores", e.asesores.total], ["🟢", "Trabajando", e.asesores.trabajando], ["☕", "En pausa", e.asesores.en_pausa], ["🚨", "Llegadas tarde", e.asesores.llegadas_tarde], ["💰", "Ventas", e.ventas.cantidad], ["💵", "Vendido", moneda(e.ventas.total_vendido, config.simbolo_moneda, config.moneda)], ["📥", "Recaudo", moneda(e.ventas.total_recaudo, config.simbolo_moneda, config.moneda)], ["📌", "Incidencias", e.incidencias_pendientes]].map(([icon, label, value]) => <div key={label} style={{ background: "#f7fbf8", borderRadius: 10, padding: 12 }}><div style={{ color: "#789184", fontSize: 11, fontWeight: 800 }}>{icon} {label}</div><strong style={{ color: "#245b3a", fontSize: 20 }}>{value}</strong></div>)}
            </div>
            <div style={{ marginTop: 12, color: "#4b5563" }}>Productividad: <strong>{e.productividad.porcentaje || 0}%</strong> · Trabajado: <strong>{duracion(e.productividad.tiempo_trabajado)}</strong> · Productivo: <strong>{duracion(e.productividad.tiempo_productivo)}</strong></div>
        </div>

        <div style={tarjeta}>
            <h3 style={{ marginTop: 0, color: "#245b3a" }}>🏆 Metas por asesor</h3>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 14 }}>
                <label style={{ flex: "1 1 160px" }}>Desde<input type="date" value={periodo.inicio} onChange={(ev) => setPeriodo((p) => ({ ...p, inicio: ev.target.value }))} style={input} /></label>
                <label style={{ flex: "1 1 160px" }}>Hasta<input type="date" value={periodo.fin} onChange={(ev) => setPeriodo((p) => ({ ...p, fin: ev.target.value }))} style={input} /></label>
                <label style={{ flex: "1 1 150px" }}>Tipo<select value={periodo.tipo} onChange={(ev) => setPeriodo((p) => ({ ...p, tipo: ev.target.value }))} style={input}><option value="MES">Mes</option><option value="QUINCENA">Quincena</option></select></label>
                <button type="button" onClick={cargar} style={{ alignSelf: "end", padding: "10px 14px", background: "#245b3a", color: "#fff", border: 0, borderRadius: 7, fontWeight: "bold" }}>Actualizar</button>
            </div>
            <div style={{ overflowX: "auto" }}><table style={{ width: "100%", minWidth: 820, borderCollapse: "collapse" }}><thead><tr>{["Asesor", "Meta ventas", "Ventas", "% ventas", "Meta recaudo", "Recaudo", "% recaudo", "Acción"].map((h) => <th key={h} style={{ textAlign: "left", padding: 8, background: "#f7fbf8", color: "#245b3a" }}>{h}</th>)}</tr></thead><tbody>{filas.map((fila) => { const pv = Number(fila.meta_ventas) > 0 ? Math.min(100, Math.round(Number(fila.ventas_actuales || 0) / Number(fila.meta_ventas) * 100)) : 0; const pr = Number(fila.meta_recaudo) > 0 ? Math.min(100, Math.round(Number(fila.recaudo_actual || 0) / Number(fila.meta_recaudo) * 100)) : 0; return <tr key={fila.asesor_id} style={{ borderBottom: "1px solid #e5eee8" }}><td style={{ padding: 8, fontWeight: "bold" }}>{fila.asesor_nombre || "Asesor"}</td><td style={{ padding: 8 }}><input type="number" min="0" value={fila.meta_ventas || 0} onChange={(ev) => cambiarMeta(fila.asesor_id, "meta_ventas", ev.target.value)} style={{ ...input, width: 100 }} /></td><td style={{ padding: 8 }}>{fila.ventas_actuales || 0}</td><td style={{ padding: 8, color: pv >= 100 ? "#198754" : "#b7791f", fontWeight: "bold" }}>{pv}%</td><td style={{ padding: 8 }}><input type="number" min="0" value={fila.meta_recaudo || 0} onChange={(ev) => cambiarMeta(fila.asesor_id, "meta_recaudo", ev.target.value)} style={{ ...input, width: 120 }} /></td><td style={{ padding: 8 }}>{moneda(fila.recaudo_actual, config.simbolo_moneda, config.moneda)}</td><td style={{ padding: 8, color: pr >= 100 ? "#198754" : "#b7791f", fontWeight: "bold" }}>{pr}%</td><td style={{ padding: 8 }}><button type="button" onClick={() => guardarMeta(fila)} style={{ padding: "8px 10px", background: "#b8941f", color: "#fff", border: 0, borderRadius: 6, fontWeight: "bold" }}>Guardar</button></td></tr>; })}</tbody></table></div>
        </div>
    </section>;
}
