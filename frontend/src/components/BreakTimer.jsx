import { useEffect, useState } from "react";

// ======================================================
// CONVERTIR FECHA MYSQL -> COLOMBIA
// ======================================================

function convertirFechaColombia(fecha) {

    if (!fecha) {
        return null;
    }

    if (fecha instanceof Date) {
        return fecha;
    }

    const valor =
        String(fecha).trim();

    if (!valor) {
        return null;
    }

    if (
        valor.endsWith("Z") ||
        /[+-]\d{2}:\d{2}$/.test(valor)
    ) {

        const fechaConvertida =
            new Date(valor);

        return Number.isNaN(
            fechaConvertida.getTime()
        )
            ? null
            : fechaConvertida;
    }

    const fechaConvertida =
        new Date(
            valor.replace(" ", "T") +
            "-05:00"
        );

    return Number.isNaN(
        fechaConvertida.getTime()
    )
        ? null
        : fechaConvertida;
}

// ======================================================
// BREAK TIMER
// ======================================================

export default function BreakTimer({
    estado,
    inicioEstado
}) {

    const LIMITE_BREAK =
        15 * 60;

    const [
        segundosTranscurridos,
        setSegundosTranscurridos
    ] = useState(0);

    const [
        excedido,
        setExcedido
    ] = useState(false);

    // ==================================================
    // CONTADOR
    // ==================================================

    useEffect(() => {

        if (
            estado !== "☕ Break" ||
            !inicioEstado
        ) {

            setSegundosTranscurridos(0);
            setExcedido(false);

            return;

        }

        const inicio =
            convertirFechaColombia(
                inicioEstado
            );

        if (!inicio) {

            console.error(
                "❌ BreakTimer: fecha inválida:",
                inicioEstado
            );

            setSegundosTranscurridos(0);
            setExcedido(false);

            return;

        }

        console.log(
            "☕ BreakTimer INICIO:",
            inicio.toISOString()
        );

        function actualizarTiempo() {

            const ahora =
                new Date();

            const diferencia =
                Math.floor(
                    (
                        ahora.getTime() -
                        inicio.getTime()
                    ) / 1000
                );

            const segundos =
                Math.max(
                    diferencia,
                    0
                );

            setSegundosTranscurridos(
                segundos
            );

            setExcedido(
                segundos >=
                LIMITE_BREAK
            );

        }

        actualizarTiempo();

        const intervalo =
            setInterval(
                actualizarTiempo,
                1000
            );

        return () => {

            clearInterval(
                intervalo
            );

        };

    }, [
        estado,
        inicioEstado
    ]);

    // ==================================================
    // NO ESTÁ EN BREAK
    // ==================================================

    if (
        estado !== "☕ Break"
    ) {

        return null;

    }

    // ==================================================
    // TIEMPO RESTANTE
    // ==================================================

    const segundosRestantes =
        Math.max(
            LIMITE_BREAK -
            segundosTranscurridos,
            0
        );

    // ==================================================
    // FORMATO RESTANTE
    // ==================================================

    const minutosRestantes =
        Math.floor(
            segundosRestantes / 60
        );

    const segundosRestantesFinal =
        segundosRestantes % 60;

    const tiempoRestanteFormateado =
        `${String(
            minutosRestantes
        ).padStart(2, "0")}:` +
        `${String(
            segundosRestantesFinal
        ).padStart(2, "0")}`;

    // ==================================================
    // TIEMPO TOTAL
    // ==================================================

    const minutosTranscurridos =
        Math.floor(
            segundosTranscurridos / 60
        );

    const segundosTranscurridosFinal =
        segundosTranscurridos % 60;

    const tiempoTranscurridoFormateado =
        `${String(
            minutosTranscurridos
        ).padStart(2, "0")}:` +
        `${String(
            segundosTranscurridosFinal
        ).padStart(2, "0")}`;

    // ==================================================
    // INTERFAZ
    // ==================================================

    return (

        <div
            style={{
                marginTop: "20px",
                padding: "25px",
                borderRadius: "15px",
                textAlign: "center",

                background:
                    excedido
                        ? "#FDECEC"
                        : "#FFF7E6",

                border:
                    excedido
                        ? "2px solid #DC3545"
                        : "2px solid #F39C12",

                transition:
                    "all 0.3s ease"
            }}
        >

            <div
                style={{
                    fontSize: "17px",
                    fontWeight: "bold",

                    color:
                        excedido
                            ? "#B02A37"
                            : "#9A6700"
                }}
            >

                {excedido
                    ? "🔴 BREAK EXCEDIDO"
                    : "☕ TIEMPO DE BREAK"
                }

            </div>

            <div
                style={{
                    fontSize: "48px",
                    fontWeight: "bold",
                    marginTop: "10px",

                    color:
                        excedido
                            ? "#DC3545"
                            : "#D68910"
                }}
            >

                {excedido
                    ? tiempoTranscurridoFormateado
                    : tiempoRestanteFormateado
                }

            </div>

            <div
                style={{
                    marginTop: "8px",
                    fontSize: "14px",
                    color: "#666"
                }}
            >

                {excedido
                    ? "Tiempo total de Break"
                    : "Tiempo restante de tu descanso"
                }

            </div>

            <div
                style={{
                    marginTop: "10px",
                    fontSize: "13px",
                    color: "#777"
                }}
            >

                Límite permitido:
                <strong> 15:00</strong>

            </div>

            {excedido && (

                <div
                    style={{
                        marginTop: "15px",
                        padding: "12px",
                        borderRadius: "10px",
                        background: "#F8D7DA",
                        color: "#842029",
                        fontWeight: "bold"
                    }}
                >

                    ⚠️ Has superado el tiempo
                    permitido de Break.

                </div>

            )}

        </div>

    );

}