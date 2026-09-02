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
        <img src={logo} alt={empresa?.nombre_empresa || "EQUITY LINE"} className="logo" style={{ width: "400px", height: "auto", display: "block", margin: "0 auto 15px auto" }} />
        <h1 className="title">{empresa?.nombre_corto || "EQUITY LINE"}</h1>
        <h2 className="subtitle">Professional Services</h2>
        <hr />
        <h2 className="sectionTitle">Control de Tiempo y Bienestar</h2>
        <div className="clock">{fechaHora.toLocaleTimeString("es-CO")}</div>
        <div className="date">{fechaHora.toLocaleDateString("es-CO", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</div>
        <NotificacionesBell />
        {usuario && <button onClick={() => { logout(); window.location.reload(); }} style={{ marginTop: "15px", padding: "8px 18px", background: "#dc3545", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "bold", fontSize: "14px" }}>🚪 Cerrar sesión ({usuario.usuario})</button>}
    </div>;
}
