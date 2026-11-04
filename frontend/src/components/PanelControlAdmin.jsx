import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import { FelicitacionToast } from "./ReconocimientoToast";
import ProgresoMetaAsesor from "./ProgresoMetaAsesor";
import InsigniasAsesor from "./InsigniasAsesor";

function hoyColombia() {
    const partes = new Intl.DateTimeFormat("en-CA", {
        timeZone: "America/Bogota", year: "numeric", month: "2-digit", day: "2-digit"
    }).formatToParts(new Date()).reduce((resultado, parte) => ({ ...resultado, [parte.type]: parte.value }), {});
    return { year: Number(partes.year), month: Number(partes.month) - 1, dia: Number(partes.day) };
}
function periodoQuincenaActual() {
    const hoy = hoyColombia();
    const { year, month, dia } = hoy;
    const ultimoDia = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
    const inicio = dia <= 15 ? 1 : 16;
    const fin = dia <= 15 ? 15 : ultimoDia;
    return {
        inicio: `${year}-${String(month + 1).padStart(2, "0")}-${String(inicio).padStart(2, "0")}`,
        fin: `${year}-${String(month + 1).padStart(2, "0")}-${String(fin).padStart(2, "0")}`,
        tipo: "QUINCENA"
    };
}

function moneda(valor, simbolo = "$", codigo = "USD") {
    return `${simbolo}${Number(valor || 0).toLocaleString("es-CO", { maximumFractionDigits: 0 })} ${codigo}`;
}

function duracion(milisegundos) {
    const total = Math.max(0, Math.floor(Number(milisegundos || 0) / 1000));
    const horas = Math.floor(total / 3600);
    const minutos = Math.floor((total % 3600) / 60);
    return `${String(horas).padStart(2, "0")}:${String(minutos).padStart(2, "0")}`;
}

function porcentaje(parte, total) {
    const meta = Number(total || 0);
    if (meta <= 0) return 0;
    return Math.min(100, Math.max(0, Math.round(Number(parte || 0) / meta * 100)));
}
function porcentajeReal(parte, total) {
    const meta = Number(total || 0);
    return meta > 0 ? Math.max(0, Math.round(Number(parte || 0) / meta * 100)) : 0;
}
function diasRestantes(periodo) {
    const limite = new Date(`${periodo.fin}T23:59:59-05:00`).getTime();
    return Math.max(0, Math.ceil((limite - Date.now()) / 86400000));
}
function progresoColor(valor) {
    return valor >= 100 ? "#198754" : valor >= 70 ? "#d39e00" : "#c94c4c";
}

function fechaLocal(valor) {
    if (!valor) return "";
    const fecha = new Date(valor);
    if (Number.isNaN(fecha.getTime())) return String(valor).slice(0, 10);
    return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Bogota", year: "numeric", month: "2-digit", day: "2-digit" }).format(fecha);
}

function asesorIdDeSesion(usuario) {
    if (usuario?.asesor_id) return Number(usuario.asesor_id);
    try {
        const token = localStorage.getItem("token");
        const payload = token ? JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/"))) : null;
        return payload?.asesor_id ? Number(payload.asesor_id) : null;
    } catch {
        return null;
    }
}

const tarjeta = {
    background: "#fff",
    border: "1px solid #dcebe2",
    borderRadius: 14,
    padding: 16,
    boxShadow: "0 6px 18px rgba(36,90,62,.08)"
};

const input = {
    width: "100%",
    boxSizing: "border-box",
    padding: 9,
    border: "1px solid #cbd5cf",
    borderRadius: 7
};

