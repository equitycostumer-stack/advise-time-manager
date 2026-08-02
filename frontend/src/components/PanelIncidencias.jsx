import { useState } from "react";
import RevisionIncidencia from "./RevisionIncidencia";

export default function PanelIncidencias({

    incidencias,

    onActualizar

}) {

    const [incidenciaSeleccionada, setIncidenciaSeleccionada] = useState(null);

    return (

        <div
            style={{
                marginTop: 30,
                background: "#ffffff",
                borderRadius: 10,
                padding: 20
            }}
        >

            <h2>🚨 Panel de Incidencias</h2>

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

                                border: "1px solid #ddd",

                                borderRadius: 8,

                                padding: 15,

                                marginBottom: 12,

                                background:

                                    i.revisada

                                        ? "#e8f5e9"

                                        : "#fff3cd"

                            }}

                        >

                            <h3>{i.nombre}</h3>

                            <p>

                                <strong>Tipo:</strong> {i.tipo}

                            </p>

                            <p>

                                <strong>Nivel:</strong> {i.nivel}

                            </p>

                            <p>

                                <strong>Detalle:</strong> {i.detalle}

                            </p>

                            <button

                                onClick={() => setIncidenciaSeleccionada(i)}

                                style={{

                                    marginTop: 10,

                                    width: "100%",

                                    padding: 10,

                                    border: "none",

                                    borderRadius: 6,

                                    background: "#198754",

                                    color: "white",

                                    cursor: "pointer",

                                    fontWeight: "bold"

                                }}

                            >

                                ✅ Revisar incidencia

                            </button>

                        </div>

                    ))

            }

            <RevisionIncidencia

                incidencia={incidenciaSeleccionada}

                onCerrar={() => setIncidenciaSeleccionada(null)}

                onGuardar={() => {

                    setIncidenciaSeleccionada(null);

                    if (onActualizar) {

                        onActualizar();

                    }

                }}

            />

        </div>

    );

}