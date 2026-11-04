import { useEffect, useState } from "react";
import logo from "../assets/Logo.png";
import { useAuth } from "../context/AuthContext";
import NotificacionesBell from "./NotificacionesBell";
import api from "../services/api";

function monedaReconocimiento(valor) {
    return `$${Number(valor || 0).toLocaleString("es-CO", { maximumFractionDigits: 0 })}`;
}

export default function Header({ tema = "light", onCambiarTema, reconocimientoQuincenalAnterior = {} }) {
    const { usuario, logout } = useAuth();
    const [fechaHora, setFechaHora] = useState(new Date());
    const [empresa, setEmpresa] = useState(null);
    const ganadora = reconocimientoQuincenalAnterior.ganadora;
    const cargandoGanadora = reconocimientoQuincenalAnterior.cargando;
    const errorGanadora = reconocimientoQuincenalAnterior.error;
    const periodoGanadora = reconocimientoQuincenalAnterior.periodoLabel;
    const mostrarReconocimiento = reconocimientoQuincenalAnterior.visible;

    useEffect(() => {
        const intervalo = setInterval(() => setFechaHora(new Date()), 1000);
        return () => clearInterval(intervalo);
    }, []);

    useEffect(() => {
        if (!usuario) return;
        api.get("/configuracion-empresa")
            .then(({ data }) => setEmpresa(data?.data || null))
            .catch((error) => console.error("No fue posible cargar información institucional", error));
    }, [usuario]);

    return <div className="header">
        <div className="header-brand">
            <img
                src={logo}
                alt={empresa?.nombre_empresa || "EQUITY LINE"}
                className="logo"
                width="72"
                height="48"
                style={{ width: "72px", maxWidth: "72px", height: "48px", maxHeight: "48px", objectFit: "contain", display: "block", flex: "0 0 72px" }}
            />
            <div>
                <h1 className="title">{empresa?.nombre_corto || "EQUITY LINE"}</h1>
                <p className="subtitle">Control de Tiempo y Bienestar</p>
            </div>
        </div>
        <div className="header-actions">
            <div className="header-date">
                <strong>{fechaHora.toLocaleTimeString("es-CO")}</strong>
                <span>{fechaHora.toLocaleDateString("es-CO", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</span>
            </div>
            {usuario && mostrarReconocimiento && <section className="header-winner-card" aria-label="Reconocimiento a la mejor asesora de la quincena anterior">
                <div className="header-winner-card__medal" aria-hidden="true">🏆</div>
                <div className="header-winner-card__content" aria-live="polite">
                    <span className="header-winner-card__eyebrow">Mejor asesora de la quincena · ¡Aplausos!</span>
                    <strong className="header-winner-card__name">
                        {cargandoGanadora ? "Buscando a la ganadora…" : errorGanadora || ganadora?.asesor_nombre || "¡La próxima ganadora puedes ser tú!"}
                    </strong>
                    <span className="header-winner-card__period">{periodoGanadora ? `${periodoGanadora} · seleccionada automáticamente` : "Última quincena completa"}</span>
                    {ganadora && !cargandoGanadora && <div className="header-winner-card__stats">
                        <span>{Number(ganadora.cantidad_ventas || 0)} ventas</span>
                        <span>Vendido: {monedaReconocimiento(ganadora.total_vendido)}</span>
                        <span>Recaudo: {monedaReconocimiento(ganadora.total_recaudo)}</span>
                    </div>}
                    {!ganadora && !cargandoGanadora && !errorGanadora && <small className="header-winner-card__empty">Aún no hay ventas activas en ese periodo. ¡Cada venta cuenta!</small>}
                    <small className="header-winner-card__criteria">Criterio: más ventas; empate por recaudo y total vendido.</small>
                </div>
            </section>}
            <div className="header-controls">
                {typeof onCambiarTema === "function" && <button
                    type="button"
                    className="theme-toggle-button"
                    onClick={onCambiarTema}
                    aria-pressed={tema === "dark"}
                    aria-label={tema === "dark" ? "Cambiar al tema claro" : "Activar el tema oscuro"}
                    title={tema === "dark" ? "Cambiar al tema claro" : "Activar el tema oscuro"}
                >
                    <span aria-hidden="true">{tema === "dark" ? "☀️" : "🌙"}</span>
                    <span>{tema === "dark" ? "Tema claro" : "Tema oscuro"}</span>
                </button>}
                <NotificacionesBell />
                {usuario && <button onClick={() => { logout(); window.location.reload(); }} className="logout-button">🚪 Cerrar sesión</button>}
            </div>
        </div>
    </div>;
}
