import { useEffect, useState } from "react";
import api from "../services/api";

function fechaHoy() { return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Bogota" }).format(new Date()); }
function primerDiaMes() { const hoy = fechaHoy(); return `${hoy.slice(0, 8)}01`; }
function dinero(valor) { return `$ ${Number(valor || 0).toLocaleString("es-CO", { maximumFractionDigits: 2 })}`; }

const input = { width: "100%", boxSizing: "border-box", padding: 8, border: "1px solid #cbd5cf", borderRadius: 7 };
const boton = { padding: "8px 10px", border: 0, borderRadius: 7, fontWeight: 700, cursor: "pointer" };

export default function ValidarVentas() {
    const [filtros, setFiltros] = useState({ desde: primerDiaMes(), hasta: fechaHoy(), asesorId: "", clienteId: "", estado: "TODAS" });
    const [asesores, setAsesores] = useState([]);
    const [ventas, setVentas] = useState([]);
    const [editando, setEditando] = useState(null);
    const [cargando, setCargando] = useState(false);
    const [mensaje, setMensaje] = useState("");

    async function cargarAsesores() {
        try { const { data } = await api.get("/asesores"); setAsesores(Array.isArray(data) ? data : data?.data || []); }
        catch (error) { setMensaje(error.response?.data?.mensaje || "No fue posible cargar los asesores."); }
    }

    async function consultar() {
        setCargando(true); setMensaje("");
        try {
            const params = new URLSearchParams({ fecha_desde: filtros.desde, fecha_hasta: filtros.hasta, estado: filtros.estado });
            if (filtros.asesorId) params.set("asesor_id", filtros.asesorId);
            if (filtros.clienteId.trim()) params.set("cliente_id", filtros.clienteId.trim());
            const { data } = await api.get(`/ventas/admin/validacion?${params.toString()}`);
            setVentas(data?.data || []);
        } catch (error) { setVentas([]); setMensaje(error.response?.data?.mensaje || "No fue posible consultar las ventas."); }
        finally { setCargando(false); }
    }

    useEffect(() => { cargarAsesores(); consultar(); }, []);

    function iniciarEdicion(venta) { setEditando({ ...venta, valor: String(venta.valor ?? ""), recaudo: String(venta.recaudo ?? ""), motivo: "" }); }
    function cambiarEdicion(campo, valor) { setEditando((actual) => ({ ...actual, [campo]: valor })); }

    async function guardarCorreccion() {
        if (!editando) return;
        if (String(editando.motivo || "").trim().length < 5) { setMensaje("La corrección requiere un motivo de al menos 5 caracteres."); return; }
        if (!window.confirm(`¿Confirmas corregir/reasignar la venta #${editando.id} a ${editando.asesor_nombre}?\n\nMotivo: ${editando.motivo}`)) return;
        try {
            await api.patch(`/ventas/admin/${editando.id}/corregir`, { asesor_id: Number(editando.asesor_id), cliente_id: editando.cliente_id || null, valor: Number(editando.valor), recaudo: Number(editando.recaudo), observacion: editando.observacion || null, motivo: editando.motivo.trim() });
            setMensaje(`Venta #${editando.id} actualizada correctamente.`); setEditando(null); await consultar();
        } catch (error) { setMensaje(error.response?.data?.mensaje || "No fue posible corregir la venta."); }
    }

    async function anular(venta) {
        const motivo = window.prompt(`Motivo para anular la venta #${venta.id} de ${venta.asesor_nombre}:`, "Venta registrada al asesor equivocado");
        if (motivo === null || motivo.trim().length < 5) { if (motivo !== null) setMensaje("El motivo debe tener al menos 5 caracteres."); return; }
        if (!window.confirm(`¿Anular la venta #${venta.id}?\n\nLa venta no se borrará físicamente y quedará auditada.`)) return;
        try { await api.patch(`/ventas/admin/${venta.id}/anular`, { motivo: motivo.trim() }); setMensaje(`Venta #${venta.id} anulada y auditada.`); await consultar(); }
        catch (error) { setMensaje(error.response?.data?.mensaje || "No fue posible anular la venta."); }
    }

    return <section style={{ marginTop: 24, background: "#fff", border: "1px solid #dcebe2", borderTop: "4px solid #b8941f", borderRadius: 14, padding: 20, boxShadow: "0 6px 18px rgba(36,90,62,.08)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}><div><h2 style={{ margin: 0, color: "#245b3a" }}>✅ Validar ventas</h2><p style={{ color: "#66756b" }}>Consulta, corrige, reasigna o anula ventas sin borrar el historial.</p></div><strong style={{ color: "#245b3a" }}>{ventas.length} registros</strong></div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 10, alignItems: "end" }}>
            <label>Desde<input type="date" value={filtros.desde} onChange={(e) => setFiltros({ ...filtros, desde: e.target.value })} style={input} /></label>
            <label>Hasta<input type="date" value={filtros.hasta} onChange={(e) => setFiltros({ ...filtros, hasta: e.target.value })} style={input} /></label>
            <label>Asesor<select value={filtros.asesorId} onChange={(e) => setFiltros({ ...filtros, asesorId: e.target.value })} style={input}><option value="">Todos</option>{asesores.map((a) => <option key={a.id} value={a.id}>{a.nombre}</option>)}</select></label>
            <label>ID del cliente<input value={filtros.clienteId} onChange={(e) => setFiltros({ ...filtros, clienteId: e.target.value })} placeholder="Escribe el ID del cliente" style={input} /></label>
            <label>Estado<select value={filtros.estado} onChange={(e) => setFiltros({ ...filtros, estado: e.target.value })} style={input}><option value="TODAS">Todas</option><option value="ACTIVA">Activas</option><option value="ANULADA">Anuladas</option></select></label>
            <button type="button" onClick={consultar} disabled={cargando} style={{ ...boton, background: "#245b3a", color: "#fff" }}>{cargando ? "Consultando..." : "🔍 Consultar"}</button>
        </div>
        {mensaje && <p style={{ color: "#245b3a", fontWeight: 700 }}>{mensaje}</p>}
        <div style={{ overflowX: "auto", marginTop: 16 }}><table style={{ width: "100%", minWidth: 960, borderCollapse: "collapse" }}><thead><tr>{["ID", "Fecha", "Asesor", "Cliente", "Venta", "Recaudo", "Estado", "Acciones"].map((h) => <th key={h} style={{ padding: 9, textAlign: "left", background: "#f7fbf8", color: "#245b3a" }}>{h}</th>)}</tr></thead><tbody>{ventas.length === 0 ? <tr><td colSpan="8" style={{ padding: 18, color: "#66756b" }}>No hay ventas para los filtros seleccionados.</td></tr> : ventas.map((v) => <tr key={v.id} style={{ borderBottom: "1px solid #e5eee8" }}><td style={{ padding: 9 }}>#{v.id}</td><td style={{ padding: 9, whiteSpace: "nowrap" }}>{v.fecha_hora}</td><td style={{ padding: 9, fontWeight: 700 }}>{v.asesor_nombre}</td><td style={{ padding: 9 }}>{v.cliente_id || "—"}</td><td style={{ padding: 9 }}>{dinero(v.valor)}</td><td style={{ padding: 9 }}>{dinero(v.recaudo)}</td><td style={{ padding: 9 }}><span style={{ color: v.estado === "ACTIVA" ? "#198754" : "#9b2c2c", fontWeight: 700 }}>{v.estado}</span></td><td style={{ padding: 9, whiteSpace: "nowrap" }}><button type="button" onClick={() => iniciarEdicion(v)} disabled={v.estado !== "ACTIVA"} style={{ ...boton, background: "#b8941f", color: "#fff", marginRight: 6 }}>Editar / reasignar</button><button type="button" onClick={() => anular(v)} disabled={v.estado !== "ACTIVA"} style={{ ...boton, background: "#9b2c2c", color: "#fff" }}>Anular</button></td></tr>)}</tbody></table></div>
        {editando && <div role="dialog" aria-modal="true" style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.55)", display: "grid", placeItems: "center", padding: 20, zIndex: 10000 }}><div style={{ background: "#fff", width: "100%", maxWidth: 520, borderRadius: 14, padding: 22 }}><h3 style={{ marginTop: 0, color: "#245b3a" }}>Corregir venta #{editando.id}</h3><label>Asesor<select value={editando.asesor_id} onChange={(e) => { const a = asesores.find((x) => Number(x.id) === Number(e.target.value)); setEditando({ ...editando, asesor_id: e.target.value, asesor_nombre: a?.nombre || "" }); }} style={input}>{asesores.map((a) => <option key={a.id} value={a.id}>{a.nombre}</option>)}</select></label><label>Cliente<input value={editando.cliente_id || ""} onChange={(e) => cambiarEdicion("cliente_id", e.target.value)} style={input} /></label><label>Valor de venta<input type="number" min="0.01" value={editando.valor} onChange={(e) => cambiarEdicion("valor", e.target.value)} style={input} /></label><label>Recaudo<input type="number" min="0" value={editando.recaudo} onChange={(e) => cambiarEdicion("recaudo", e.target.value)} style={input} /></label><label>Detalle<input value={editando.observacion || ""} onChange={(e) => cambiarEdicion("observacion", e.target.value)} style={input} /></label><label>Motivo obligatorio<textarea value={editando.motivo} onChange={(e) => cambiarEdicion("motivo", e.target.value)} style={{ ...input, minHeight: 70 }} placeholder="Ej.: Venta registrada por error a Winifer; corresponde a Glorimar." /></label><div style={{ display: "flex", gap: 8, marginTop: 14 }}><button type="button" onClick={guardarCorreccion} style={{ ...boton, background: "#245b3a", color: "#fff" }}>Guardar corrección</button><button type="button" onClick={() => setEditando(null)} style={{ ...boton, background: "#e9ecef", color: "#333" }}>Cancelar</button></div></div></div>}
    </section>;
}
