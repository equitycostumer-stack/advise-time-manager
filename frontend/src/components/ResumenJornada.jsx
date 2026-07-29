function fila(nombre, valor) {
    return (
        <div
            style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "8px 0",
                borderBottom: "1px solid #eee"
            }}
        >
            <span>{nombre}</span>
            <strong>{valor}</strong>
        </div>
    );
}

export default function ResumenJornada({ resumen }) {

    if (!resumen) {
        return null;
    }

    return (

        <div
            style={{
                marginTop: "20px",
                padding: "20px",
                borderRadius: "12px",
                background: "#ffffff",
                border: "1px solid #ddd",
                boxShadow: "0 2px 8px rgba(0,0,0,.08)"
            }}
        >

            <h2
                style={{
                    textAlign: "center",
                    marginBottom: "20px"
                }}
            >
                📊 RESUMEN DE JORNADA
            </h2>

            {fila("⏱ Jornada laboral", resumen.jornada_total)}

            {fila("☕ Break", resumen.break_total)}

            {fila("🍽 Almuerzo", resumen.almuerzo_total)}

            {fila("🚻 Baño", resumen.bano_total)}

            {fila("📚 Capacitación", resumen.capacitacion_total)}

            {fila("👥 Reunión", resumen.reunion_total)}

            <div
                style={{
                    marginTop: "18px",
                    paddingTop: "15px",
                    borderTop: "2px solid #ddd",
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: "18px",
                    fontWeight: "bold"
                }}
            >
                <span>💼 Tiempo productivo</span>
                <span>{resumen.tiempo_productivo}</span>
            </div>

            {/* ======================================= */}
            {/* JORNADA OFICIAL */}
            {/* ======================================= */}

            {resumen.horario_oficial && (

                <>

                    <h3
                        style={{
                            marginTop: "25px",
                            textAlign: "center"
                        }}
                    >
                        📅 Comparación con la jornada oficial
                    </h3>

                    {fila(
                        "Horario oficial",
                        `${resumen.horario_oficial.nombre} (${resumen.horario_oficial.inicio} - ${resumen.horario_oficial.fin})`
                    )}

                    {fila(
                        "Tiempo esperado",
                        resumen.tiempo_esperado
                    )}

                    {fila(
                        resumen.cumplio_jornada
                            ? "Tiempo adicional"
                            : "Tiempo pendiente",
                        resumen.diferencia
                    )}

                    <div
                        style={{
                            marginTop: "15px",
                            padding: "15px",
                            borderRadius: "10px",
                            textAlign: "center",
                            fontWeight: "bold",
                            background: resumen.cumplio_jornada
                                ? "#d4edda"
                                : "#fff3cd",
                            color: resumen.cumplio_jornada
                                ? "#155724"
                                : "#856404"
                        }}
                    >
                        {resumen.cumplio_jornada
                            ? "✅ Jornada laboral cumplida"
                            : "⚠️ Jornada laboral incompleta"}
                    </div>

                </>

            )}

        </div>

    );

}