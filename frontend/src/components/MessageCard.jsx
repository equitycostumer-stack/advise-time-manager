import { useEffect, useId, useState } from "react";
import { obtenerFechaHoyBogota, obtenerVersiculoDelDia } from "../utils/versiculoDelDia";

export default function MessageCard({ mensaje }) {
    const [fecha, setFecha] = useState(obtenerFechaHoyBogota);
    const [reflexionAbierta, setReflexionAbierta] = useState(false);
    const [catalogoVersiculos, setCatalogoVersiculos] = useState([]);
    const [licenciaVersiculosUrl, setLicenciaVersiculosUrl] = useState("");
    const [traduccionVersiculos, setTraduccionVersiculos] = useState("");
    const reflexionId = useId();
    const textoDelDia = mensaje;
    const seleccion = obtenerVersiculoDelDia(fecha, catalogoVersiculos);

    useEffect(() => {
        let vigente = true;
        import("../data/versiculosVentas.js")
            .then((modulo) => {
                if (!vigente) return;
                setCatalogoVersiculos(modulo.versiculosVentas);
                setLicenciaVersiculosUrl(modulo.licenciaVersiculosUrl);
                setTraduccionVersiculos(modulo.traduccionVersiculos);
            })
            .catch(() => {});
        return () => { vigente = false; };
    }, []);

    useEffect(() => {
        const actualizarFecha = () => {
            const hoy = obtenerFechaHoyBogota();
            setFecha((actual) => actual === hoy ? actual : hoy);
        };
        const intervalo = window.setInterval(actualizarFecha, 60000);
        return () => window.clearInterval(intervalo);
    }, []);

    if (!seleccion?.versiculo) return null;
    const { versiculo, indice, total } = seleccion;
    const esTextoCompartido = versiculo.traduccion === "Texto compartido";

    return (
        <section className="daily-message-card" aria-labelledby="daily-message-title">
            <span className="daily-message-card__orbit" aria-hidden="true">✦</span>
            <header className="daily-message-card__header">
                <span className="daily-message-card__heart" aria-hidden="true"><span className="daily-message-card__heart-icon">💚</span></span>
                <div className="daily-message-card__heading">
                    <span className="daily-message-card__eyebrow">✧ Inspiración para hoy</span>
                    <h3 id="daily-message-title">Mensaje del día</h3>
                    <p>Fe, enfoque y propósito para tu jornada</p>
                </div>
                <span className="daily-message-card__signal" aria-label="Actualiza cada día">
                    <span className="daily-message-card__signal-dot" aria-hidden="true">●</span>
                    <span>HOY</span>
                </span>
            </header>

            {textoDelDia && (
                <div className="daily-message-card__team-message">
                    <span>ÁNIMO PARA TU JORNADA</span>
                    <p>{textoDelDia}</p>
                </div>
            )}

            <div className="daily-message-card__verse">
                <div className="daily-message-card__verse-topline">
                    <span className="daily-message-card__verse-label">✧ Versículo de hoy</span>
                    <span className="daily-message-card__version">{versiculo.traduccion || "RVR 1909"}</span>
                </div>
                <blockquote>“{versiculo.texto}”</blockquote>
                <div className="daily-message-card__verse-footer">
                    <a href={versiculo.fuente} target="_blank" rel="noreferrer" aria-label={`Abrir ${versiculo.referencia} en la fuente bíblica`}>
                        {versiculo.referencia} <span aria-hidden="true">↗</span>
                    </a>
                    <span className="daily-message-card__counter">{String(indice + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}</span>
                </div>

                <button
                    className="daily-message-card__reflection-toggle"
                    type="button"
                    aria-expanded={reflexionAbierta}
                    aria-controls={reflexionId}
                    onClick={() => setReflexionAbierta((abierta) => !abierta)}
                >
                    <span aria-hidden="true">{reflexionAbierta ? "−" : "✦"}</span>
                    {reflexionAbierta ? "Cerrar reflexión" : "Ver explicación para tus ventas"}
                </button>

                <div className="daily-message-card__reflection" id={reflexionId} role="region" aria-label={`Aplicación práctica de ${versiculo.referencia}`} hidden={!reflexionAbierta}>
                    <span className="daily-message-card__reflection-kicker">Ventas con propósito</span>
                    <p>{versiculo.reflexion}</p>
                    <span className="daily-message-card__reflection-star" aria-hidden="true">✧</span>
                </div>
            </div>

            <footer className="daily-message-card__footer">
                <span>Un nuevo pasaje cada día</span>
                <a href={esTextoCompartido ? versiculo.fuente : licenciaVersiculosUrl} target="_blank" rel="noreferrer">
                    {esTextoCompartido ? "Consultar capítulo bíblico" : `${traduccionVersiculos} · dominio público`}
                </a>
            </footer>
        </section>
    );
}