export default function PanelControlAdmin() {
    const { usuario } = useAuth();
    const esAdministrador = usuario?.rol === "ADMINISTRADOR";
    const asesorId = asesorIdDeSesion(usuario);
    const [ejecutivo, setEjecutivo] = useState(null);
    const [asesores, setAsesores] = useState([]);
    const [metas, setMetas] = useState([]);
    const [historialMetas, setHistorialMetas] = useState([]);
    const [ventasPersonales, setVentasPersonales] = useState([]);
    const [periodo] = useState(periodoQuincenaActual());
    const [config, setConfig] = useState({ simbolo_moneda: "$", moneda: "USD" });
    const [cargando, setCargando] = useState(true);
    const [mensaje, setMensaje] = useState("");
    const [mensajeMeta, setMensajeMeta] = useState("");
    const [metaBorradores, setMetaBorradores] = useState({});
    const [metaGuardandoId, setMetaGuardandoId] = useState(null);
    const [historialVisible, setHistorialVisible] = useState(false);
    const [felicitacion, setFelicitacion] = useState({ visible: false, nombre: "asesora", mensaje: "Tus resultados inspiran al equipo." });
    const felicitacionesMostradas = useRef(new Set());
    const metasSucias = useRef(new Set());
    const cargandoRef = useRef(false);

    const cargar = useCallback(async () => {
        if (cargandoRef.current) return;
        cargandoRef.current = true;
        setCargando(true);
        try {
            const peticiones = [
                api.get(`/metas?periodo_inicio=${periodo.inicio}&periodo_fin=${periodo.fin}`),
                api.get("/configuracion-ventas")
            ];

            if (esAdministrador) {
                peticiones.unshift(api.get("/dashboard/ejecutivo"), api.get("/asesores"));
                peticiones.push(api.get(`/metas/historial?periodo_inicio=${periodo.inicio}&periodo_fin=${periodo.fin}`));
            } else {
                peticiones.unshift(
                    api.get("/dashboard"),
                    api.get(`/ventas/asesor/${asesorId}`),
                    api.get(`/incidencias/asesor/${asesorId}`)
                );
            }

            const respuestas = await Promise.allSettled(peticiones);
            const obtener = (indice) => respuestas[indice]?.status === "fulfilled" ? respuestas[indice].value : null;
            const errores = [];
            const metasRespuesta = obtener(esAdministrador ? 2 : 3);
            const configRespuesta = obtener(esAdministrador ? 3 : 4);
            if (metasRespuesta) {
                const listaMetas = Array.isArray(metasRespuesta.data?.data) ? metasRespuesta.data.data : [];
                setMetas(listaMetas);
                setMetaBorradores((actuales) => {
                    const nuevos = { ...actuales };
                    for (const fila of listaMetas) {
                        const clave = String(fila.asesor_id);
                        if (!metasSucias.current.has(clave)) {
                            nuevos[clave] = {
                                meta_ventas: String(fila.meta_ventas ?? 0),
                                meta_recaudo: String(fila.meta_recaudo ?? 0)
                            };
                        }
                    }
                    return nuevos;
                });
            } else {
                errores.push("metas");
            }
            if (configRespuesta) setConfig((actual) => ({ ...actual, ...(configRespuesta.data?.data || {}) }));
            else errores.push("configuración");

            if (esAdministrador) {
                const respuestaEjecutivo = obtener(0);
                const respuestaAsesores = obtener(1);
                const respuestaHistorial = obtener(4);
                if (respuestaEjecutivo) setEjecutivo(respuestaEjecutivo.data?.data || null);
                else errores.push("indicadores ejecutivos");
                if (respuestaAsesores) {
                    const lista = respuestaAsesores.data;
                    setAsesores(Array.isArray(lista) ? lista : lista?.data || []);
                } else errores.push("asesores");
                if (respuestaHistorial) setHistorialMetas(Array.isArray(respuestaHistorial.data?.data) ? respuestaHistorial.data.data : []);
                else errores.push("historial");
            } else {
                const respuestaDashboard = obtener(0);
                const respuestaVentas = obtener(1);
                const respuestaIncidencias = obtener(2);
                if (respuestaDashboard) {
                    const dashboard = respuestaDashboard.data || {};
                    const filasDashboard = Array.isArray(dashboard.asesores) ? dashboard.asesores : [];
                    const asesor = filasDashboard[0] || {};
                    setEjecutivo({
                        asesores: {
                            total: 1,
                            trabajando: asesor.estado === "TRABAJANDO" ? 1 : 0,
                            en_pausa: ["BREAK", "ALMUERZO", "BANO", "CAPACITACION", "REUNION"].includes(asesor.estado) ? 1 : 0,
                            llegadas_tarde: asesor.llego_tarde ? 1 : 0
                        },
                        productividad: dashboard.productividad || {},
                        ventas: { cantidad: 0, total_vendido: 0, total_recaudo: 0 },
                        incidencias_pendientes: 0
                    });
                    setAsesores([asesor]);
                } else errores.push("estado de jornada");
                if (respuestaVentas) setVentasPersonales(Array.isArray(respuestaVentas.data?.data) ? respuestaVentas.data.data : []);
                else errores.push("ventas personales");
                if (respuestaIncidencias) {
                    const listaIncidencias = Array.isArray(respuestaIncidencias.data?.incidencias)
                        ? respuestaIncidencias.data.incidencias
                        : Array.isArray(respuestaIncidencias.data) ? respuestaIncidencias.data : [];
                    setEjecutivo((actual) => actual ? {
                        ...actual,
                        incidencias_pendientes: listaIncidencias.filter((i) => i.revisada === false || i.revisada === 0 || i.revisada === "0").length
                    } : actual);
                } else errores.push("incidencias");
            }

            setMensaje(errores.length ? `No se pudieron actualizar algunos datos: ${errores.join(", ")}.` : "");
        } catch (error) {
            setMensaje(error.response?.data?.mensaje || "No fue posible cargar la información del panel.");
        } finally {
            cargandoRef.current = false;
            setCargando(false);
        }
    }, [esAdministrador, periodo.inicio, periodo.fin, asesorId]);

    useEffect(() => {
        cargar();
        const id = setInterval(cargar, 15000);
        return () => clearInterval(id);
    }, [cargar]);

    const ventasDelDia = useMemo(() => {
        const hoy = `${String(hoyColombia().year).padStart(4, "0")}-${String(hoyColombia().month + 1).padStart(2, "0")}-${String(hoyColombia().dia).padStart(2, "0")}`;
        return ventasPersonales.filter((venta) => fechaLocal(venta.fecha_hora) === hoy && venta.estado === "ACTIVA");
    }, [ventasPersonales]);

    const filaPersonal = useMemo(() => {
        const encontrada = metas[0];
        const asesor = asesores[0] || {};
        return encontrada || {
            asesor_id: asesorId,
            asesor_nombre: asesor.nombre || usuario?.nombre || usuario?.usuario || "Analista",
            periodo_tipo: periodo.tipo,
            periodo_inicio: periodo.inicio,
            periodo_fin: periodo.fin,
            meta_ventas: 0,
            meta_recaudo: 0,
            ventas_actuales: ventasDelDia.length,
            recaudo_actual: ventasDelDia.reduce((suma, venta) => suma + Number(venta.recaudo || 0), 0)
        };
    }, [asesores, metas, periodo, usuario, asesorId, ventasDelDia]);

    const filasBase = useMemo(() => esAdministrador
        ? asesores.map((asesor) => metas.find((m) => Number(m.asesor_id) === Number(asesor.id)) || {
            asesor_id: asesor.id,
            asesor_nombre: asesor.nombre,
            periodo_tipo: periodo.tipo,
            periodo_inicio: periodo.inicio,
            periodo_fin: periodo.fin,
            meta_ventas: 0,
            meta_recaudo: 0,
            ventas_actuales: 0,
            recaudo_actual: 0
        })
        : [filaPersonal], [asesores, esAdministrador, filaPersonal, metas, periodo]);

    const filas = useMemo(() => filasBase.map((fila) => ({
        ...fila,
        ...(metaBorradores[String(fila.asesor_id)] || {})
    })), [filasBase, metaBorradores]);

    useEffect(() => {
        const cumplidas = filasBase.filter((fila) => (
            Number(fila.meta_ventas || 0) > 0 && Number(fila.meta_recaudo || 0) > 0 &&
            Number(fila.ventas_actuales || 0) >= Number(fila.meta_ventas || 0) &&
            Number(fila.recaudo_actual || 0) >= Number(fila.meta_recaudo || 0)
        ));
        const nueva = cumplidas.find((fila) => {
            const clave = `${periodo.inicio}:${periodo.fin}:${fila.asesor_id}`;
            return !felicitacionesMostradas.current.has(clave);
        });
        if (nueva) {
            felicitacionesMostradas.current.add(`${periodo.inicio}:${periodo.fin}:${nueva.asesor_id}`);
            setFelicitacion({
                visible: true,
                nombre: nueva.asesor_nombre || "asesora",
                mensaje: "¡Cumpliste tus metas de ventas y recaudo! Tu disciplina inspira a todo el equipo."
            });
        }
    }, [filasBase, periodo.inicio, periodo.fin]);

    function cambiarMeta(asesorId, campo, valor) {
        const clave = String(asesorId);
        metasSucias.current.add(clave);
        setMetaBorradores((actuales) => ({
            ...actuales,
            [clave]: {
                meta_ventas: actuales[clave]?.meta_ventas ?? String(filasBase.find((fila) => String(fila.asesor_id) === clave)?.meta_ventas ?? 0),
                meta_recaudo: actuales[clave]?.meta_recaudo ?? String(filasBase.find((fila) => String(fila.asesor_id) === clave)?.meta_recaudo ?? 0),
                [campo]: valor
            }
        }));
    }

    async function guardarMeta(fila) {
        const clave = String(fila.asesor_id);
        if (metaGuardandoId === clave) return;
        const metaVentasTexto = String(fila.meta_ventas ?? "").trim();
        const metaRecaudoTexto = String(fila.meta_recaudo ?? "").trim();
        if (!metaVentasTexto || !metaRecaudoTexto) {
            setMensajeMeta("Completa ambas metas o escribe 0 si no deseas fijar una de ellas.");
            return;
        }
        const metaVentas = Number(metaVentasTexto);
        const metaRecaudo = Number(metaRecaudoTexto);
        if (!Number.isInteger(metaVentas) || metaVentas < 0 || metaVentas > 1000000) {
            setMensajeMeta("La meta de ventas debe ser un entero entre 0 y 1.000.000.");
            return;
        }
        if (!Number.isFinite(metaRecaudo) || metaRecaudo < 0 || metaRecaudo > 100000000000) {
            setMensajeMeta("La meta de recaudo debe estar entre 0 y 100.000.000.000.");
            return;
        }
        setMetaGuardandoId(clave);
        setMensajeMeta("Guardando meta…");
        try {
            const { data } = await api.put("/metas", {
                asesor_id: fila.asesor_id,
                periodo_tipo: periodo.tipo,
                periodo_inicio: periodo.inicio,
                periodo_fin: periodo.fin,
                meta_ventas: metaVentas,
                meta_recaudo: metaRecaudo
            });
            metasSucias.current.delete(clave);
            setMetaBorradores((actuales) => ({
                ...actuales,
                [clave]: {
                    meta_ventas: String(data?.data?.meta_ventas ?? metaVentas),
                    meta_recaudo: String(data?.data?.meta_recaudo ?? metaRecaudo)
                }
            }));
            setMensajeMeta(`Meta guardada para ${fila.asesor_nombre || "el asesor"}.`);
            await cargar();
        } catch (error) {
            setMensajeMeta(error.response?.data?.mensaje || "No fue posible guardar la meta.");
        } finally {
            setMetaGuardandoId(null);
        }
    }

    if (cargando && !ejecutivo) {
        return <section style={{ ...tarjeta, marginTop: 24 }}><strong>⏳ Cargando Centro de Control...</strong></section>;
    }

    const metasCumplidas = filasBase.filter((fila) => (
        Number(fila.meta_ventas || 0) > 0 && Number(fila.meta_recaudo || 0) > 0 &&
        Number(fila.ventas_actuales || 0) >= Number(fila.meta_ventas || 0) &&
        Number(fila.recaudo_actual || 0) >= Number(fila.meta_recaudo || 0)
    ));

    const e = ejecutivo || { asesores: {}, productividad: {}, ventas: {}, incidencias_pendientes: 0 };
    const ventasPanel = esAdministrador ? e.ventas : {
        cantidad: ventasDelDia.length,
        total_vendido: ventasDelDia.reduce((suma, venta) => suma + Number(venta.valor || 0), 0),
        total_recaudo: ventasDelDia.reduce((suma, venta) => suma + Number(venta.recaudo || 0), 0)
    };

    const titulo = esAdministrador ? "🎯 Centro de Control Ejecutivo" : "🎯 Mi Centro de Productividad";
    const descripcion = esAdministrador
        ? "Indicadores operativos y comerciales del día. Actualización automática cada 15 segundos."
        : "Tus indicadores de jornada, ventas, recaudo y avance de metas. Actualización automática cada 15 segundos.";
    const tarjetas = esAdministrador
        ? [["👥", "Asesores", e.asesores.total], ["🟢", "Trabajando", e.asesores.trabajando], ["☕", "En pausa", e.asesores.en_pausa], ["🚨", "Llegadas tarde", e.asesores.llegadas_tarde], ["💰", "Ventas", ventasPanel.cantidad], ["💵", "Vendido", moneda(ventasPanel.total_vendido, config.simbolo_moneda, config.moneda)], ["📥", "Recaudo", moneda(ventasPanel.total_recaudo, config.simbolo_moneda, config.moneda)], ["📌", "Incidencias", e.incidencias_pendientes]]
        : [["🧑‍💼", "Mi estado", asesores[0]?.estado || "DISPONIBLE"], ["🟢", "Trabajando", e.asesores.trabajando], ["☕", "En pausa", e.asesores.en_pausa], ["🚨", "Llegada tarde", e.asesores.llegadas_tarde], ["💰", "Mis ventas", ventasPanel.cantidad], ["💵", "Vendido", moneda(ventasPanel.total_vendido, config.simbolo_moneda, config.moneda)], ["📥", "Mi recaudo", moneda(ventasPanel.total_recaudo, config.simbolo_moneda, config.moneda)], ["📌", "Mis incidencias", e.incidencias_pendientes]];

    return <section className="executive-panel" style={{ marginTop: 24, display: "grid", gap: 16 }}>
        <FelicitacionToast {...felicitacion} onClose={() => setFelicitacion((actual) => ({ ...actual, visible: false }))} />
        <div className="executive-summary-card" style={{ ...tarjeta, borderTop: "4px solid #b8941f" }}>
            <h2 style={{ margin: 0, color: "#245b3a" }}>{titulo}</h2>
            <p style={{ color: "#66756b", marginBottom: 0 }}>{descripcion}</p>
            {mensaje && <p role="status" style={{ color: mensaje.includes("🎉") ? "#176b45" : "#245b3a", fontWeight: "bold" }}>{mensaje}</p>}
            {mensajeMeta && <p role="status" style={{ color: mensajeMeta.startsWith("Meta guardada") ? "#176b45" : "#9a4d00", fontWeight: "bold" }}>{mensajeMeta}</p>}
            {metasCumplidas.length > 0 && <div className="goal-celebration" role="status"><strong>🎉 ¡Felicitaciones!</strong><span>{metasCumplidas.map((fila) => fila.asesor_nombre || "Asesor").join(", ")} cumplió su meta de ventas y recaudo.</span><small>Excelente trabajo y compromiso con los resultados.</small></div>}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 10, marginTop: 14 }}>
                {tarjetas.map(([icono, etiqueta, valor]) => (
                    <div key={etiqueta} className="executive-metric-card" style={{ background: "#f7fbf8", borderRadius: 10, padding: 12 }}>
                        <div style={{ color: "#789184", fontSize: 11, fontWeight: 800 }}>{icono} {etiqueta}</div>
                        <strong style={{ color: "#245b3a", fontSize: 20 }}>{valor}</strong>
                    </div>
                ))}
            </div>
            <div className="executive-productivity-summary" style={{ marginTop: 12, color: "#4b5563" }}>Productividad: <strong>{e.productividad.porcentaje || 0}%</strong> · Trabajado: <strong>{duracion(e.productividad.tiempo_trabajado)}</strong> · Productivo: <strong>{duracion(e.productividad.tiempo_productivo)}</strong></div>
        </div>

        <div className="executive-goals-card" style={tarjeta}>
            <h3 style={{ marginTop: 0, color: "#245b3a" }}>{esAdministrador ? "🏆 Metas por asesor" : "🏆 Mi meta individual"}</h3>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 14 }}>
                <div className="executive-period-card" style={{ flex: "1 1 220px", padding: 10, background: "#f7fbf8", borderRadius: 7, color: "#245b3a" }}><strong>Periodo:</strong> {periodo.inicio} al {periodo.fin}<br /><small>Quincena actual · {diasRestantes(periodo)} días restantes · Hora Colombia</small></div>
                <button type="button" onClick={cargar} style={{ alignSelf: "end", padding: "10px 14px", background: "#245b3a", color: "#fff", border: 0, borderRadius: 7, fontWeight: "bold" }}>Actualizar</button>
            </div>
            {!esAdministrador && <>
                <ProgresoMetaAsesor fila={filaPersonal} periodo={periodo} config={config} diasPendientes={diasRestantes(periodo)} />
                <InsigniasAsesor ventas={ventasPersonales} fila={filaPersonal} periodo={periodo} config={config} />
            </>}
            <div style={{ overflowX: "auto" }}><table style={{ width: "100%", minWidth: 820, borderCollapse: "collapse" }}><thead><tr>{["Asesor", "Meta ventas", "Ventas", "% ventas", "Meta recaudo", "Recaudo", "% recaudo", ...(esAdministrador ? ["Acción"] : [])].map((h) => <th key={h} style={{ textAlign: "left", padding: 8, background: "#f7fbf8", color: "#245b3a" }}>{h}</th>)}</tr></thead><tbody>{filas.map((fila) => { const ventasActuales = Number(fila.ventas_actuales || 0); const recaudoActual = Number(fila.recaudo_actual || 0); const pv = porcentaje(ventasActuales, fila.meta_ventas); const pr = porcentaje(recaudoActual, fila.meta_recaudo); const pvReal = porcentajeReal(ventasActuales, fila.meta_ventas); const prReal = porcentajeReal(recaudoActual, fila.meta_recaudo); const diasTranscurridos = Math.max(1, Math.ceil((Date.now() - new Date(`${periodo.inicio}T00:00:00-05:00`).getTime()) / 86400000)); const diasPeriodo = Math.max(1, Math.ceil((new Date(`${periodo.fin}T23:59:59-05:00`).getTime() - new Date(`${periodo.inicio}T00:00:00-05:00`).getTime()) / 86400000)); const proyeccionVentas = Math.round(ventasActuales / Math.min(diasTranscurridos, diasPeriodo) * diasPeriodo); return <tr key={fila.asesor_id} style={{ borderBottom: "1px solid #e5eee8" }}><td style={{ padding: 8, fontWeight: "bold" }}>{fila.asesor_nombre || "Asesor"}</td><td style={{ padding: 8 }}>{esAdministrador ? <input type="number" min="0" step="1" value={fila.meta_ventas ?? ""} aria-label={`Meta de ventas para ${fila.asesor_nombre || "asesor"}`} onChange={(ev) => cambiarMeta(fila.asesor_id, "meta_ventas", ev.target.value)} style={{ ...input, width: 100 }} /> : `${Number(fila.meta_ventas || 0).toLocaleString("es-CO")} ventas`}</td><td style={{ padding: 8 }}>{ventasActuales}</td><td style={{ padding: 8, minWidth: 150 }}><strong style={{ color: progresoColor(pvReal) }}>{pvReal}%</strong><div style={{ height: 7, background: "#e8eee9", borderRadius: 8, marginTop: 5 }}><div style={{ width: `${pv}%`, height: "100%", background: progresoColor(pvReal), borderRadius: 8 }} /></div><small>Proyección: {proyeccionVentas} ventas</small></td><td style={{ padding: 8 }}>{esAdministrador ? <input type="number" min="0" value={fila.meta_recaudo ?? ""} aria-label={`Meta de recaudo para ${fila.asesor_nombre || "asesor"}`} onChange={(ev) => cambiarMeta(fila.asesor_id, "meta_recaudo", ev.target.value)} style={{ ...input, width: 120 }} /> : moneda(fila.meta_recaudo, config.simbolo_moneda, config.moneda)}</td><td style={{ padding: 8 }}>{moneda(recaudoActual, config.simbolo_moneda, config.moneda)}</td><td style={{ padding: 8, minWidth: 120 }}><strong style={{ color: progresoColor(prReal) }}>{prReal}%</strong><div style={{ height: 7, background: "#e8eee9", borderRadius: 8, marginTop: 5 }}><div style={{ width: `${pr}%`, height: "100%", background: progresoColor(prReal), borderRadius: 8 }} /></div></td>{esAdministrador && <td style={{ padding: 8 }}><button type="button" onClick={() => guardarMeta(fila)} style={{ padding: "8px 10px", background: "#b8941f", color: "#fff", border: 0, borderRadius: 6, fontWeight: "bold" }}>Guardar</button></td>}</tr>; })}</tbody></table></div>
        </div>
        {esAdministrador && <div style={tarjeta} className="goals-history-card">
            <button type="button" className="goals-history-toggle" onClick={() => setHistorialVisible((visible) => !visible)} aria-expanded={historialVisible}>
                <span>🕘 Historial de cambios de metas</span><strong>{historialVisible ? "▲" : "▼"}</strong>
            </button>
            {historialVisible && (historialMetas.length === 0 ? <p style={{ color: "#66756b", marginBottom: 0 }}>Aún no hay cambios registrados para esta quincena.</p> : <div style={{ overflowX: "auto", marginTop: 14 }}><table style={{ width: "100%", borderCollapse: "collapse" }}><thead><tr>{["Fecha", "Asesor", "Meta ventas", "Meta recaudo", "Modificado por"].map((h) => <th key={h} style={{ textAlign: "left", padding: 8, background: "#f7fbf8", color: "#245b3a" }}>{h}</th>)}</tr></thead><tbody>{historialMetas.slice(0, 10).map((cambio) => <tr key={cambio.id}><td style={{ padding: 8 }}>{cambio.cambiado_at ? new Date(cambio.cambiado_at).toLocaleString("es-CO", { timeZone: "America/Bogota" }) : "-"}</td><td style={{ padding: 8 }}>{cambio.asesor_nombre}</td><td style={{ padding: 8 }}>{Number(cambio.meta_ventas || 0).toLocaleString("es-CO")} ventas</td><td style={{ padding: 8 }}>{moneda(cambio.meta_recaudo, config.simbolo_moneda, config.moneda)}</td><td style={{ padding: 8 }}>{cambio.cambiado_por_usuario || "Administrador"}</td></tr>)}</tbody></table></div>)}
        </div>}
    </section>;
}
