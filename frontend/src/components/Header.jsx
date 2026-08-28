import { useEffect, useState } from "react";
import logo from "../assets/Logo.png";
import { useAuth } from "../context/AuthContext";
import NotificacionesBell from "./NotificacionesBell";

export default function Header() {

    const { usuario, logout } = useAuth();

    const [fechaHora, setFechaHora] = useState(new Date());

    useEffect(() => {

        const intervalo = setInterval(() => {

            setFechaHora(new Date());

        }, 1000);

        return () => clearInterval(intervalo);

    }, []);

    return (

        <>

            <div className="header">

                <img
                    src={logo}
                    alt="Equity Line"
                    className="logo"
                    style={{
                        width: "400px",
                        height: "auto",
                        display: "block",
                        margin: "0 auto 15px auto"
                    }}
                />
                <h1 className="title">

                    EQUITY LINE

                </h1>

                <h2 className="subtitle">

                    Professional Services

                </h2>

                <hr />

                <h2 className="sectionTitle">

                    Control de Tiempo y Bienestar

                </h2>

                <div className="clock">

                    {fechaHora.toLocaleTimeString("es-US")}

                </div>

                <div className="date">

                    {fechaHora.toLocaleDateString("es-US", {

                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric"

                    })}

                </div>

                <NotificacionesBell />

                {usuario && (

                    <button
                        onClick={() => {
                            logout();
                            window.location.reload();
                        }}
                        style={{
                            marginTop: "15px",
                            padding: "8px 18px",
                            background: "#dc3545",
                            color: "#fff",
                            border: "none",
                            borderRadius: "8px",
                            cursor: "pointer",
                            fontWeight: "bold",
                            fontSize: "14px"
                        }}
                    >
                        🚪 Cerrar sesión ({usuario.usuario})
                    </button>

                )}

            </div>

        </>

    );

}