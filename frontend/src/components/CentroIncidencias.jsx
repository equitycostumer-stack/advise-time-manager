export default function CentroIncidencias({ incidencias }) {

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

            <h2>🚨 Centro de Incidencias</h2>

            {

                !incidencias || incidencias.length === 0

                    ?

                    (

                        <p>🟢 No existen incidencias.</p>

                    )

                    :

                    incidencias.map((i) => (

                        <div
                            key={i.id}
                            style={{
                                padding: 10,
                                borderBottom: "1px solid #ddd"
                            }}
                        >

                            <strong>

                                {i.nombre}

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