import api from "../services/api";

export default function Buttons({
    asesor,
    estado,
    setEstado,
    setResumen,
    onMovimientoRegistrado
}) {

    async function registrar(tipo, nuevoEstado) {

        if (!asesor) {
            alert("Seleccione un asesor.");
            return;
        }

        console.log("=================================");
        console.log("REGISTRANDO MOVIMIENTO");
        console.log("Asesor:", asesor);
        console.log("Estado actual:", estado);
        console.log("Movimiento:", tipo);
        console.log("=================================");

        try {

            const respuesta = await api.post(
                "/movimientos",
                {
                    asesor_id: Number(asesor),
                    tipo
                }
            );

            console.log("RESPUESTA BACKEND:", respuesta.data);
            console.log(
    JSON.stringify(
        respuesta.data,
        null,
        2
    )
);

            if (!respuesta.data?.ok) {

                alert(
                    respuesta.data?.error ||
                    "No fue posible registrar el movimiento."
                );

                return;

            }

            // ==========================================
            // ACTUALIZAR RESUMEN
            // ==========================================

            if (
                tipo === "SALIDA" &&
                respuesta.data.resumen &&
                setResumen
            ) {

                setResumen(respuesta.data.resumen);

            }

            if (
                tipo === "ENTRADA" &&
                setResumen
            ) {

                setResumen(null);

            }

            // ==========================================
            // ACTUALIZAR ESTADO VISUAL
            // ==========================================

            setEstado(nuevoEstado);

            // ==========================================
            // VOLVER A CONSULTAR BACKEND
            // ==========================================

            if (onMovimientoRegistrado) {

                await onMovimientoRegistrado();

            }

        } catch (error) {

            console.error(
                "ERROR REGISTRANDO MOVIMIENTO:",
                error
            );

            console.error(
                "RESPUESTA DEL SERVIDOR:",
                error.response?.data
            );

            alert(
                error.response?.data?.error ||
                "No fue posible registrar el movimiento."
            );

        }

    }

    function estilo(color) {

        return {

            background: color,
            color: "#fff",
            border: "none",
            borderRadius: "10px",
            padding: "15px",
            fontSize: "18px",
            fontWeight: "bold",
            cursor: "pointer"

        };

    }

    const trabajando =
        estado === "🟢 Trabajando";

    const enBreak =
        estado === "☕ Break";

    const enAlmuerzo =
        estado === "🍽 Almuerzo";

    const enBano =
        estado === "🚻 Baño";

    const enCapacitacion =
        estado === "📚 Capacitación";

    const enReunion =
        estado === "👥 Reunión";

    // Permitir ENTRADA cuando está disponible o ya salió
    const disponible = [
        "Disponible",
        "🔴 Salida"
    ].includes(estado);

    return (

        <div className="grid">

            <button
                style={estilo("#0B5ED7")}
                disabled={!disponible}
                onClick={() =>
                    registrar(
                        "ENTRADA",
                        "🟢 Trabajando"
                    )
                }
            >
                🟢 ENTRADA
            </button>

            <button
                style={estilo("#F39C12")}
                disabled={
                    !trabajando &&
                    !enBreak
                }
                onClick={() => {

                    if (enBreak) {

                        registrar(
                            "BREAK_FIN",
                            "🟢 Trabajando"
                        );

                    } else {

                        registrar(
                            "BREAK_INICIO",
                            "☕ Break"
                        );

                    }

                }}
            >
                {
                    enBreak
                        ? "▶ REGRESO BREAK"
                        : "☕ BREAK"
                }
            </button>

            <button
                style={estilo("#27AE60")}
                disabled={
                    !trabajando &&
                    !enAlmuerzo
                }
                onClick={() => {

                    if (enAlmuerzo) {

                        registrar(
                            "ALMUERZO_FIN",
                            "🟢 Trabajando"
                        );

                    } else {

                        registrar(
                            "ALMUERZO_INICIO",
                            "🍽 Almuerzo"
                        );

                    }

                }}
            >
                {
                    enAlmuerzo
                        ? "▶ REGRESO ALMUERZO"
                        : "🍽 ALMUERZO"
                }
            </button>

            <button
                style={estilo("#17A2B8")}
                disabled={
                    !trabajando &&
                    !enBano
                }
                onClick={() => {

                    if (enBano) {

                        registrar(
                            "BANO_FIN",
                            "🟢 Trabajando"
                        );

                    } else {

                        registrar(
                            "BANO_INICIO",
                            "🚻 Baño"
                        );

                    }

                }}
            >
                {
                    enBano
                        ? "▶ REGRESO BAÑO"
                        : "🚻 BAÑO"
                }
            </button>

            <button
                style={estilo("#6F42C1")}
                disabled={
                    !trabajando &&
                    !enCapacitacion
                }
                onClick={() => {

                    if (enCapacitacion) {

                        registrar(
                            "CAPACITACION_FIN",
                            "🟢 Trabajando"
                        );

                    } else {

                        registrar(
                            "CAPACITACION_INICIO",
                            "📚 Capacitación"
                        );

                    }

                }}
            >
                {
                    enCapacitacion
                        ? "▶ REGRESO CAPACITACIÓN"
                        : "📚 CAPACITACIÓN"
                }
            </button>

            <button
                style={estilo("#20C997")}
                disabled={
                    !trabajando &&
                    !enReunion
                }
                onClick={() => {

                    if (enReunion) {

                        registrar(
                            "REUNION_FIN",
                            "🟢 Trabajando"
                        );

                    } else {

                        registrar(
                            "REUNION_INICIO",
                            "👥 Reunión"
                        );

                    }

                }}
            >
                {
                    enReunion
                        ? "▶ REGRESO REUNIÓN"
                        : "👥 REUNIÓN"
                }
            </button>

            <button
                style={estilo("#DC3545")}
                disabled={!trabajando}
                onClick={() =>
                    registrar(
                        "SALIDA",
                        "🔴 Salida"
                    )
                }
            >
                🔴 SALIDA
            </button>

        </div>

    );

}