import { useEffect, useMemo, useState } from "react";
import api from "../services/api";

const card = { background: "#fff", border: "1px solid #dcebe2", borderRadius: 12, padding: 18 };
const button = { border: 0, borderRadius: 9, padding: "10px 14px", cursor: "pointer", fontWeight: 800 };
const input = { padding: 9, border: "1px solid #ccd8d0", borderRadius: 7, width: "100%", boxSizing: "border-box" };

function exportarCSV(filas) {
    if (!filas.length) return;
    const columnas = ["created_at", "usuario", "accion", "entidad", "entidad_id", "motivo"];
    const contenido = [columnas.join(","), ...filas.map((fila) => columnas.map((columna) => `"${String(fila[columna] ?? "").replaceAll('"', '""')}"`).join(","))].join("\n");
    const enlace = document.createElement("a");
    enlace.href = URL.createObjectURL(new Blob(["\ufeff" + contenido], { type: "text/csv;charset=utf-8" }));
    enlace.download = "auditoria-administrativa.csv";
    enlace.click();
    URL.revokeObjectURL(enlace.href);
}

export default function AuditoriaAdministrativa() {
    const [filas, setFilas] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState("");
    const [busqueda, setBusqueda] = useState("");
    const [accion, setAccion] = useState("");

    async function cargar() {
        setCargando(true);
        setError("");
        try {
            const respuesta = await api.get("/admin/auditoria?limite=500");
            setFilas(Array.isArray(respuesta.data?.data) ? respuesta.data.data : []);
        } catch (e) {
            setError(e.response?.data?.mensaje || "No fue posible cargar la auditoría.");
        } finally {
            setCargando(false);
        }
    }

    useEffect(() => { cargar(); }, []);

    const acciones = useMemo(() => [...new Set(filas.map((fila) => fila.accion).filter(Boolean))].sort(), [filas]);
    const filtradas = useMemo(() => {
        const texto = busqueda.trim().toLowerCase();
        return filas.filter((fila) => {
            const coincideAccion = !accion || fila.accion === accion;
            const contenido = [fila.usuario, fila.accion, fila.entidad, fila.entidad_id, fila.motivo].join(" ").toLowerCase();
            return coincideAccion && (!texto || contenido.includes(texto));
        });
    }, [filas, busqueda, accion]);

    return (
        <section style={{ maxWidth: 1180, margin: "0 auto", padding: "20px 0 30px" }}>
            <div style={{ ...card, borderTop: "5px solid #6f42c1", marginBottom: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start", flexWrap: "wrap" }}>
                    <div>
                        <h2 style={{ margin: 0, color: "#4f2b91" }}>🔐 Auditoría administrativa</h2>
                        <p style={{ margin: "6px 0 0", color: "#66756b" }}>Registro protegido de correcciones, cambios y operaciones administrativas.</p>
                    </div>
                    <button type="button" onClick={() => window.close()} style={{ ...button, background: "#e9ecef", color: "#333" }}>← Cerrar pestaña</button>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 10, marginTop: 16 }}>
                    <label>Buscar<input value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Usuario, motivo o entidad" style={input} /></label>
                    <label>Acción<select value={accion} onChange={(e) => setAccion(e.target.value)} style={input}><option value="">Todas</option>{acciones.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
                    <div style={{ display: "flex", gap: 8, alignItems: "end", flexWrap: "wrap" }}><button type="button" onClick={cargar} disabled={cargando} style={{ ...button, background: "#6f42c1", color: "#fff" }}>{cargando ? "Cargando..." : "🔄 Actualizar"}</button><button type="button" onClick={() => exportarCSV(filtradas)} style={{ ...button, background: "#198754", color: "#fff" }}>⬇ CSV</button></div>
                </div>
                {error && <p style={{ color: "#b02a37", fontWeight: 700 }}>{error}</p>}
            </div>
            <div style={{ ...card, overflowX: "auto" }}>
                <strong style={{ color: "#214f35" }}>{filtradas.length} registros visibles</strong>
                {cargando ? <p>Cargando auditoría...</p> : !filtradas.length ? <p>No hay registros que coincidan con los filtros.</p> : <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, marginTop: 10 }}><thead><tr>{["Fecha", "Usuario", "Acción", "Entidad", "ID", "Motivo"].map((titulo) => <th key={titulo} style={{ textAlign: "left", padding: 9, background: "#f3eeff", color: "#4f2b91" }}>{titulo}</th>)}</tr></thead><tbody>{filtradas.map((fila) => <tr key={fila.id}><td style={{ padding: 9, borderBottom: "1px solid #eee", whiteSpace: "nowrap" }}>{fila.created_at}</td><td style={{ padding: 9, borderBottom: "1px solid #eee" }}>{fila.usuario || "—"}</td><td style={{ padding: 9, borderBottom: "1px solid #eee", fontWeight: 700 }}>{fila.accion}</td><td style={{ padding: 9, borderBottom: "1px solid #eee" }}>{fila.entidad}</td><td style={{ padding: 9, borderBottom: "1px solid #eee" }}>{fila.entidad_id || "—"}</td><td style={{ padding: 9, borderBottom: "1px solid #eee", minWidth: 260 }}>{fila.motivo || "—"}</td></tr>)}</tbody></table>}
            </div>
        </section>
    );
}
