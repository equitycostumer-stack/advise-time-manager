function fechaColombia(valor) {
    if (!valor) return "";
    const texto = String(valor).trim();
    const incluyeZona = /(?:Z|[+-]\d{2}:?\d{2})$/iu.test(texto);
    const fecha = new Date(incluyeZona ? texto : `${texto.replace(" ", "T")}-05:00`);
    if (Number.isNaN(fecha.getTime())) return texto.slice(0, 10);
    return new Intl.DateTimeFormat("en-CA", {
        timeZone: "America/Bogota",
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
    }).format(fecha);
}

function moneda(valor, config) {
    const simbolo = config?.simbolo_moneda || "$";
    return `${simbolo}${Number(valor || 0).toLocaleString("es-CO", { maximumFractionDigits: 0 })}`;
}

export default function InsigniasAsesor({ ventas = [], fila = {}, periodo = {}, config = {} }) {
    const ventasDelPeriodo = ventas.filter((venta) => {
        const fecha = fechaColombia(venta.fecha_hora);
        return venta.estado === "ACTIVA" && fecha >= periodo.inicio && fecha <= periodo.fin;
    });
    const cantidadVentas = ventasDelPeriodo.length;
    const recaudo = ventasDelPeriodo.reduce((total, venta) => total + Number(venta.recaudo || 0), 0);
    const diasConVentas = new Set(ventasDelPeriodo.map((venta) => fechaColombia(venta.fecha_hora)).filter(Boolean)).size;
    const metaVentas = Number(fila.meta_ventas || 0);
    const metaRecaudo = Number(fila.meta_recaudo || 0);
    const cumplioVentas = metaVentas > 0 && cantidadVentas >= metaVentas;
    const cumplioRecaudo = metaRecaudo > 0 && recaudo >= metaRecaudo;

    const insignias = [
        {
            icono: "🌱",
            titulo: "Primera venta",
            descripcion: "Registra una venta activa durante la quincena.",
            avance: cantidadVentas > 0 ? "Primer paso completado" : "Aún no hay ventas activas",
            desbloqueada: cantidadVentas >= 1
        },
        {
            icono: "🔥",
            titulo: "Ritmo constante",
            descripcion: "Vende en tres días distintos de esta quincena.",
            avance: `${Math.min(diasConVentas, 3)} de 3 días`,
            desbloqueada: diasConVentas >= 3
        },
        {
            icono: "⭐",
            titulo: "Cinco en el marcador",
            descripcion: "Alcanza cinco ventas activas en el periodo.",
            avance: `${Math.min(cantidadVentas, 5)} de 5 ventas`,
            desbloqueada: cantidadVentas >= 5
        },
        {
            icono: "🎯",
            titulo: "Meta de ventas",
            descripcion: metaVentas > 0 ? `Objetivo: ${metaVentas.toLocaleString("es-CO")} ventas.` : "Tu meta de ventas aún no está configurada.",
            avance: metaVentas > 0 ? `${Math.min(cantidadVentas, metaVentas).toLocaleString("es-CO")} de ${metaVentas.toLocaleString("es-CO")}` : "Pendiente de definir",
            desbloqueada: cumplioVentas
        },
        {
            icono: "📥",
            titulo: "Recaudo completo",
            descripcion: metaRecaudo > 0 ? `Objetivo: ${moneda(metaRecaudo, config)}.` : "Tu meta de recaudo aún no está configurada.",
            avance: metaRecaudo > 0 ? `${moneda(Math.min(recaudo, metaRecaudo), config)} de ${moneda(metaRecaudo, config)}` : "Pendiente de definir",
            desbloqueada: cumplioRecaudo
        },
        {
            icono: "🏆",
            titulo: "Doble logro",
            descripcion: "Completa tus metas de ventas y de recaudo.",
            avance: `${cumplioVentas ? "Ventas ✓" : "Ventas pendiente"} · ${cumplioRecaudo ? "Recaudo ✓" : "Recaudo pendiente"}`,
            desbloqueada: cumplioVentas && cumplioRecaudo
        }
    ];
    const desbloqueadas = insignias.filter((insignia) => insignia.desbloqueada).length;

    return (
        <section className="advisor-achievements" aria-labelledby="advisor-achievements-title">
            <div className="advisor-achievements-heading">
                <div>
                    <span className="achievement-eyebrow">LOGROS PERSONALES</span>
                    <h3 id="advisor-achievements-title">✨ Tus insignias de esta quincena</h3>
                    <p>Se actualizan con tus ventas activas; cada avance cuenta.</p>
                </div>
                <span className="achievement-total" aria-label={`${desbloqueadas} de ${insignias.length} insignias desbloqueadas`}>{desbloqueadas}/{insignias.length}</span>
            </div>
            <div className="advisor-achievements-grid">
                {insignias.map((insignia) => (
                    <article
                        className={`achievement-card ${insignia.desbloqueada ? "is-unlocked" : "is-locked"}`}
                        key={insignia.titulo}
                    >
                        <span className="achievement-card-icon" aria-hidden="true">{insignia.icono}</span>
                        <div className="achievement-card-copy">
                            <strong>{insignia.titulo}</strong>
                            <p>{insignia.descripcion}</p>
                            <small>{insignia.avance}</small>
                        </div>
                        <span className="achievement-card-state">{insignia.desbloqueada ? "DESBLOQUEADA" : "EN PROGRESO"}</span>
                    </article>
                ))}
            </div>
        </section>
    );
}
