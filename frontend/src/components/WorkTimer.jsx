import { useEffect, useState } from "react";

// ======================================================
// EQUITY LINE PROFESSIONAL SERVICES
// TIME MANAGER
// CRONÓMETRO DE JORNADA
// ======================================================

export default function WorkTimer({
    estado,
    inicioJornada
}) {

    const [segundos, setSegundos] = useState(0);

    // ==================================================
    // CONVERTIR SEGUNDOS A HH:MM:SS
    // ==================================================

    function convertirTiempo(totalSegundos) {

        const horas =
            Math.floor(
                totalSegundos / 3600
            );

        const minutos =
            Math.floor(
                (totalSegundos % 3600) / 60
            );

        const segundosRestantes =
            totalSegundos % 60;

        return [

            horas,
            minutos,
            segundosRestantes

        ]
            .map(numero =>
                String(numero).padStart(2, "0")
            )
            .join(":");

    }

    // ==================================================
    // CALCULAR TIEMPO REAL
    // ==================================================

    useEffect(() => {

        // ------------------------------------------------
        // SI NO HAY INICIO
        // ------------------------------------------------

        if (!inicioJornada) {

            setSegundos(0);

            return;

        }

        // ------------------------------------------------
        // CREAR FECHA
        // ------------------------------------------------

        const inicio =
            new Date(inicioJornada);

        // ------------------------------------------------
        // VALIDAR FECHA
        // ------------------------------------------------

        if (
            Number.isNaN(
                inicio.getTime()
            )
        ) {

            console.error(
                "❌ WorkTimer: fecha inválida:",
                inicioJornada
            );

            setSegundos(0);

            return;

        }

        // ------------------------------------------------
        // ACTUALIZAR
        // ------------------------------------------------

        const actualizarTiempo = () => {

            const ahora =
                new Date();

            const diferencia =
                Math.floor(
                    (
                        ahora.getTime() -
                        inicio.getTime()
                    ) / 1000
                );

            setSegundos(
                Math.max(
                    diferencia,
                    0
                )
            );

        };

        // ------------------------------------------------
        // EJECUTAR INMEDIATAMENTE
        // ------------------------------------------------

        actualizarTiempo();

        // ------------------------------------------------
        // ACTUALIZAR CADA SEGUNDO
        // ------------------------------------------------

        const intervalo =
            setInterval(
                actualizarTiempo,
                1000
            );

        // ------------------------------------------------
        // LIMPIAR
        // ------------------------------------------------

        return () => {

            clearInterval(
                intervalo
            );

        };

    }, [inicioJornada]);

    // ==================================================
    // NO MOSTRAR SI NO HAY JORNADA
    // ==================================================

    if (

        !inicioJornada ||

        estado === "Disponible" ||

        estado === "🔴 Salida"

    ) {

        return null;

    }

    // ==================================================
    // TIEMPO FORMATEADO
    // ==================================================

    const tiempoFormateado =
        convertirTiempo(segundos);

    // ==================================================
    // INTERFAZ
    // ==================================================

    return (

        <div
            style={{
                marginTop: "25px",
                padding: "25px",
                borderRadius: "15px",
                background: "#EAF7EF",
                border: "2px solid #27AE60",
                textAlign: "center"
            }}
        >

            {/* ==========================================
                TÍTULO
            ========================================== */}

            <div
                style={{
                    fontSize: "16px",
                    color: "#26734D",
                    fontWeight: "bold"
                }}
            >

                ⏱ TIEMPO DE JORNADA

            </div>

            {/* ==========================================
                CRONÓMETRO
            ========================================== */}

            <div
                style={{
                    fontSize: "42px",
                    fontWeight: "bold",
                    color: "#1B7F46",
                    marginTop: "8px",
                    fontVariantNumeric:
                        "tabular-nums"
                }}
            >

                {tiempoFormateado}

            </div>

            {/* ==========================================
                DESCRIPCIÓN
            ========================================== */}

            <div
                style={{
                    fontSize: "14px",
                    color: "#666",
                    marginTop: "8px"
                }}
            >

                Tiempo desde la entrada

            </div>

        </div>

    );

}