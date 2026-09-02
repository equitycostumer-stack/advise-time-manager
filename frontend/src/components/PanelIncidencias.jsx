import { useState } from "react";
import RevisionIncidencia from "./RevisionIncidencia";
import { useAuth } from "../context/AuthContext";

export default function PanelIncidencias({ incidencias, onActualizar }) {
    const { usuario } = useAuth();
    const [incidenciaSeleccionada, setIncidenciaSeleccionada] = useState(null);
    const esAdministrador = usuario?.rol === "ADMINISTRADOR";

    return (
        <div
            style={{
                marginTop: 30,
                background: "#ffffff",
                borderRadius: 10,
                padding: 20
            }}
        >
            <h2>Panel de incidencias</h2>

            {!incidencias || incidencias.length === 0 ? (
                <p> No existen incidencias.</p>
            ) : (
                incidencias.map((incidencia) => {
                    const revisada = incidencia.revisada === true || incidencia.revisada === 1;

                    return (
                        <div
                            key={incidencia.id}
                            style={{
                                border: "1px solid #ddd",
                                borderRadius: 8,
                                padding: 15,
                                marginBottom: 12,
                                background: revisada ? "#e8f5e9" : "#fff3cd"
                            }}
                        >
                            <h3>{incidencia.nombre}</h3>
                            <p>
                                <strong>Tipo:</strong> {incidencia.tipo}
                            </p>
                            <p>
                                <strong>Nivel:</strong> {incidencia.nivel}
                            </p>
                            <p>
                                <strong>Detalle:</strong> {incidencia.detalle}
                            </p>

                            {esAdministrador && !revisada && (
                                <button
                                    type="button"
                                    onClick={() => setIncidenciaSeleccionada(incidencia)}
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
                                    Revisar incidencia
                                </button>
                            )}
                        </div>
                    );
                })
            )}

            {esAdministrador && (
                <RevisionIncidencia
                    incidencia={incidenciaSeleccionada}
                    onCerrar={() => setIncidenciaSeleccionada(null)}
                    onGuardar={() => {
                        setIncidenciaSeleccionada(null);
                        onActualizar?.();
                    }}
                />
            )}
        </div>
    );
}
