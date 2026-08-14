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

    // Si ya tiene zona horaria, respetarla
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

    // DATETIME de MySQL
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
// CRONÓMETRO DE JORNADA
// ======================================================

export default function WorkTimer({
    estado,
    inicioJornada
}) {

    const [segundos, setSegundos] =
        useState(0);

    // ==================================================
    // FORMATO
    // ==================================================

    function convertirTiempo(
        totalSegundos
    ) {

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
            .map(
                numero =>
                    String(numero)
                        .padStart(2, "0")
            )
            .join(":");

    }

    // ==================================================
    // CRONÓMETRO
    // ==================================================

    useEffect(() => {

        if (!inicioJornada) {

            setSegundos(0);

            return;

        }

        const inicio =
            convertirFechaColombia(
                inicioJornada
            );

        if (!inicio) {

            console.error(
                "❌ WorkTimer: fecha inválida:",
                inicioJornada
            );

            setSegundos(0);

            return;

        }

        console.log(
            "⏱ WorkTimer INICIO:",
            inicio.toISOString()
        );

        const actualizarTiempo =
            () => {

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

    }, [inicioJornada]);

    // ==================================================
    // NO MOSTRAR
    // ==================================================

    if (

        !inicioJornada ||

        estado === "Disponible" ||

        estado === "🔴 Salida"

    ) {

        return null;

    }

    const tiempoFormateado =
        convertirTiempo(
            segundos
        );

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

            <div
                style={{
                    fontSize: "16px",
                    color: "#26734D",
                    fontWeight: "bold"
                }}
            >

                ⏱ TIEMPO DE JORNADA

            </div>

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