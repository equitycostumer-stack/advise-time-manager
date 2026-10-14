import { useEffect, useState } from "react";

const MAX_FAVORITOS = 4;
const CLAVE_BASE = "equity-line-shortcuts";
const FAVORITOS_INICIALES = ["movimiento", "venta", "ventas", "metas"];
const ACCIONES = [
    { id: "movimiento", icono: "🟢", etiqueta: "Registrar movimiento", destino: "registro-movimiento" },
    { id: "venta", icono: "💰", etiqueta: "Registrar venta", destino: "registrar-venta" },
    { id: "ventas", icono: "📊", etiqueta: "Ver ventas del día", destino: "ventas-dia" },
    { id: "metas", icono: "🎯", etiqueta: "Centro de metas", vista: "control" },
    { id: "historico", icono: "🗓️", etiqueta: "Consultar histórico", vista: "historico" }
];

function leerFavoritos(clave) {
    try {
        const guardados = JSON.parse(localStorage.getItem(clave) || "null");
        if (!Array.isArray(guardados)) return FAVORITOS_INICIALES;
        const validos = guardados.filter((id, indice) => ACCIONES.some((accion) => accion.id === id) && guardados.indexOf(id) === indice).slice(0, MAX_FAVORITOS);
        return validos.length ? validos : FAVORITOS_INICIALES;
    } catch {
        return FAVORITOS_INICIALES;
    }
}

export default function AtajosRapidos({ usuarioClave = "equipo", onNavigate = () => {}, onIrASeccion = () => {} }) {
    const clave = `${CLAVE_BASE}:${encodeURIComponent(String(usuarioClave || "equipo"))}`;
    const [favoritos, setFavoritos] = useState(() => leerFavoritos(clave));
    const [editando, setEditando] = useState(false);
    const [aviso, setAviso] = useState("");

    useEffect(() => {
        try {
            localStorage.setItem(clave, JSON.stringify(favoritos));
        } catch {
            // Los atajos siguen funcionando si el navegador no permite guardar preferencias.
        }
    }, [clave, favoritos]);

    function alternarFavorito(id) {
        setAviso("");
        if (favoritos.includes(id)) {
            if (favoritos.length === 1) {
                setAviso("Mantén al menos un acceso favorito.");
                return;
            }
            setFavoritos(favoritos.filter((favorito) => favorito !== id));
            return;
        }
        if (favoritos.length >= MAX_FAVORITOS) {
            setAviso(`Puedes elegir hasta ${MAX_FAVORITOS} accesos favoritos.`);
            return;
        }
        setFavoritos([...favoritos, id]);
    }

    function ejecutar(accion) {
        if (accion.vista) {
            onNavigate(accion.vista);
            return;
        }
        onIrASeccion(accion.destino);
    }

    const accionesVisibles = favoritos
        .map((id) => ACCIONES.find((accion) => accion.id === id))
        .filter(Boolean);

    return (
        <section className="quick-links-card" aria-labelledby="quick-links-heading">
            <div className="quick-links-header">
                <div>
                    <span className="quick-links-eyebrow">A TU MANERA</span>
                    <h2 id="quick-links-heading">Accesos rápidos</h2>
                </div>
                <button
                    type="button"
                    className="quick-links-edit"
                    onClick={() => { setEditando((actual) => !actual); setAviso(""); }}
                    aria-expanded={editando}
                    aria-controls="quick-links-options"
                >
                    {editando ? "Listo" : "Personalizar"}
                </button>
            </div>

            {editando ? (
                <div id="quick-links-options" className="quick-links-options" role="group" aria-label="Elegir accesos favoritos">
                    {ACCIONES.map((accion) => {
                        const activo = favoritos.includes(accion.id);
                        return (
                            <button
                                key={accion.id}
                                type="button"
                                className={`quick-links-option${activo ? " is-selected" : ""}`}
                                aria-pressed={activo}
                                onClick={() => alternarFavorito(accion.id)}
                            >
                                <span aria-hidden="true">{activo ? "★" : "☆"}</span>
                                {accion.etiqueta}
                            </button>
                        );
                    })}
                    <p className="quick-links-hint">Elige hasta {MAX_FAVORITOS}; tus preferencias se guardan en este navegador.</p>
                    {aviso && <p className="quick-links-notice" role="status">{aviso}</p>}
                </div>
            ) : (
                <div className="quick-links-grid">
                    {accionesVisibles.map((accion) => (
                        <button key={accion.id} type="button" className="quick-link-button" onClick={() => ejecutar(accion)}>
                            <span className="quick-link-icon" aria-hidden="true">{accion.icono}</span>
                            <span>{accion.etiqueta}</span>
                            <span className="quick-link-arrow" aria-hidden="true">↗</span>
                        </button>
                    ))}
                </div>
            )}
        </section>
    );
}
