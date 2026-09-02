import { useState } from "react";
import api from "../services/api";

export default function RevisionIncidencia({ incidencia, onCerrar, onGuardar }) {
    const [comentario, setComentario] = useState("");
    const [guardando, setGuardando] = useState(false);

    async function guardarRevision() {
        if (guardando) return;

        setGuardando(true);

        try {
            const comentarioNormalizado = comentario.trim() || null;

            await api.put(`/incidencias/${incidencia.id}/revisar`, {
                comentario: comentarioNormalizado
            });

            onGuardar?.({ comentario: comentarioNormalizado });
            onCerrar();
        } catch (err) {
            console.error("Error guardando la revisión:", err);
            alert("Error guardando la revisión.");
        } finally {
            setGuardando(false);
        }
    }

    if (!incidencia) return null;

    return (
        <div
            role="presentation"
            onClick={(event) => event.target === event.currentTarget && onCerrar()}
            style={{
                position: "fixed",
                inset: 0,
                background: "rgba(0,0,0,.5)",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                zIndex: 9999,
                padding: "20px"
            }}
        >
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="revision-incidencia-titulo"
                style={{
                    background: "white",
                    width: "100%",
                    maxWidth: "450px",
                    padding: "25px",
                    borderRadius: "12px",
                    boxSizing: "border-box"
                }}
            >
                <h2 id="revision-incidencia-titulo">Revisar incidencia</h2>

                <p>
                    <strong>Asesor:</strong>
                    <br />
                    {incidencia.nombre || "Sin nombre"}
                </p>

                <p>
                    <strong>Tipo:</strong>
                    <br />
                    {incidencia.tipo}
                </p>

                <p>
                    <strong>Detalle:</strong>
                    <br />
                    {incidencia.detalle || "Sin detalle"}
                </p>

                <hr />

                <label htmlFor="comentario-revision">Comentario</label>
                <textarea
                    id="comentario-revision"
                    value={comentario}
                    onChange={(event) => setComentario(event.target.value)}
                    maxLength={1000}
                    rows={5}
                    placeholder="Añade una observación opcional"
                    style={{
                        width: "100%",
                        padding: "8px",
                        marginTop: "5px",
                        boxSizing: "border-box",
                        resize: "vertical"
                    }}
                />

                <div
                    style={{
                        marginTop: "20px",
                        display: "flex",
                        justifyContent: "space-between",
                        gap: "12px"
                    }}
                >
                    <button type="button" onClick={onCerrar} disabled={guardando}>
                        Cancelar
                    </button>
                    <button
                        type="button"
                        onClick={guardarRevision}
                        disabled={guardando}
                        style={{
                            background: guardando ? "#6c757d" : "#198754",
                            color: "white",
                            border: "none",
                            padding: "10px 20px",
                            borderRadius: "6px",
                            cursor: guardando ? "wait" : "pointer"
                        }}
                    >
                        {guardando ? "Guardando..." : "Guardar revisión"}
                    </button>
                </div>
            </div>
        </div>
    );
}
