const ZONA_HORARIA = "America/Bogota";

function normalizar(estado) {
    return String(estado || "Disponible")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/^[^\p{L}\p{N}]+/u, "")
        .trim()
        .toUpperCase();
}

function obtenerPresentacionEstado(estado, hayAsesor) {
    if (!hayAsesor) {
        return { clase: "neutral", etiqueta: "Selecciona un asesor", icono: "👤", mensaje: "Elige tu perfil para ver el resumen y la actividad de hoy." };
    }

    const valor = normalizar(estado);
    if (valor.includes("SALIDA") || valor.includes("FINALIZ")) {
        return { clase: "offline", etiqueta: "Jornada finalizada", icono: "🏁", mensaje: "Tu resumen del día queda disponible para que revises tus resultados." };
    }
    if (["BREAK", "ALMUERZO", "BANO", "CAPACITACION", "REUNION", "PAUSA"].some((tipo) => valor.includes(tipo))) {
        const detalle = String(estado || "En pausa").replace(/^[^\p{L}\p{N}]+/u, "").trim();
        return { clase: "pause", etiqueta: `En pausa · ${detalle}`, icono: "☕", mensaje: "Cuando regreses, registra el fin de la pausa para mantener tu jornada al día." };
    }
    if (valor.includes("TRABAJANDO")) {
        return { clase: "working", etiqueta: "En jornada", icono: "⚡", mensaje: "Mantén el ritmo: registra tus movimientos y ventas cuando ocurran." };
    }
    return { clase: "available", etiqueta: "Disponible", icono: "🟢", mensaje: "Tu jornada aún no aparece iniciada. Registra tu entrada para comenzar el seguimiento." };
}

function obtenerSaludo() {
    const hora = Number(new Intl.DateTimeFormat("es-CO", {
        timeZone: ZONA_HORARIA,
        hour: "2-digit",
        hourCycle: "h23"
    }).format(new Date()));
    if (hora < 12) return "Buenos días";
    if (hora < 18) return "Buenas tardes";
    return "Buenas noches";
}

function formatearTiempo(segundos) {
    const total = Math.max(0, Number(segundos) || 0);
    const horas = Math.floor(total / 3600);
    const minutos = Math.floor((total % 3600) / 60);
    const restantes = total % 60;
    return [horas, minutos, restantes].map((valor) => String(valor).padStart(2, "0")).join(":");
}

function formatearMoneda(valor) {
    return new Intl.NumberFormat("es-CO", {
        style: "currency",
        currency: "COP",
        maximumFractionDigits: 0
    }).format(Number(valor) || 0);
}

export default function PanelMiDia({ asesorNombre, estado, resumen, tiempoJornada = 0 }) {
    const nombre = String(asesorNombre || "").trim();
    const ventas = Array.isArray(resumen?.ventas)
        ? resumen.ventas.filter((venta) => String(venta.estado || "ACTIVA").toUpperCase() === "ACTIVA")
        : [];
    const movimientos = Array.isArray(resumen?.movimientos) ? resumen.movimientos : [];
    const vendido = ventas.reduce((total, venta) => total + Number(venta.valor || 0), 0);
    const recaudo = ventas.reduce((total, venta) => total + Number(venta.recaudo || 0), 0);
    const presentacion = obtenerPresentacionEstado(estado, Boolean(nombre));

    const metricas = [
        { icono: "⏱️", etiqueta: "Tiempo trabajado", valor: formatearTiempo(tiempoJornada), clase: "time" },
        { icono: "💰", etiqueta: "Ventas activas", valor: ventas.length, clase: "count" },
        { icono: "💵", etiqueta: "Total vendido", valor: formatearMoneda(vendido), clase: "money" },
        { icono: "📥", etiqueta: "Recaudo", valor: formatearMoneda(recaudo), clase: "money" },
        { icono: "🕘", etiqueta: "Movimientos", valor: movimientos.length, clase: "count" }
    ];

    return (
        <section className="mi-dia-panel" aria-labelledby="mi-dia-heading">
            <div className="mi-dia-header">
                <div>
                    <span className="mi-dia-eyebrow">TU RESUMEN PERSONAL</span>
                    <h2 id="mi-dia-heading">{obtenerSaludo()}{nombre ? `, ${nombre}` : ""}</h2>
                    <p>Así va tu jornada de hoy, en un solo lugar.</p>
                </div>
                <div className={`mi-dia-status mi-dia-status--${presentacion.clase}`}>
                    <span aria-hidden="true">{presentacion.icono}</span>
                    <strong>{presentacion.etiqueta}</strong>
                </div>
            </div>
            <div className="mi-dia-metrics" aria-label="Indicadores personales de hoy">
                {metricas.map((metrica) => (
                    <article key={metrica.etiqueta} className={`mi-dia-metric mi-dia-metric--${metrica.clase}`}>
                        <span className="mi-dia-metric-label"><span aria-hidden="true">{metrica.icono}</span>{metrica.etiqueta}</span>
                        <strong>{metrica.valor}</strong>
                    </article>
                ))}
            </div>
            <p className="mi-dia-guidance"><span aria-hidden="true">💡</span>{presentacion.mensaje}</p>
        </section>
    );
}
