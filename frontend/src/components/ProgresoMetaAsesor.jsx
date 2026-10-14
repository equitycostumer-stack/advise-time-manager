function moneda(valor, simbolo = "$", codigo = "USD") {
    return `${simbolo}${Number(valor || 0).toLocaleString("es-CO", { maximumFractionDigits: 0 })} ${codigo}`;
}

function AnilloProgreso({ porcentaje, color, etiqueta }) {
    const progresoVisible = Math.min(100, Math.max(0, porcentaje));
    return (
        <div
            className="goal-progress-ring"
            style={{ "--goal-progress": `${progresoVisible}%`, "--goal-color": color }}
            role="progressbar"
            aria-label={etiqueta}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={progresoVisible}
            aria-valuetext={`${porcentaje}% completado`}
        >
            <div className="goal-progress-ring-center">
                <strong>{porcentaje}%</strong>
                <small>avance</small>
            </div>
        </div>
    );
}

export default function ProgresoMetaAsesor({ fila, periodo, config, diasPendientes }) {
    if (!fila) return null;

    const metricas = [
        { clave: "ventas", titulo: "Ventas", actual: Number(fila.ventas_actuales || 0), meta: Number(fila.meta_ventas || 0), color: "#1684dc", unidad: "ventas" },
        { clave: "recaudo", titulo: "Recaudo", actual: Number(fila.recaudo_actual || 0), meta: Number(fila.meta_recaudo || 0), color: "#19a96b", unidad: "recaudo" }
    ];
    const nombre = String(fila.asesor_nombre || "").trim().split(/\s+/)[0];
    const hayMeta = metricas.some((metrica) => metrica.meta > 0);

    return (
        <section className="goal-progress-hero" aria-labelledby="goal-progress-title">
            <div className="goal-progress-heading">
                <div>
                    <span className="goal-progress-eyebrow">TU OBJETIVO QUINCENAL</span>
                    <h4 id="goal-progress-title">{nombre ? `Vas avanzando, ${nombre}` : "Tu avance hacia la meta"}</h4>
                    <p>{periodo.inicio} al {periodo.fin} · {diasPendientes} {diasPendientes === 1 ? "día restante" : "días restantes"}</p>
                </div>
                <span className="goal-progress-sparkle" aria-hidden="true">✦</span>
            </div>

            {hayMeta ? (
                <div className="goal-progress-metrics">
                    {metricas.map((metrica) => {
                        if (metrica.meta <= 0) {
                            return (
                                <article key={metrica.clave} className="goal-progress-metric goal-progress-no-target">
                                    <span className="goal-progress-no-target-icon" aria-hidden="true">◎</span>
                                    <div><strong>Meta de {metrica.titulo.toLowerCase()} pendiente</strong><small>Pídele al administrador que la configure.</small></div>
                                </article>
                            );
                        }

                        const porcentaje = Math.round(metrica.actual / metrica.meta * 100);
                        const faltante = Math.max(0, metrica.meta - metrica.actual);
                        const actualFormateado = metrica.clave === "ventas"
                            ? `${metrica.actual.toLocaleString("es-CO")} ${metrica.unidad}`
                            : moneda(metrica.actual, config?.simbolo_moneda, config?.moneda);
                        const metaFormateada = metrica.clave === "ventas"
                            ? `${metrica.meta.toLocaleString("es-CO")} ${metrica.unidad}`
                            : moneda(metrica.meta, config?.simbolo_moneda, config?.moneda);
                        const faltanteFormateado = metrica.clave === "ventas"
                            ? `${faltante.toLocaleString("es-CO")} ${metrica.unidad}`
                            : moneda(faltante, config?.simbolo_moneda, config?.moneda);

                        return (
                            <article key={metrica.clave} className="goal-progress-metric">
                                <AnilloProgreso porcentaje={porcentaje} color={metrica.color} etiqueta={`Avance de meta de ${metrica.titulo.toLowerCase()}`} />
                                <div className="goal-progress-copy">
                                    <span>{metrica.titulo}</span>
                                    <strong>{actualFormateado} <small>de {metaFormateada}</small></strong>
                                    <small>{faltante > 0 ? `Te faltan ${faltanteFormateado}` : "¡Meta alcanzada! Sigue sumando."}</small>
                                </div>
                            </article>
                        );
                    })}
                </div>
            ) : (
                <div className="goal-progress-empty" role="status">
                    <span aria-hidden="true">🎯</span>
                    <div><strong>Aún no tienes metas para esta quincena</strong><small>Cuando estén configuradas, aquí verás tu avance en tiempo real.</small></div>
                </div>
            )}
        </section>
    );
}
