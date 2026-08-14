// ======================================================
// COMPONENTE ALERTAS
// ======================================================

export default function Alertas({ asesores = [] }) {

    const alertas = [];

    asesores.forEach((a) => {

        // ==============================================
        // LLEGADA TARDE
        // ==============================================

        if (
            a.llego_tarde === true ||
            a.llego_tarde === 1
        ) {

            const minutosRetraso =
                Number(a.minutos_retraso) || 0;

            alertas.push(
                `🔴 ${a.nombre} llegó tarde por ${minutosRetraso} minutos`
            );

        }

        // ==============================================
        // SI NO TIENE ESTADO, NO CONTINUAR
        // ==============================================

        if (!a.inicio_estado) {
            return;
        }

        const minutos = Math.floor(
            (
                Date.now() -
                new Date(a.inicio_estado).getTime()
            ) / 60000
        );

        // ==============================================
        // BREAK
        // ==============================================

        if (
            a.estado === "BREAK" &&
            minutos > 15
        ) {

            alertas.push(
                `☕ ${a.nombre} lleva ${minutos} minutos en Break`
            );

        }

        // ==============================================
        // ALMUERZO
        // ==============================================

        if (
            a.estado === "ALMUERZO" &&
            minutos > 60
        ) {

            alertas.push(
                `🍽️ ${a.nombre} lleva ${minutos} minutos en Almuerzo`
            );

        }

        // ==============================================
        // BAÑO
        // ==============================================

        if (
            a.estado === "BANO" ||
            a.estado === "BAÑO"
        ) {

            if (minutos > 10) {

                alertas.push(
                    `🚻 ${a.nombre} lleva ${minutos} minutos en Baño`
                );

            }

        }

        // ==============================================
        // CAPACITACIÓN
        // ==============================================

        if (
            a.estado === "CAPACITACION" ||
            a.estado === "CAPACITACIÓN"
        ) {

            if (minutos > 90) {

                alertas.push(
                    `📚 ${a.nombre} lleva ${minutos} minutos en Capacitación`
                );

            }

        }

        // ==============================================
        // REUNIÓN
        // ==============================================

        if (
            a.estado === "REUNION" ||
            a.estado === "REUNIÓN"
        ) {

            if (minutos > 90) {

                alertas.push(
                    `👥 ${a.nombre} lleva ${minutos} minutos en Reunión`
                );

            }

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

            <h2
                style={{
                    color: "#dc3545",
                    textAlign: "center",
                    marginBottom: 15
                }}
            >
                🚨 Alertas
            </h2>

            {
                alertas.length === 0 ? (

                    <p
                        style={{
                            textAlign: "center",
                            margin: 0
                        }}
                    >
                        ✅ No hay alertas activas.
                    </p>

                ) : (

                    <ul
                        style={{
                            margin: 0,
                            paddingLeft: 20
                        }}
                    >

                        {
                            alertas.map(
                                (alerta, index) => (

                                    <li
                                        key={index}
                                        style={{
                                            marginBottom: 8,
                                            color: "#dc3545",
                                            fontWeight: "bold"
                                        }}
                                    >
                                        {alerta}
                                    </li>

                                )
                            )
                        }

                    </ul>

                )
            }

        </div>

    );

}