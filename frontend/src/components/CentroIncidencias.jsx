export default function CentroIncidencias({ asesores }) {

    const incidencias = [];

    asesores.forEach((a) => {

        // Llegó tarde
        if (a.llego_tarde) {

            incidencias.push({

                asesor: a.nombre,

                tipo: "Llegó tarde",

                detalle: `${a.minutos_retraso} minutos de retraso`,

                nivel: "ALTA"

            });

        }

        // Break excedido
        if (

            a.estado === "BREAK" &&

            a.inicio_estado

        ) {

            const minutos = Math.floor(

                (Date.now() -

                    new Date(a.inicio_estado).getTime()) /

                60000

            );

            if (minutos > 15) {

                incidencias.push({

                    asesor: a.nombre,

                    tipo: "Break excedido",

                    detalle: `${minutos} minutos`,

                    nivel: "MEDIA"

                });

            }

        }

        // Almuerzo excedido
        if (

            a.estado === "ALMUERZO" &&

            a.inicio_estado

        ) {

            const minutos = Math.floor(

                (Date.now() -

                    new Date(a.inicio_estado).getTime()) /

                60000

            );

            if (minutos > 60) {

                incidencias.push({

                    asesor: a.nombre,

                    tipo: "Almuerzo excedido",

                    detalle: `${minutos} minutos`,

                    nivel: "MEDIA"

                });

            }

        }

        // Baño excedido
        if (

            a.estado === "BANO" &&

            a.inicio_estado

        ) {

            const minutos = Math.floor(

                (Date.now() -

                    new Date(a.inicio_estado).getTime()) /

                60000

            );

            if (minutos > 10) {

                incidencias.push({

                    asesor: a.nombre,

                    tipo: "Baño excedido",

                    detalle: `${minutos} minutos`,

                    nivel: "BAJA"

                });

            }

        }

    });

    return (

        <div

            style={{

                marginTop: 40,

                background: "#fff",

                borderRadius: 10,

                padding: 20,

                border: "2px solid #dc3545"

            }}

        >

            <h2>

                🚨 Centro de Incidencias

            </h2>

            {

                incidencias.length === 0

                ?

                (

                    <p>

                        🟢 No existen incidencias.

                    </p>

                )

                :

                incidencias.map((i, index) => (

                    <div

                        key={index}

                        style={{

                            padding: 10,

                            borderBottom:

                                "1px solid #ddd"

                        }}

                    >

                        <strong>

                            {i.asesor}

                        </strong>

                        <br />

                        {i.tipo}

                        <br />

                        {i.detalle}

                        <br />

                        Nivel:

                        <strong>

                            {" "}

                            {i.nivel}

                        </strong>

                    </div>

                ))

            }

        </div>

    );

}