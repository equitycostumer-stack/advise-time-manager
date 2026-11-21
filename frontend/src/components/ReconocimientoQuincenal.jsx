import { useMemo } from "react";
import { obtenerEtiquetaMejorAsesor } from "../utils/periodosVentas";

function formatearMoneda(valor) {
    return `$${Number(valor || 0).toLocaleString("es-CO", { maximumFractionDigits: 0 })}`;
}

export default function ReconocimientoQuincenal({ reconocimiento = {}, id, fotoGanadora = null }) {
    const { ganadora, cargando, error, periodoLabel } = reconocimiento;
    const etiquetaMejorAsesor = obtenerEtiquetaMejorAsesor(ganadora?.genero);
    const mensajeNombre = useMemo(() => {
        if (cargando) return "Calculando el reconocimiento…";
        if (error) return error;
        return ganadora?.asesor_nombre || "¡El próximo reconocimiento puede ser tuyo!";
    }, [cargando, error, ganadora]);

    return (
        <section id={id} className="previous-fortnight-winner" aria-label={`${etiquetaMejorAsesor} de la quincena anterior`}>
            <div className="previous-fortnight-winner__icon" aria-hidden="true">🏆</div>
            <div className="previous-fortnight-winner__content" aria-live="polite">
                <p className="previous-fortnight-winner__eyebrow">{etiquetaMejorAsesor} de la quincena anterior · ¡Felicidades!</p>
                <div className="previous-fortnight-winner__name-row">
                    {ganadora && !cargando && !error && (
                        <span className="previous-fortnight-winner__avatar" aria-hidden="true">
                            {fotoGanadora ? <img src={fotoGanadora} alt="" /> : (
                                <svg viewBox="0 0 24 24" focusable="false">
                                    <circle cx="12" cy="8" r="4" fill="currentColor" />
                                    <path d="M4 21c.4-4.2 3.6-7 8-7s7.6 2.8 8 7H4Z" fill="currentColor" />
                                </svg>
                            )}
                        </span>
                    )}
                    <strong className="previous-fortnight-winner__name">{mensajeNombre}</strong>
                </div>
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
