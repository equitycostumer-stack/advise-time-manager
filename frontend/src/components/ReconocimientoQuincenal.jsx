import { useMemo } from "react";

function formatearMoneda(valor) {
    return `$${Number(valor || 0).toLocaleString("es-CO", { maximumFractionDigits: 0 })}`;
}

export default function ReconocimientoQuincenal({ reconocimiento = {}, id }) {
    const { ganadora, cargando, error, periodoLabel } = reconocimiento;
    const mensajeNombre = useMemo(() => {
        if (cargando) return "Calculando el reconocimiento…";
        if (error) return error;
        return ganadora?.asesor_nombre || "¡La próxima ganadora puedes ser tú!";
    }, [cargando, error, ganadora]);

    return (
        <section id={id} className="previous-fortnight-winner" aria-label="Mejor asesora de la quincena anterior">
            <div className="previous-fortnight-winner__icon" aria-hidden="true">🏆</div>
            <div className="previous-fortnight-winner__content" aria-live="polite">
                <p className="previous-fortnight-winner__eyebrow">Mejor asesora de la quincena anterior · ¡Felicidades!</p>
                <strong className="previous-fortnight-winner__name">{mensajeNombre}</strong>
                <p className="previous-fortnight-winner__period">{periodoLabel || "Última quincena completa"} · seleccionada automáticamente</p>
                {ganadora && !cargando && !error && (
                    <div className="previous-fortnight-winner__stats">
                        <span>{Number(ganadora.cantidad_ventas || 0)} ventas</span>
                        <span>Vendido: {formatearMoneda(ganadora.total_vendido)}</span>
                        <span>Recaudo: {formatearMoneda(ganadora.total_recaudo)}</span>
                    </div>
                )}
                {!ganadora && !cargando && !error && <small className="previous-fortnight-winner__criteria">Aún no hay ventas activas en este periodo. ¡Cada venta cuenta!</small>}
                <small className="previous-fortnight-winner__criteria">Criterio: más ventas; empate por recaudo y después total vendido.</small>
            </div>
        </section>
    );
}
