export default function Alertas({ asesores }) {

    const alertas = [];
const ahora = new Date();

const dia = ahora.getDay(); // 0=Domingo, 1=Lunes...

const horaActual =
    ahora.getHours() * 60 + ahora.getMinutes();

// Hora límite según el día
let horaEntrada = null;

// Lunes a Jueves
if (dia >= 1 && dia <= 4) {

    horaEntrada = 10 * 60;

}

// Viernes
if (dia === 5) {

    horaEntrada = 11 * 60;

}

// Sábado
if (dia === 6) {

    // Por ahora asumimos que este sábado no se trabaja.
    // Luego lo conectaremos con un calendario.
    horaEntrada = 9 * 60;

}
    asesores.forEach((a) => {
// Llegó tarde (calculado por el backend)

if (a.llego_tarde) {

    alertas.push(

        `🔴 ${a.nombre} llegó ${a.minutos_retraso} minuto${a.minutos_retraso === 1 ? "" : "s"} tarde.`

    );

}
        if (!a.inicio_estado) return;

        const minutos = Math.floor(
            (Date.now() - new Date(a.inicio_estado).getTime()) / 60000
        );

        // BREAK
        if (a.estado === "BREAK" && minutos > 15) {

            alertas.push(
                `🔴 ${a.nombre} lleva ${minutos} minutos en Break`
            );

        }

        // ALMUERZO
        if (a.estado === "ALMUERZO" && minutos > 60) {

            alertas.push(
                `🔴 ${a.nombre} lleva ${minutos} minutos en Almuerzo`
            );

        }

        // BAÑO
        if (a.estado === "BANO" && minutos > 10) {

            alertas.push(
                `🔴 ${a.nombre} lleva ${minutos} minutos en Baño`
            );

        }

    });

    return (

        <div
            style={{
                marginTop: 30,
                background: "#fff3cd",
                border: "2px solid #ffc107",
                borderRadius: 10,
                padding: 20
            }}
        >

            <h2>🚨 Alertas</h2>

            {

                alertas.length === 0 ?

                    (

                        <p>🟢 No hay alertas por el momento.</p>

                    )

                    :

                    (

                        alertas.map((a, i) => (

                            <p
                                key={i}
                                style={{
                                    color: "#dc3545",
                                    fontWeight: "bold"
                                }}
                            >
                                {a}
                            </p>

                        ))

                    )

            }

        </div>

    );

}