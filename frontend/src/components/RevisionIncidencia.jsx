import { useState } from "react";
import api from "../services/api";

export default function RevisionIncidencia({

    incidencia,

    onCerrar,

    onGuardar

}) {

    const [coach, setCoach] = useState("");

    const [comentario, setComentario] = useState("");

    async function guardarRevision() {

        if (!coach.trim()) {

            alert("Ingrese el nombre del Coach.");

            return;

        }

        try {

            await api.put(

                `/incidencias/${incidencia.id}/revisar`,

                {

                    coach,

                    comentario

                }

            );

            if (onGuardar) {

                onGuardar({

                    coach,

                    comentario

                });

            }

            alert("✅ Incidencia revisada correctamente.");

            onCerrar();

        } catch (err) {

            console.error(err);

            alert("Error guardando la revisión.");

        }

    }

    if (!incidencia) return null;

    return (

        <div
            style={{
                position: "fixed",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                background: "rgba(0,0,0,.5)",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                zIndex: 9999
            }}
        >

            <div
                style={{
                    background: "white",
                    width: "450px",
                    padding: "25px",
                    borderRadius: "12px"
                }}
            >

                <h2>🚨 Revisar incidencia</h2>

                <p>

                    <strong>Asesor:</strong>

                    <br />

                    {incidencia.nombre}

                </p>

                <p>

                    <strong>Tipo:</strong>

                    <br />

                    {incidencia.tipo}

                </p>

                <p>

                    <strong>Detalle:</strong>

                    <br />

                    {incidencia.detalle}

                </p>

                <hr />

                <label>

                    Coach

                </label>

                <input

                    value={coach}

                    onChange={(e) => setCoach(e.target.value)}

                    style={{

                        width: "100%",

                        padding: "8px",

                        marginTop: "5px",

                        marginBottom: "15px"

                    }}

                />

                <label>

                    Comentario

                </label>

                <textarea

                    value={comentario}

                    onChange={(e) => setComentario(e.target.value)}

                    rows={5}

                    style={{

                        width: "100%",

                        padding: "8px",

                        marginTop: "5px"

                    }}

                />

                <div
                    style={{

                        marginTop: "20px",

                        display: "flex",

                        justifyContent: "space-between"

                    }}
                >

                    <button

                        onClick={onCerrar}

                    >

                        Cancelar

                    </button>

                    <button

                        onClick={guardarRevision}

                        style={{

                            background: "#198754",

                            color: "white",

                            border: "none",

                            padding: "10px 20px",

                            borderRadius: "6px",

                            cursor: "pointer"

                        }}

                    >

                        Guardar revisión

                    </button>

                </div>

            </div>

        </div>

    );

}