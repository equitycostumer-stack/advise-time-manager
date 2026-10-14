function tieneActividad(asesor) {
    return Number(asesor?.cantidad_ventas || 0) > 0 || Number(asesor?.total_vendido || 0) > 0 || Number(asesor?.total_recaudo || 0) > 0;
}

export default function RankingPodium({ ranking = [], asesorId = null, formatearMoneda }) {
    if (!ranking.length) return null;

    const hayActividad = ranking.some(tieneActividad);
    if (!hayActividad) {
        return (
            <div className="ranking-podium-empty">
                <span aria-hidden="true">🏅</span>
                <div><strong>El podio está listo para recibirte</strong><small>Se mostrará aquí cuando se registre la primera venta del periodo.</small></div>
            </div>
        );
    }

    const miPosicion = ranking.findIndex((asesor) => String(asesor.asesor_id) === String(asesorId));
    const puestos = [
        { asesor: ranking[1], posicion: 2, medal: "🥈" },
        { asesor: ranking[0], posicion: 1, medal: "🥇" },
        { asesor: ranking[2], posicion: 3, medal: "🥉" }
    ].filter((puesto) => puesto.asesor);

    return (
        <div className="ranking-podium-wrap">
            <div className="ranking-podium" aria-label="Podio de los tres primeros lugares">
                {puestos.map(({ asesor, posicion, medal }) => {
                    const esActual = asesorId != null && String(asesor.asesor_id) === String(asesorId);
                    return (
                        <article key={asesor.asesor_id} className={`ranking-podium-card podium-place-${posicion}${esActual ? " is-current" : ""}`}>
                            <span className="ranking-podium-medal" aria-hidden="true">{medal}</span>
                            <span className="ranking-podium-place">{posicion === 1 ? "1.er lugar" : `${posicion}.º lugar`}</span>
                            <strong className="ranking-podium-name">{asesor.asesor_nombre || "Asesor"}{esActual && <span className="ranking-you-badge">Tú</span>}</strong>
                            <span className="ranking-podium-sales">{Number(asesor.cantidad_ventas || 0)} {Number(asesor.cantidad_ventas || 0) === 1 ? "venta" : "ventas"}</span>
                            <small>Vendido <b>{formatearMoneda(asesor.total_vendido)}</b></small>
                            <small>Recaudo <b>{formatearMoneda(asesor.total_recaudo)}</b></small>
                        </article>
                    );
                })}
            </div>
            {miPosicion >= 0 && (
                <p className="ranking-current-position" role="status">
                    <span aria-hidden="true">🎯</span>
                    <span>Tu posición actual: <strong>#{miPosicion + 1}</strong> · {Number(ranking[miPosicion].cantidad_ventas || 0)} {Number(ranking[miPosicion].cantidad_ventas || 0) === 1 ? "venta" : "ventas"} · Recaudo {formatearMoneda(ranking[miPosicion].total_recaudo)}</span>
                </p>
            )}
        </div>
    );
}
