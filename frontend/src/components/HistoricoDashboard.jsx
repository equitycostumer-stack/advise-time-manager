import { useState } from "react";
import api from "../services/api";

// ======================================================
// FORMATEAR MILISEGUNDOS -> HH:MM:SS
// ======================================================

function formatearDuracion(ms) {

    const total = Math.max(0, Math.floor(Number(ms) / 1000));

    const horas = Math.floor(total / 3600);
    const minutos = Math.floor((total % 3600) / 60);
    const segundos = total % 60;

    return (
        `${String(horas).padStart(2, "0")}:` +
        `${String(minutos).padStart(2, "0")}:` +
        `${String(segundos).padStart(2, "0")}`
    );

}

// ======================================================
// FORMATEAR FECHA/HORA -> LEGIBLE EN COLOMBIA
// ======================================================

function formatearFechaHora(valor) {

    if (!valor) return "—";

    const fecha = new Date(valor.replace(" ", "T") + "-05:00");

    if (Number.isNaN(fecha.getTime())) return "—";

    return fecha.toLocaleString("es-CO", {
        timeZone: "America/Bogota",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true
    });

}

function formatearMoneda(valor) {

    const numero = Number(valor) || 0;

    return numero.toLocaleString("es-CO", {
        style: "currency",
        currency: "COP",
        maximumFractionDigits: 0
    });

}

// ======================================================
// FECHA DE HOY EN FORMATO YYYY-MM-DD (para valor inicial)
// ======================================================

function hoyColombia() {

    return new Intl.DateTimeFormat("en-CA", {
        timeZone: "America/Bogota"
    }).format(new Date());

}

