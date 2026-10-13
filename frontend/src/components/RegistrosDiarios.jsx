import { useEffect, useMemo, useState } from "react";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import api from "../services/api";

function fechaColombia() {
    return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Bogota" }).format(new Date());
}

function normalizarFilas(data) {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.data)) return data.data;
    return [];
}

function filaExportacion(item) {
    return {
        Fecha: item.fecha,
        Asesora: item.asesor_nombre || "—",
        "Datos adquiridos": item.datos_cantidad,
        "IDs de datos adquiridos": item.datos_ids || "",
        "Análisis realizados": item.analisis_cantidad,
        "IDs de análisis o auditorías": item.analisis_ids || "",
        "Última actualización": item.updated_at || ""
    };
}

export default function RegistrosDiarios({ asesores = [], asesorActual = null, esAdministrador = false }) {
    const hoy = fechaColombia();
    const asesorInicial = esAdministrador ? "" : String(asesorActual?.id || "");
    const [fecha, setFecha] = useState(hoy);
    const [fechaDesde, setFechaDesde] = useState(hoy);
    const [fechaHasta, setFechaHasta] = useState(hoy);
    const [asesorId, setAsesorId] = useState(asesorInicial);
    const [datosCantidad, setDatosCantidad] = useState("0");
    const [datosIds, setDatosIds] = useState("");
    const [analisisCantidad, setAnalisisCantidad] = useState("0");
    const [analisisIds, setAnalisisIds] = useState("");
    const [filas, setFilas] = useState([]);
    const [cargando, setCargando] = useState(false);
    const [guardando, setGuardando] = useState(false);

    useEffect(() => {
        if (!esAdministrador && asesorActual?.id) setAsesorId(String(asesorActual.id));
    }, [esAdministrador, asesorActual?.id]);

    const asesorSeleccionado = useMemo(
        () => asesores.find((item) => String(item.id) === String(asesorId)),
        [asesores, asesorId]
    );

    function cargarFilaEnFormulario(item) {
        setFecha(item.fecha);
        setAsesorId(String(item.asesor_id));
        setDatosCantidad(String(item.datos_cantidad ?? 0));
        setDatosIds(item.datos_ids || "");
        setAnalisisCantidad(String(item.analisis_cantidad ?? 0));
        setAnalisisIds(item.analisis_ids || "");
        window.scrollTo({ top: 0, behavior: "smooth" });
    }

    async function consultar() {
        if (!fechaDesde || !fechaHasta) return alert("Seleccione las dos fechas del filtro.");
        if (fechaDesde > fechaHasta) return alert("La fecha inicial no puede ser posterior a la fecha final.");
        setCargando(true);
        try {
            const params = new URLSearchParams({ fecha_desde: fechaDesde, fecha_hasta: fechaHasta });
            if (esAdministrador && asesorId) params.set("asesor_id", asesorId);
            const { data } = await api.get(`/registros-diarios?${params.toString()}`);
            setFilas(normalizarFilas(data));
        } catch (error) {
            alert(error.response?.data?.mensaje || "No fue posible consultar los registros diarios.");
        } finally {
            setCargando(false);
        }
    }

    async function guardar(event) {
        event.preventDefault();
        if (!fecha) return alert("Seleccione la fecha del registro.");
        if (esAdministrador && !asesorId) return alert("Seleccione la asesora.");
        setGuardando(true);
        try {
            await api.put("/registros-diarios", {
                asesor_id: esAdministrador ? Number(asesorId) : undefined,
                fecha,
                datos_cantidad: Number(datosCantidad || 0),
                datos_ids: datosIds,
                analisis_cantidad: Number(analisisCantidad || 0),
                analisis_ids: analisisIds
            });
            alert("Registro diario guardado correctamente.");
            setFechaDesde(fecha);
            setFechaHasta(fecha);
            await consultar();
        } catch (error) {
            alert(error.response?.data?.mensaje || "No fue posible guardar el registro diario.");
        } finally {
            setGuardando(false);
        }
    }

    function descargarExcel() {
        if (!filas.length) return alert("Primero consulte un rango con registros.");
        const hoja = XLSX.utils.json_to_sheet(filas.map(filaExportacion));
        const libro = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(libro, hoja, "Registros diarios");
        const contenido = XLSX.write(libro, { bookType: "xlsx", type: "array" });
        saveAs(new Blob([contenido]), `Registros_diarios_${fechaDesde}_${fechaHasta}.xlsx`);
    }

    async function descargarWord() {
        if (!filas.length) return alert("Primero consulte un rango con registros.");
        try {
            const { Document, Packer, Paragraph, Table, TableRow, TableCell, HeadingLevel, WidthType } = await import("docx");
            const celda = (texto, encabezado = false) => new TableCell({ children: [new Paragraph({ children: [{ text: String(texto ?? ""), bold: encabezado }] })] });
            const encabezados = ["Fecha", "Asesora", "Datos", "IDs de datos", "Análisis", "IDs de análisis"];
            const tabla = new Table({
                width: { size: 100, type: WidthType.PERCENTAGE },
                rows: [
                    new TableRow({ children: encabezados.map((x) => celda(x, true)) }),
                    ...filas.map((item) => new TableRow({ children: [
                        celda(item.fecha), celda(item.asesor_nombre), celda(item.datos_cantidad),
                        celda(item.datos_ids), celda(item.analisis_cantidad), celda(item.analisis_ids)
                    ] }))
                ]
            });
            const documento = new Document({ sections: [{ children: [
                new Paragraph({ heading: HeadingLevel.TITLE, text: "Registro diario de datos y análisis" }),
                new Paragraph({ text: `Periodo: ${fechaDesde} al ${fechaHasta}` }),
                new Paragraph({ text: "" }),
                tabla
            ] }] });
            saveAs(await Packer.toBlob(documento), `Registros_diarios_${fechaDesde}_${fechaHasta}.docx`);
        } catch (error) {
            alert(`No fue posible generar Word: ${error.message}`);
        }
    }

    const input = { width: "100%", padding: "10px", border: "1px solid #cbd5df", borderRadius: 8, boxSizing: "border-box" };
    const card = { background: "#fff", border: "1px solid #dce6ed", borderRadius: 14, padding: 18, boxShadow: "0 8px 20px rgba(14,55,94,.06)" };

    return <section style={{ maxWidth: 1400, margin: "0 auto", padding: "4px 0 30px", color: "#1f2937" }}>
        <div style={{ ...card, borderTop: "5px solid #0a8fbd", marginBottom: 16 }}>
            <h2 style={{ margin: "0 0 5px", color: "#0a4f87" }}>📋 Registro diario de datos y análisis</h2>
            <p style={{ margin: 0, color: "#667887" }}>Registre únicamente cantidades e IDs de datos adquiridos y análisis o auditorías de reportes de crédito realizados.</p>
        </div>

        <form onSubmit={guardar} style={{ ...card, display: "grid", gap: 15, marginBottom: 16 }}>
            <h3 style={{ margin: 0, color: "#0a4f87" }}>✍️ Cargar registro del día</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: 12 }}>
                <label>Fecha<input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} style={input} required /></label>
                {esAdministrador ? <label>Asesora<select value={asesorId} onChange={(e) => setAsesorId(e.target.value)} style={input} required><option value="">Seleccione una asesora</option>{asesores.map((a) => <option key={a.id} value={a.id}>{a.nombre}</option>)}</select></label> : <label>Asesora<input value={asesorActual?.nombre || "Asesora vinculada"} style={{ ...input, background: "#f3f7fa" }} readOnly /></label>}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 15 }}>
                <div style={{ padding: 14, borderRadius: 10, background: "#eef9fc", border: "1px solid #b8e5f0" }}>
                    <h4 style={{ margin: "0 0 10px", color: "#087b9f" }}>📥 Datos adquiridos del día</h4>
                    <label>Cantidad<input type="number" min="0" value={datosCantidad} onChange={(e) => setDatosCantidad(e.target.value)} style={input} /></label>
                    <label style={{ display: "block", marginTop: 10 }}>IDs de datos adquiridos<textarea value={datosIds} onChange={(e) => setDatosIds(e.target.value)} placeholder="Un ID por línea o separados por coma" rows="4" style={{ ...input, resize: "vertical" }} /></label>
                </div>
                <div style={{ padding: 14, borderRadius: 10, background: "#fff8e8", border: "1px solid #f0d78e" }}>
                    <h4 style={{ margin: "0 0 10px", color: "#956f00" }}>🔎 Análisis realizados del día</h4>
                    <label>Cantidad<input type="number" min="0" value={analisisCantidad} onChange={(e) => setAnalisisCantidad(e.target.value)} style={input} /></label>
                    <label style={{ display: "block", marginTop: 10 }}>IDs de análisis o auditorías<textarea value={analisisIds} onChange={(e) => setAnalisisIds(e.target.value)} placeholder="Un ID por línea o separados por coma" rows="4" style={{ ...input, resize: "vertical" }} /></label>
                </div>
            </div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}><button type="submit" disabled={guardando} style={{ padding: "11px 17px", border: 0, borderRadius: 8, background: "#0a4f87", color: "#fff", fontWeight: 800, cursor: "pointer" }}>{guardando ? "Guardando..." : "💾 Guardar registro diario"}</button>{asesorSeleccionado && <span style={{ alignSelf: "center", color: "#657785" }}>Registro de {asesorSeleccionado.nombre}</span>}</div>
        </form>

        <div style={{ ...card, marginBottom: 16 }}>
            <h3 style={{ margin: "0 0 12px", color: "#0a4f87" }}>🗓 Consultar registros anteriores</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10, alignItems: "end" }}>
                <label>Desde<input type="date" value={fechaDesde} onChange={(e) => setFechaDesde(e.target.value)} style={input} /></label>
                <label>Hasta<input type="date" value={fechaHasta} onChange={(e) => setFechaHasta(e.target.value)} style={input} /></label>
                {esAdministrador && <label>Asesora<select value={asesorId} onChange={(e) => setAsesorId(e.target.value)} style={input}><option value="">Todas</option>{asesores.map((a) => <option key={a.id} value={a.id}>{a.nombre}</option>)}</select></label>}
                <button type="button" onClick={consultar} disabled={cargando} style={{ padding: 11, border: 0, borderRadius: 8, background: "#0a8fbd", color: "#fff", fontWeight: 800, cursor: "pointer" }}>{cargando ? "Consultando..." : "🔍 Consultar"}</button>
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}><button type="button" onClick={descargarWord} style={{ padding: "9px 13px", border: 0, borderRadius: 8, background: "#245b3a", color: "#fff", fontWeight: 800, cursor: "pointer" }}>📄 Descargar Word</button><button type="button" onClick={descargarExcel} style={{ padding: "9px 13px", border: 0, borderRadius: 8, background: "#198754", color: "#fff", fontWeight: 800, cursor: "pointer" }}>📊 Descargar Excel</button></div>
        </div>

        <div style={{ ...card, overflowX: "auto" }}>
            <h3 style={{ margin: "0 0 12px", color: "#0a4f87" }}>{filas.length} registro(s) encontrado(s)</h3>
            <table style={{ width: "100%", minWidth: 900, borderCollapse: "collapse", fontSize: 13 }}><thead><tr>{["Fecha", "Asesora", "Datos", "IDs de datos adquiridos", "Análisis", "IDs de análisis", "Acción"].map((x) => <th key={x} style={{ textAlign: "left", padding: 10, background: "#eaf5fb", color: "#0a4f87" }}>{x}</th>)}</tr></thead><tbody>{filas.map((item) => <tr key={item.id}><td style={{ padding: 10, borderBottom: "1px solid #e8eef2", whiteSpace: "nowrap" }}>{item.fecha}</td><td style={{ padding: 10, borderBottom: "1px solid #e8eef2", fontWeight: 700 }}>{item.asesor_nombre}</td><td style={{ padding: 10, borderBottom: "1px solid #e8eef2", textAlign: "center" }}>{item.datos_cantidad}</td><td style={{ padding: 10, borderBottom: "1px solid #e8eef2", whiteSpace: "pre-wrap", maxWidth: 240 }}>{item.datos_ids || "—"}</td><td style={{ padding: 10, borderBottom: "1px solid #e8eef2", textAlign: "center" }}>{item.analisis_cantidad}</td><td style={{ padding: 10, borderBottom: "1px solid #e8eef2", whiteSpace: "pre-wrap", maxWidth: 240 }}>{item.analisis_ids || "—"}</td><td style={{ padding: 10, borderBottom: "1px solid #e8eef2" }}><button type="button" onClick={() => cargarFilaEnFormulario(item)} style={{ padding: "7px 10px", border: 0, borderRadius: 6, background: "#ffc107", color: "#222", fontWeight: 700, cursor: "pointer" }}>✏ Editar</button></td></tr>)}</tbody></table>
        </div>
    </section>;
}
