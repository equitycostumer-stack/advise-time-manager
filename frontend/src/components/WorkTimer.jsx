import { useEffect, useState } from "react";

export default function WorkTimer({
    estado,
    inicioJornada
}) {

    const [segundos, setSegundos] = useState(0);


    // ==========================================
    // CONTADOR DE JORNADA
    // ==========================================

    useEffect(() => {

        // Si no existe jornada, reiniciar contador
        if (!inicioJornada) {

            setSegundos(0);

            return;

        }


        function actualizarTiempo() {

            const inicio =
                new Date(inicioJornada);

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
                diferencia > 0
                    ? diferencia
                    : 0
            );

        }


        // Actualizar inmediatamente
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

    }, [inicioJornada]);


    // ==========================================
    // CONVERTIR SEGUNDOS A HH:MM:SS
    // ==========================================

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


    // ==========================================
    // NO MOSTRAR CONTADOR SI NO HAY JORNADA
    // ==========================================

    if (
        !inicioJornada ||
        estado === "Disponible" ||
        estado === "🔴 Salida"
    ) {

        return null;

    }


    // ==========================================
    // INTERFAZ
    // ==========================================

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
                    marginTop: "8px"
                }}
            >

                {convertirTiempo(segundos)}

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