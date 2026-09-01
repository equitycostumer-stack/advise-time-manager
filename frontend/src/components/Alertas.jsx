// ======================================================
// COMPONENTE ALERTAS
// ======================================================

export default function Alertas({ asesores = [], incidencias = [] }) {
    const alertas = [];

    // Las llegadas tarde salen de incidencias reales, no de campos antiguos del Dashboard.
    incidencias
        .filter((incidencia) => incidencia.tipo === "LLEGADA TARDE")
        .forEach((incidencia) => {
            const asesor = asesores.find((item) => Number(item.id) === Number(incidencia.asesor_id));
            const nombre = incidencia.nombre || incidencia.asesor_nombre || asesor?.nombre || `Asesor ${incidencia.asesor_id}`;
            alertas.push(`🔴 ${nombre} ${incidencia.detalle || "llegó tarde"}`);
        });

    asesores.forEach((asesor) => {
        if (!asesor.inicio_estado) return;

        const inicio = new Date(asesor.inicio_estado).getTime();
        const minutos = Number.isNaN(inicio) ? 0 : Math.max(0, Math.floor((Date.now() - inicio) / 60000));

        if (asesor.estado === "BREAK" && minutos > 15) {
            alertas.push(`☕ ${asesor.nombre} lleva ${minutos} minutos en Break`);
        }
        if (asesor.estado === "ALMUERZO" && minutos > 60) {
            alertas.push(`🍽️ ${asesor.nombre} lleva ${minutos} minutos en Almuerzo`);
        }
        if ((asesor.estado === "BANO" || asesor.estado === "BAÑO") && minutos > 10) {
            alertas.push(`🚻 ${asesor.nombre} lleva ${minutos} minutos en Baño`);
        }
        if ((asesor.estado === "CAPACITACION" || asesor.estado === "CAPACITACIÓN") && minutos > 90) {
            alertas.push(`📚 ${asesor.nombre} lleva ${minutos} minutos en Capacitación`);
        }
        if ((asesor.estado === "REUNION" || asesor.estado === "REUNIÓN") && minutos > 90) {
            alertas.push(`👥 ${asesor.nombre} lleva ${minutos} minutos en Reunión`);
        }
    });

    return (
        <div style={{ marginTop: 30, background: "#fff3cd", border: "2px solid #ffc107", borderRadius: 10, padding: 20 }}>
            <h2 style={{ color: "#dc3545", textAlign: "center", marginBottom: 15 }}>🚨 Alertas</h2>
            {alertas.length === 0 ? (
                <p style={{ textAlign: "center", margin: 0 }}>✅ No hay alertas activas.</p>
            ) : (
                <ul style={{ margin: 0, paddingLeft: 20 }}>
                    {alertas.map((alerta, index) => (
                        <li key={`${alerta}-${index}`} style={{ marginBottom: 8, color: "#dc3545", fontWeight: "bold" }}>
                            {alerta}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
