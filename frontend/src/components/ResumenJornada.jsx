// ======================================================
// EQUITY LINE PROFESSIONAL SERVICES
// RESUMEN DE JORNADA
// ======================================================

function formatearTiempo(ms = 0) {

    if (!ms || ms <= 0) return "00:00:00";

    const total = Math.floor(ms / 1000);

    const horas = String(Math.floor(total / 3600)).padStart(2, "0");
    const minutos = String(Math.floor((total % 3600) / 60)).padStart(2, "0");
    const segundos = String(total % 60).padStart(2, "0");

    return `${horas}:${minutos}:${segundos}`;

}

function formatearHora(fecha) {

    if (!fecha) return "--";

    return new Date(fecha).toLocaleTimeString("es-CO", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit"
    });

}

function fila(nombre, valor) {

    return (

        <div
            style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "10px 0",
                borderBottom: "1px solid #ececec"
            }}
        >

            <span>{nombre}</span>

            <strong>{valor}</strong>

        </div>

    );

}

export default function ResumenJornada({ resumen, asesor }) {

    if (!resumen) return null;

    return (

        <div
            style={{
                marginTop: 20,
                padding: 22,
                borderRadius: 12,
                background: "#fff",
                border: "1px solid #ddd",
                boxShadow: "0 2px 8px rgba(0,0,0,.08)"
            }}
        >

            <h2
                style={{
                    textAlign: "center",
                    marginBottom: 20
                }}
            >
                📊 RESUMEN DE JORNADA
            </h2>

            {fila(
                "👤 Asesor",
                asesor
                    ? asesor.nombre
                    : `ID ${resumen.asesor_id}`
            )}

            {fila(
                "🟢 Hora entrada",
                formatearHora(resumen.hora_entrada)
            )}

            {fila(
                "🔴 Hora salida",
                resumen.hora_salida
                    ? formatearHora(resumen.hora_salida)
                    : "Jornada activa"
            )}

            {fila(
                "⏱ Tiempo trabajado",
                formatearTiempo(resumen.tiempo_trabajado)
            )}

            {fila(
                "☕ Break",
                formatearTiempo(resumen.tiempo_break)
            )}

            {fila(
                "🍽 Almuerzo",
                formatearTiempo(resumen.tiempo_almuerzo)
            )}

            {fila(
                "🚻 Baño",
                formatearTiempo(resumen.tiempo_bano)
            )}

            {fila(
                "📚 Capacitación",
                formatearTiempo(resumen.tiempo_capacitacion)
            )}

            {fila(
                "👥 Reunión",
                formatearTiempo(resumen.tiempo_reunion)
            )}

            {fila(
                "⏰ Llegó tarde",
                resumen.llego_tarde ? "Sí" : "No"
            )}

            {fila(
                "⌛ Minutos retraso",
                resumen.minutos_retraso ?? 0
            )}

            <div
                style={{
                    marginTop: 18,
                    paddingTop: 18,
                    borderTop: "2px solid #ddd",
                    display: "flex",
                    justifyContent: "space-between",
                    fontWeight: "bold",
                    fontSize: 18,
                    color: "#0b6b3a"
                }}
            >

                <span>💼 Tiempo productivo</span>

                <span>
                    {formatearTiempo(resumen.tiempo_productivo)}
                </span>

            </div>

        </div>

    );

}