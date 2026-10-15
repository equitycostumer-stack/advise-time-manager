import { useState } from "react";

const ETIQUETAS_MOVIMIENTO = {
    ENTRADA: { icono: "🟢", titulo: "Inicio de jornada", categoria: "jornada" },
    SALIDA: { icono: "🔴", titulo: "Fin de jornada", categoria: "jornada" },
    BREAK_INICIO: { icono: "☕", titulo: "Inicio de break", categoria: "pausa" },
    BREAK_FIN: { icono: "↩️", titulo: "Fin de break", categoria: "pausa" },
    ALMUERZO_INICIO: { icono: "🍽️", titulo: "Inicio de almuerzo", categoria: "pausa" },
    ALMUERZO_FIN: { icono: "↩️", titulo: "Fin de almuerzo", categoria: "pausa" },
    BANO_INICIO: { icono: "🚻", titulo: "Inicio de baño", categoria: "pausa" },
    BANO_FIN: { icono: "↩️", titulo: "Fin de baño", categoria: "pausa" },
    CAPACITACION_INICIO: { icono: "📚", titulo: "Inicio de capacitación", categoria: "pausa" },
    CAPACITACION_FIN: { icono: "↩️", titulo: "Fin de capacitación", categoria: "pausa" },
    REUNION_INICIO: { icono: "👥", titulo: "Inicio de reunión", categoria: "pausa" },
    REUNION_FIN: { icono: "↩️", titulo: "Fin de reunión", categoria: "pausa" }
};

function interpretarFechaColombia(valor) {
    if (!valor) return null;
    if (valor instanceof Date) return Number.isNaN(valor.getTime()) ? null : valor;
    const texto = String(valor).trim();
    const incluyeZona = /(?:Z|[+-]\d{2}:?\d{2})$/iu.test(texto);
    const fecha = new Date(incluyeZona ? texto : `${texto.replace(" ", "T")}-05:00`);
    return Number.isNaN(fecha.getTime()) ? null : fecha;
}

function horaColombia(valor) {
    const fecha = interpretarFechaColombia(valor);
    if (!fecha) return "Hora no disponible";
    return new Intl.DateTimeFormat("es-CO", {
        timeZone: "America/Bogota",
        hour: "2-digit",
        minute: "2-digit"
    }).format(fecha);
}

export default function ActivityTimeline({
    movimientos = [],
    ventas = [],
    asesorNombre = "",
    formatearMoneda = (valor) => `$${Number(valor || 0).toLocaleString("es-CO")}`
}) {
    const [mostrarTodo, setMostrarTodo] = useState(false);

    const eventos = [
        ...movimientos.map((movimiento) => {
            const tipo = String(movimiento.tipo || "").toUpperCase();
            const etiqueta = ETIQUETAS_MOVIMIENTO[tipo] || {
                icono: "📍",
                titulo: tipo.replaceAll("_", " ") || "Cambio de jornada",
                categoria: "jornada"
            };
            return {
                clave: `movimiento-${movimiento.id}`,
                fecha: movimiento.fecha_hora,
                marcaTiempo: interpretarFechaColombia(movimiento.fecha_hora)?.getTime() || 0,
                icono: etiqueta.icono,
                titulo: etiqueta.titulo,
                detalle: movimiento.observacion || "Actualización de jornada registrada.",
                categoria: etiqueta.categoria
            };
        }),
        ...ventas.map((venta) => {
            const anulada = venta.estado === "ANULADA";
            const cliente = venta.cliente_id ? `Cliente #${venta.cliente_id}` : "Venta sin cliente asociado";
            return {
                clave: `venta-${venta.id}`,
                fecha: venta.fecha_hora,
                marcaTiempo: interpretarFechaColombia(venta.fecha_hora)?.getTime() || 0,
                icono: anulada ? "↩️" : "💰",
                titulo: anulada ? "Venta anulada" : "Venta registrada",
                detalle: `${cliente} · ${formatearMoneda(venta.valor)} vendido · ${formatearMoneda(venta.recaudo)} recaudado`,
                categoria: anulada ? "venta-anulada" : "venta"
            };
        })
    ].sort((a, b) => b.marcaTiempo - a.marcaTiempo);

    const eventosVisibles = mostrarTodo ? eventos : eventos.slice(0, 8);

    return (
        <section className="activity-timeline-card" aria-label="Actividad de hoy">
            <div className="activity-timeline-heading">
                <div>
                    <span className="activity-timeline-eyebrow">EN TIEMPO REAL</span>
                    <h3>🧭 Actividad de hoy</h3>
                    <p>{asesorNombre ? `Jornada y ventas de ${asesorNombre}` : "Jornada y ventas del asesor seleccionado"}</p>
                </div>
                <span className="activity-timeline-count" aria-label={`${eventos.length} eventos`}>{eventos.length}</span>
            </div>

            {eventos.length === 0 ? (
                <div className="activity-timeline-empty">
                    <span aria-hidden="true">🕒</span>
                    <div>
                        <strong>Aún no hay actividad para mostrar</strong>
                        <small>Los movimientos y las ventas de hoy aparecerán aquí automáticamente.</small>
                    </div>
                </div>
            ) : (
                <>
                    <ol className="activity-timeline-list">
                        {eventosVisibles.map((evento) => {
                            const fecha = interpretarFechaColombia(evento.fecha);
                            return (
                                <li className="activity-timeline-item" key={evento.clave}>
                                    <span className={`activity-timeline-marker is-${evento.categoria}`} aria-hidden="true">{evento.icono}</span>
                                    <div className="activity-timeline-copy">
                                        <strong>{evento.titulo}</strong>
                                        <small>{evento.detalle}</small>
                                    </div>
                                    {fecha ? (
                                        <time className="activity-timeline-time" dateTime={fecha.toISOString()}>{horaColombia(fecha)}</time>
                                    ) : (
                                        <span className="activity-timeline-time">—</span>
                                    )}
                                </li>
                            );
                        })}
                    </ol>
                    {eventos.length > 8 && (
                        <button
                            type="button"
                            className="activity-timeline-toggle"
                            aria-expanded={mostrarTodo}
                            onClick={() => setMostrarTodo((visible) => !visible)}
                        >
                            {mostrarTodo ? "Mostrar menos" : `Ver toda la actividad (${eventos.length})`}
                        </button>
                    )}
                </>
            )}
        </section>
    );
}
