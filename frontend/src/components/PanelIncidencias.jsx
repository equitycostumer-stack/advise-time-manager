import { useEffect, useState } from "react";
import api from "../services/api";
import RevisionIncidencia from "./RevisionIncidencia";

export default function PanelIncidencias() {

    const [incidencias, setIncidencias] = useState([]);
    const [incidenciaSeleccionada, setIncidenciaSeleccionada] = useState(null);

    async function cargarIncidencias() {

        try {

            const res = await api.get("/incidencias");

            setIncidencias(res.data);

        } catch (err) {

            console.error(err);

        }

    }

    useEffect(() => {

        cargarIncidencias();

        const intervalo = setInterval(cargarIncidencias, 5000);

        return () => clearInterval(intervalo);

    }, []);

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

                incidencias.length === 0

                    ? (

                        <p>🟢 No existen incidencias.</p>

                    )

                    : (

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

                                        marginTop: "10px",

                                        width: "100%",

                                        padding: "10px",

                                        border: "none",

                                        borderRadius: "6px",

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

                    )

            }

            <RevisionIncidencia

                incidencia={incidenciaSeleccionada}

                onCerrar={() => setIncidenciaSeleccionada(null)}

                onGuardar={() => {

    setIncidenciaSeleccionada(null);

    cargarIncidencias();

}}

            />

        </div>

    );

}