export default function HistoricoDashboard() {

    const [desde, setDesde] = useState(hoyColombia());
    const [hasta, setHasta] = useState(hoyColombia());

    const [asistencia, setAsistencia] = useState([]);
    const [ventas, setVentas] = useState([]);

    const [consultado, setConsultado] = useState(false);
    const [cargando, setCargando] = useState(false);

    // ======================================================
    // CONSULTAR
    // ======================================================

    async function consultar() {

        if (!desde || !hasta) {
            alert("Seleccione ambas fechas.");
            return;
        }

        if (desde > hasta) {
            alert("La fecha 'Desde' no puede ser posterior a 'Hasta'.");
            return;
        }

        setCargando(true);

        try {

            const [resAsistencia, resVentas] = await Promise.all([
                api.get(`/reportes/asistencia?desde=${desde}&hasta=${hasta}`),
                api.get(`/reportes/ventas?desde=${desde}&hasta=${hasta}`)
            ]);

            setAsistencia(
                Array.isArray(resAsistencia.data?.data)
                    ? resAsistencia.data.data
                    : []
            );

            setVentas(
                Array.isArray(resVentas.data?.data)
                    ? resVentas.data.data
                    : []
            );

            setConsultado(true);

        } catch (error) {

            console.error("Error consultando histórico:", error);

            alert(
                error.response?.data?.mensaje ||
                "No fue posible consultar el histórico."
            );

        } finally {

            setCargando(false);

        }

    }

    // ======================================================
    // TOTALES DE VENTAS (solo ACTIVA)
    // ======================================================

    const ventasActivas = ventas.filter(v => v.estado === "ACTIVA");

    const totalVendido = ventasActivas.reduce(
        (acc, v) => acc + Number(v.valor || 0),
        0
    );

    const totalLlegadasTarde = asistencia.filter(a => a.llego_tarde).length;

    // ======================================================
    // ESTILOS COMPARTIDOS
    // ======================================================

    const th = {
        padding: "8px",
        background: "#0d6efd",
        color: "#fff",
        textAlign: "left",
        whiteSpace: "nowrap",
        position: "sticky",
        top: 0
    };

    const td = {
        padding: "8px",
        borderBottom: "1px solid #e5e5e5",
        whiteSpace: "nowrap"
    };

    // ======================================================
    // INTERFAZ
    // ======================================================

    return (

        <div
            style={{
                marginTop: 20,
                background: "#fff",
                borderRadius: 10,
                padding: 20
            }}
        >

            <h2>📊 Histórico Multi-Día</h2>

            {/* =====================================================
                SELECTOR DE FECHAS
            ===================================================== */}

            <div
                style={{
                    display: "flex",
                    gap: "15px",
                    alignItems: "flex-end",
                    flexWrap: "wrap",
                    marginTop: "20px",
                    marginBottom: "25px"
                }}
            >

                <div>
                    <label style={{ display: "block", marginBottom: "4px", fontWeight: "bold" }}>
                        Desde
                    </label>
                    <input
                        type="date"
                        value={desde}
                        onChange={(e) => setDesde(e.target.value)}
                        style={{
                            padding: "8px",
                            borderRadius: "6px",
                            border: "1px solid #ccc"
                        }}
                    />
                </div>

                <div>
                    <label style={{ display: "block", marginBottom: "4px", fontWeight: "bold" }}>
                        Hasta
                    </label>
                    <input
                        type="date"
                        value={hasta}
                        onChange={(e) => setHasta(e.target.value)}
                        style={{
                            padding: "8px",
                            borderRadius: "6px",
                            border: "1px solid #ccc"
                        }}
                    />
                </div>

                <button
                    onClick={consultar}
                    disabled={cargando}
                    style={{
                        background: cargando ? "#7aa8d8" : "#0d6efd",
                        color: "#fff",
                        border: "none",
                        borderRadius: "8px",
                        padding: "10px 20px",
                        fontWeight: "bold",
                        cursor: cargando ? "default" : "pointer"
                    }}
                >
                    {cargando ? "Consultando..." : "🔍 Consultar"}
                </button>

            </div>

            {!consultado ? (

                <p style={{ color: "#666" }}>
                    Selecciona un rango de fechas y presiona Consultar.
                </p>

            ) : (

                <>

                    {/* =====================================================
                        INDICADORES DEL RANGO
                    ===================================================== */}

                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))",
                            gap: "15px",
                            marginBottom: "30px"
                        }}
                    >

                        <div style={{
                            background: "#198754", color: "#fff",
                            padding: "15px", borderRadius: "10px", textAlign: "center"
                        }}>
                            <h2>{asistencia.length}</h2>
                            <small>📋 Jornadas registradas</small>
                        </div>

                        <div style={{
                            background: "#dc3545", color: "#fff",
                            padding: "15px", borderRadius: "10px", textAlign: "center"
                        }}>
                            <h2>{totalLlegadasTarde}</h2>
                            <small>🚨 Llegadas tarde</small>
                        </div>

                        <div style={{
                            background: "#20c997", color: "#fff",
                            padding: "15px", borderRadius: "10px", textAlign: "center"
                        }}>
                            <h2>{ventasActivas.length}</h2>
                            <small>💰 Ventas</small>
                        </div>

                        <div style={{
                            background: "#0d6efd", color: "#fff",
                            padding: "15px", borderRadius: "10px", textAlign: "center"
                        }}>
                            <h2>{formatearMoneda(totalVendido)}</h2>
                            <small>💵 Total vendido</small>
                        </div>

                    </div>

                    {/* =====================================================
                        TABLA DE ASISTENCIA
                    ===================================================== */}

                    <h3>👥 Asistencia</h3>

                    <div style={{ overflowX: "auto", marginBottom: "35px" }}>

                        <table style={{ borderCollapse: "collapse", width: "100%", fontSize: "14px" }}>

                            <thead>
                                <tr>
                                    <th style={th}>Fecha</th>
                                    <th style={th}>Asesor</th>
                                    <th style={th}>Entrada</th>
                                    <th style={th}>Salida</th>
                                    <th style={th}>Trabajado</th>
                                    <th style={th}>Break</th>
                                    <th style={th}>Almuerzo</th>
                                    <th style={th}>Baño</th>
                                    <th style={th}>Capacitación</th>
                                    <th style={th}>Reunión</th>
                                    <th style={th}>Productivo</th>
                                    <th style={th}>Retraso</th>
                                </tr>
                            </thead>

                            <tbody>

                                {asistencia.length === 0 ? (

                                    <tr>
                                        <td style={td} colSpan={12}>
                                            No hay registros en este rango.
                                        </td>
                                    </tr>

                                ) : (

                                    asistencia.map((a) => (

                                        <tr key={a.id}>
                                            <td style={td}>{a.fecha}</td>
                                            <td style={td}>{a.asesor_nombre}</td>
                                            <td style={td}>{formatearFechaHora(a.hora_entrada)}</td>
                                            <td style={td}>{a.hora_salida ? formatearFechaHora(a.hora_salida) : "—"}</td>
                                            <td style={td}>{formatearDuracion(a.tiempo_trabajado)}</td>
                                            <td style={td}>{formatearDuracion(a.tiempo_break)}</td>
                                            <td style={td}>{formatearDuracion(a.tiempo_almuerzo)}</td>
                                            <td style={td}>{formatearDuracion(a.tiempo_bano)}</td>
                                            <td style={td}>{formatearDuracion(a.tiempo_capacitacion)}</td>
                                            <td style={td}>{formatearDuracion(a.tiempo_reunion)}</td>
                                            <td style={td}>{formatearDuracion(a.tiempo_productivo)}</td>
                                            <td style={td}>
                                                {a.llego_tarde
                                                    ? `🔴 ${a.minutos_retraso} min`
                                                    : "🟢 Puntual"}
                                            </td>
                                        </tr>

                                    ))

                                )}

                            </tbody>

                        </table>

                    </div>

                    {/* =====================================================
                        TABLA DE VENTAS
                    ===================================================== */}

                    <h3>💰 Ventas</h3>

                    <div style={{ overflowX: "auto" }}>

                        <table style={{ borderCollapse: "collapse", width: "100%", fontSize: "14px" }}>

                            <thead>
                                <tr>
                                    <th style={th}>Fecha</th>
                                    <th style={th}>Asesor</th>
                                    <th style={th}>ID Cliente</th>
                                    <th style={th}>Valor</th>
                                    <th style={th}>Observación</th>
                                    <th style={th}>Estado</th>
                                </tr>
                            </thead>

                            <tbody>

                                {ventas.length === 0 ? (

                                    <tr>
                                        <td style={td} colSpan={6}>
                                            No hay ventas en este rango.
                                        </td>
                                    </tr>

                                ) : (

                                    ventas.map((v) => (

                                        <tr
                                            key={v.id}
                                            style={{
                                                opacity: v.estado === "ANULADA" ? 0.55 : 1
                                            }}
                                        >
                                            <td style={td}>{formatearFechaHora(v.fecha_hora)}</td>
                                            <td style={td}>{v.asesor_nombre}</td>
                                            <td style={td}>{v.cliente_id || "—"}</td>
                                            <td style={td}>{formatearMoneda(v.valor)}</td>
                                            <td style={td}>{v.observacion || "—"}</td>
                                            <td style={td}>
                                                {v.estado === "ACTIVA" ? "🟢 ACTIVA" : "🔴 ANULADA"}
                                            </td>
                                        </tr>

                                    ))

                                )}

                            </tbody>

                        </table>

                    </div>

                </>

            )}

        </div>

    );

}