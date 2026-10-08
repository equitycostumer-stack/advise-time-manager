import { useEffect, useState } from "react";
import logo from "../assets/Logo.png";
import { useAuth } from "../context/AuthContext";
import NotificacionesBell from "./NotificacionesBell";
import api from "../services/api";

export default function Header() {
    const { usuario, logout } = useAuth();
    const [fechaHora, setFechaHora] = useState(new Date());
    const [empresa, setEmpresa] = useState(null);

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
            <NotificacionesBell />
            {usuario && <button onClick={() => { logout(); window.location.reload(); }} className="logout-button">🚪 Cerrar sesión</button>}
        </div>
    </div>;
}
