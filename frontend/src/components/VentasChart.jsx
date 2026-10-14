import { useEffect, useMemo, useState } from "react";
import api from "../services/api";

const ZONA_HORARIA = "America/Bogota";
const VENTAS_VACIAS = Object.freeze([]);

function hoyColombia() {
    const partes = new Intl.DateTimeFormat("en-CA", {
        timeZone: ZONA_HORARIA,
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
    }).formatToParts(new Date()).reduce((resultado, parte) => ({ ...resultado, [parte.type]: parte.value }), {});
    return `${partes.year}-${partes.month}-${partes.day}`;
}

function desplazarFecha(fechaISO, dias) {
    const fecha = new Date(`${fechaISO}T12:00:00Z`);
    fecha.setUTCDate(fecha.getUTCDate() + dias);
    return fecha.toISOString().slice(0, 10);
}

function obtenerRango(periodo) {
    const hoy = hoyColombia();
    if (periodo === "hoy") return { desde: hoy, hasta: hoy };
    if (periodo === "semana") return { desde: desplazarFecha(hoy, -6), hasta: hoy };

    const [anio, mes, dia] = hoy.split("-").map(Number);
    const inicio = dia <= 15 ? "01" : "16";
    return { desde: `${anio}-${String(mes).padStart(2, "0")}-${inicio}`, hasta: hoy };
}

function obtenerRangoAnterior(periodo) {
    const actual = obtenerRango(periodo);
    const inicio = new Date(`${actual.desde}T12:00:00Z`).getTime();
    const fin = new Date(`${actual.hasta}T12:00:00Z`).getTime();
    const duracion = Math.max(1, Math.round((fin - inicio) / 86400000) + 1);
    const hasta = desplazarFecha(actual.desde, -1);
    return { desde: desplazarFecha(hasta, -(duracion - 1)), hasta };
}

function etiquetaFecha(fechaISO) {
    return new Intl.DateTimeFormat("es-CO", {
        timeZone: "UTC",
        weekday: "short",
        day: "2-digit"
    }).format(new Date(`${fechaISO}T12:00:00Z`)).replace(".", "");
}

function crearPuntos(ventas, periodo) {
    const hoy = hoyColombia();
    const rango = obtenerRango(periodo);
    const puntos = periodo === "hoy"
        ? Array.from({ length: 6 }, (_, indice) => {
            const inicio = indice * 4;
            return {
                clave: `hora-${inicio}`,
                etiqueta: `${String(inicio).padStart(2, "0")}:00`,
                cantidad: 0,
                vendido: 0,
                recaudo: 0
            };
        })
        : (() => {
            const resultado = [];
            for (let fecha = rango.desde; fecha <= rango.hasta; fecha = desplazarFecha(fecha, 1)) {
                resultado.push({ clave: fecha, etiqueta: etiquetaFecha(fecha), cantidad: 0, vendido: 0, recaudo: 0 });
            }
            return resultado;
        })();
    const porClave = new Map(puntos.map((punto) => [punto.clave, punto]));

    ventas.forEach((venta) => {
        if (venta.estado !== "ACTIVA") return;
        const fechaHora = String(venta.fecha_hora || "");
        const fecha = fechaHora.slice(0, 10);
        let clave = fecha;
        if (periodo === "hoy") {
            if (fecha !== hoy) return;
            const hora = Number(fechaHora.slice(11, 13));
            clave = `hora-${Math.min(20, Math.floor(hora / 4) * 4)}`;
        }
        const punto = porClave.get(clave);
        if (!punto) return;
        punto.cantidad += 1;
        punto.vendido += Number(venta.valor || 0);
        punto.recaudo += Number(venta.recaudo || 0);
    });

    return puntos;
}

function formatearMoneda(valor, simbolo) {
    return `${simbolo || "$"}${Number(valor || 0).toLocaleString("es-CO", { maximumFractionDigits: 0 })}`;
}

function formatoCompacto(valor, simbolo) {
    return `${simbolo || "$"}${Number(valor || 0).toLocaleString("es-CO", { notation: "compact", maximumFractionDigits: 1 })}`;
}

function resumirVentas(ventas) {
    const activas = ventas.filter((venta) => venta.estado === "ACTIVA");
    return activas.reduce((resumen, venta) => ({
        cantidad: resumen.cantidad + 1,
        vendido: resumen.vendido + Number(venta.valor || 0),
        recaudo: resumen.recaudo + Number(venta.recaudo || 0)
    }), { cantidad: 0, vendido: 0, recaudo: 0 });
}

function obtenerVariacion(actual, anterior) {
    if (anterior <= 0) {
        return actual > 0 ? { texto: "Nuevo", clase: "up" } : { texto: "→ 0%", clase: "neutral" };
    }
    const cambio = ((actual - anterior) / anterior) * 100;
    return {
        texto: `${cambio > 0 ? "↑" : cambio < 0 ? "↓" : "→"} ${Math.abs(cambio).toFixed(1)}%`,
        clase: cambio > 0 ? "up" : cambio < 0 ? "down" : "neutral"
    };
}

