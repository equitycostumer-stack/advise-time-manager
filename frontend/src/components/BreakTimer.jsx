import { useEffect, useState } from "react";

export default function BreakTimer({ estado, inicioEstado }) {

    // ==========================================
    // LÍMITE DEL BREAK
    // ==========================================

    const LIMITE_BREAK = 15 * 60;


    // ==========================================
    // ESTADOS
    // ==========================================

    const [segundosTranscurridos, setSegundosTranscurridos] =
        useState(0);

    const [excedido, setExcedido] =
        useState(false);


    // ==========================================
    // CONTADOR
    // ==========================================

    useEffect(() => {

        if (
            estado !== "☕ Break" ||
            !inicioEstado
        ) {

            setSegundosTranscurridos(0);
            setExcedido(false);

            return;

        }


        function actualizarTiempo() {

            const inicio =
                new Date(inicioEstado);

            const ahora =
                new Date();


            const diferencia =
                Math.floor(
                    (ahora.getTime() - inicio.getTime()) /
                    1000
                );


            const segundos =
                diferencia > 0
                    ? diferencia
                    : 0;


            setSegundosTranscurridos(
                segundos
            );


            if (
                segundos >= LIMITE_BREAK
            ) {

                setExcedido(true);

            } else {

                setExcedido(false);

            }

        }


        // Ejecutar inmediatamente
        actualizarTiempo();


        // Actualizar cada segundo
        const intervalo =
            setInterval(
                actualizarTiempo,
                1000
            );


        return () => {

            clearInterval(intervalo);

        };

    }, [estado, inicioEstado]);


    // ==========================================
    // SI NO ESTÁ EN BREAK
    // ==========================================

    if (
        estado !== "☕ Break"
    ) {

        return null;

    }


    // ==========================================
    // TIEMPO RESTANTE
    // ==========================================

    const segundosRestantes =
        Math.max(
            LIMITE_BREAK -
            segundosTranscurridos,
            0
        );


    // ==========================================
    // FORMATO DEL TIEMPO RESTANTE
    // ==========================================

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


    // ==========================================
    // TIEMPO TOTAL TRANSCURRIDO
    // ==========================================

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


    // ==========================================
    // RENDER
    // ==========================================

    return (

        <div
            style={{
                marginTop: "20px",
                padding: "25px",
                borderRadius: "15px",
                textAlign: "center",

                background: excedido
                    ? "#FDECEC"
                    : "#FFF7E6",

                border: excedido
                    ? "2px solid #DC3545"
                    : "2px solid #F39C12",

                transition:
                    "all 0.3s ease"
            }}
        >

            {/* ==================================
                TÍTULO
            ================================== */}

            <div
                style={{
                    fontSize: "17px",
                    fontWeight: "bold",

                    color: excedido
                        ? "#B02A37"
                        : "#9A6700"
                }}
            >

                {excedido

                    ? "🔴 BREAK EXCEDIDO"

                    : "☕ TIEMPO DE BREAK"

                }

            </div>


            {/* ==================================
                CONTADOR
            ================================== */}

            <div
                style={{
                    fontSize: "48px",
                    fontWeight: "bold",
                    marginTop: "10px",

                    color: excedido
                        ? "#DC3545"
                        : "#D68910"
                }}
            >

                {excedido

                    ? tiempoTranscurridoFormateado

                    : tiempoRestanteFormateado

                }

            </div>


            {/* ==================================
                INFORMACIÓN
            ================================== */}

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


            {/* ==================================
                LÍMITE
            ================================== */}

            <div
                style={{
                    marginTop: "10px",
                    fontSize: "13px",
                    color: "#777"
                }}
            >

                Límite permitido: <strong>15:00</strong>

            </div>


            {/* ==================================
                ALERTA VISUAL
            ================================== */}

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