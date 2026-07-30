export default function Alertas({ asesores }) {

    const alertas = [];

    asesores.forEach((a) => {

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

        // CAPACITACIÓN
        if (a.estado === "CAPACITACION" && minutos > 90) {

            alertas.push(
                `🔴 ${a.nombre} lleva ${minutos} minutos en Capacitación`
            );

        }

        // REUNIÓN
        if (a.estado === "REUNION" && minutos > 90) {

            alertas.push(
                `🔴 ${a.nombre} lleva ${minutos} minutos en Reunión`
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

                alertas.length === 0

                    ? (

                        <p>🟢 No hay alertas por el momento.</p>

                    )

                    : (

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