const OPCIONES_PERIODO = [
    ["hoy", "Hoy"],
    ["semana", "7 días"],
    ["quincena", "Quincena"]
];

export default function VentasChart({ simboloMoneda = "$", refreshKey = 0 }) {
    const [periodo, setPeriodo] = useState("semana");
    const [metrica, setMetrica] = useState("vendido");
    const [carga, setCarga] = useState({ periodo: null, refreshKey: null, ventas: [], ventasAnteriores: [], error: "", errorComparacion: false });
    const [puntoActivo, setPuntoActivo] = useState(null);

    useEffect(() => {
        let vigente = true;
        const rango = obtenerRango(periodo);
        const rangoAnterior = obtenerRangoAnterior(periodo);

        Promise.all([
            api.get("/reportes/ventas", { params: rango }),
            api.get("/reportes/ventas", { params: rangoAnterior })
                .then(({ data }) => ({ ventas: Array.isArray(data?.data) ? data.data : [], error: false }))
                .catch(() => ({ ventas: [], error: true }))
        ])
            .then(([respuestaActual, respuestaAnterior]) => {
                if (vigente) setCarga({
                    periodo,
                    refreshKey,
                    ventas: Array.isArray(respuestaActual.data?.data) ? respuestaActual.data.data : [],
                    ventasAnteriores: respuestaAnterior.ventas,
                    error: "",
                    errorComparacion: respuestaAnterior.error
                });
            })
            .catch((errorConsulta) => {
                if (vigente) {
                    setCarga({ periodo, refreshKey, ventas: [], ventasAnteriores: [], error: errorConsulta.response?.data?.mensaje || "No fue posible cargar la gráfica.", errorComparacion: true });
                }
            })

        return () => { vigente = false; };
    }, [periodo, refreshKey]);

    const cargaActual = carga.periodo === periodo && carga.refreshKey === refreshKey;
    const cargando = !cargaActual;
    const ventas = cargaActual ? carga.ventas : VENTAS_VACIAS;
    const error = cargaActual ? carga.error : "";
    const ventasAnteriores = cargaActual ? carga.ventasAnteriores : VENTAS_VACIAS;
    const errorComparacion = cargaActual && carga.errorComparacion;
    const puntos = useMemo(() => crearPuntos(ventas, periodo), [ventas, periodo]);
    const resumenAnterior = useMemo(() => resumirVentas(ventasAnteriores), [ventasAnteriores]);
    const claveMetrica = metrica === "vendido" ? "vendido" : "recaudo";
    const total = puntos.reduce((suma, punto) => suma + punto[claveMetrica], 0);
    const cantidad = puntos.reduce((suma, punto) => suma + punto.cantidad, 0);
    const variacionCantidad = obtenerVariacion(cantidad, resumenAnterior.cantidad);
    const variacionMonto = obtenerVariacion(total, resumenAnterior[claveMetrica]);
    const maximo = Math.max(1, ...puntos.map((punto) => punto[claveMetrica]));
    const seleccionado = puntos.find((punto) => punto.clave === puntoActivo);
    const ancho = Math.max(720, puntos.length * 54 + 72);
    const alto = 268;
    const margen = { arriba: 18, derecha: 18, abajo: 48, izquierda: 72 };
    const altoGrafica = alto - margen.arriba - margen.abajo;
    const anchoGrafica = ancho - margen.izquierda - margen.derecha;
    const paso = anchoGrafica / Math.max(puntos.length, 1);
    const anchoBarra = Math.min(34, paso * 0.52);
    const colorBarra = metrica === "vendido" ? "#1684dc" : "#19a96b";
    const nombreMetrica = metrica === "vendido" ? "Total vendido" : "Recaudo";

    return (
        <section className="ventas-trend-card" aria-labelledby="ventas-trend-heading">
            <div className="ventas-trend-header">
                <div>
                    <span className="ventas-trend-eyebrow">TENDENCIA COMERCIAL</span>
                    <h3 id="ventas-trend-heading">Tu avance, de un vistazo</h3>
                    <p>Explora tus resultados por periodo y cambia la métrica para comparar.</p>
                </div>
                <div className="ventas-trend-total" aria-live="polite">
                    <small>{nombreMetrica}</small>
                    <strong>{formatearMoneda(total, simboloMoneda)}</strong>
                    <span>{cantidad} {cantidad === 1 ? "venta" : "ventas"} activas</span>
                </div>
                <div className="ventas-comparison-card" aria-live="polite">
                    <span className="ventas-comparison-eyebrow">VS. PERIODO ANTERIOR</span>
                    {cargando ? <strong className="ventas-comparison-loading">Calculando…</strong> : errorComparacion ? (
                        <p className="ventas-comparison-unavailable">Comparación no disponible.</p>
                    ) : (
                        <div className="ventas-comparison-values">
                            <div><small>Ventas</small><strong className={`ventas-comparison-change is-${variacionCantidad.clase}`}>{variacionCantidad.texto}</strong></div>
                            <div><small>{nombreMetrica}</small><strong className={`ventas-comparison-change is-${variacionMonto.clase}`}>{variacionMonto.texto}</strong></div>
                        </div>
                    )}
                    <small className="ventas-comparison-footnote">Intervalo inmediatamente anterior</small>
                </div>
            </div>

            <div className="ventas-trend-controls">
                <div className="ventas-chart-segment" role="group" aria-label="Periodo de la gráfica">
                    {OPCIONES_PERIODO.map(([valor, etiqueta]) => (
                        <button key={valor} type="button" aria-pressed={periodo === valor} onClick={() => { setPuntoActivo(null); setPeriodo(valor); }}>
                            {etiqueta}
                        </button>
                    ))}
                </div>
                <div className="ventas-chart-segment ventas-chart-metric" role="group" aria-label="Métrica de la gráfica">
                    <button type="button" aria-pressed={metrica === "vendido"} onClick={() => setMetrica("vendido")}>💰 Vendido</button>
                    <button type="button" aria-pressed={metrica === "recaudo"} onClick={() => setMetrica("recaudo")}>📥 Recaudo</button>
                </div>
            </div>

            {error && <p className="ventas-chart-message is-error" role="alert">{error}</p>}
            {cargando && <p className="ventas-chart-message" role="status">Actualizando gráfica…</p>}
            {!cargando && !error && cantidad === 0 && <p className="ventas-chart-message">Aún no hay ventas activas en este periodo. La gráfica se actualizará al registrar una.</p>}

            {!error && (
                <div className="ventas-chart-scroll" aria-busy={cargando}>
                    <svg
                        className="ventas-chart-svg"
                        viewBox={`0 0 ${ancho} ${alto}`}
                        role="group"
                        aria-label={`${nombreMetrica} por ${periodo === "hoy" ? "bloques de cuatro horas" : "día"}. Total ${formatearMoneda(total, simboloMoneda)}.`}
                    >
                        {[0, 0.5, 1].map((fraccion) => {
                            const y = margen.arriba + altoGrafica * (1 - fraccion);
                            const valorEje = maximo * fraccion;
                            return (
                                <g key={fraccion} aria-hidden="true">
                                    <line x1={margen.izquierda} x2={ancho - margen.derecha} y1={y} y2={y} stroke="#e7eef6" strokeDasharray={fraccion === 0 ? "0" : "4 5"} />
                                    <text x={margen.izquierda - 10} y={y + 4} textAnchor="end" fill="#718198" fontSize="11">{formatoCompacto(valorEje, simboloMoneda)}</text>
                                </g>
                            );
                        })}
                        {puntos.map((punto, indice) => {
                            const valor = punto[claveMetrica];
                            const altura = valor > 0 ? Math.max(3, (valor / maximo) * altoGrafica) : 0;
                            const x = margen.izquierda + indice * paso + (paso - anchoBarra) / 2;
                            const y = margen.arriba + altoGrafica - altura;
                            const descripcion = `${punto.etiqueta}: ${punto.cantidad} ${punto.cantidad === 1 ? "venta" : "ventas"}; vendido ${formatearMoneda(punto.vendido, simboloMoneda)}; recaudo ${formatearMoneda(punto.recaudo, simboloMoneda)}.`;
                            return (
                                <g
                                    key={punto.clave}
                                    className="ventas-chart-point"
                                    tabIndex={0}
                                    role="img"
                                    aria-label={descripcion}
                                    onMouseEnter={() => setPuntoActivo(punto.clave)}
                                    onMouseLeave={() => setPuntoActivo(null)}
                                    onFocus={() => setPuntoActivo(punto.clave)}
                                    onBlur={() => setPuntoActivo(null)}
                                >
                                    <title>{descripcion}</title>
                                    <rect x={x} y={y} width={anchoBarra} height={altura} rx="6" fill={colorBarra} opacity={punto.clave === puntoActivo ? 1 : 0.82} />
                                    <text x={x + anchoBarra / 2} y={alto - 18} textAnchor="middle" fill="#64748b" fontSize="11">{punto.etiqueta}</text>
                                </g>
                            );
                        })}
                    </svg>
                </div>
            )}

            {seleccionado && (
                <div className="ventas-chart-tooltip" role="status">
                    <strong>{seleccionado.etiqueta}</strong>
                    <span>{seleccionado.cantidad} {seleccionado.cantidad === 1 ? "venta" : "ventas"}</span>
                    <span>Vendido: {formatearMoneda(seleccionado.vendido, simboloMoneda)}</span>
                    <span>Recaudo: {formatearMoneda(seleccionado.recaudo, simboloMoneda)}</span>
                </div>
            )}
        </section>
    );
}
