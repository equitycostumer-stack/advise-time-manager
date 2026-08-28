import { useEffect, useState } from "react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

export default function NotificacionesBell() {

    const { usuario } = useAuth();
    const [notificaciones, setNotificaciones] = useState([]);
    const [abierto, setAbierto] = useState(false);

    const noLeidas = notificaciones.filter((n) => !n.leida).length;

    async function cargarNotificaciones() {
        try {
            const { data } = await api.get("/notificaciones");
            setNotificaciones(Array.isArray(data?.notificaciones) ? data.notificaciones : []);
        } catch (error) {
            console.error("Error cargando notificaciones:", error);
        }
    }

    useEffect(() => {
        if (!usuario?.asesor_id) return;

        cargarNotificaciones();

        const intervalo = setInterval(cargarNotificaciones, 5000);

        return () => clearInterval(intervalo);
    }, [usuario]);

    async function marcarLeida(id) {
        try {
            await api.patch(`/notificaciones/${id}/leer`);
            await cargarNotificaciones();
        } catch (error) {
            console.error("Error marcando notificación como leída:", error);
        }
    }

    async function marcarTodasLeidas() {
        try {
            await api.patch("/notificaciones/leer-todas");
            await cargarNotificaciones();
        } catch (error) {
            console.error("Error marcando todas como leídas:", error);
        }
    }

    if (!usuario?.asesor_id) return null;

    return (
        <div style={{ position: "relative", display: "inline-block", marginTop: "15px", marginLeft: "10px" }}>

            <button
                onClick={() => setAbierto(!abierto)}
                style={{
                    background: "#0d6efd",
                    color: "#fff",
                    border: "none",
                    borderRadius: "50%",
                    width: "42px",
                    height: "42px",
                    fontSize: "18px",
                    cursor: "pointer",
                    position: "relative"
                }}
            >
                🔔
                {noLeidas > 0 && (
                    <span
                        style={{
                            position: "absolute",
                            top: "-4px",
                            right: "-4px",
                            background: "#dc3545",
                            color: "#fff",
                            borderRadius: "50%",
                            fontSize: "11px",
                            fontWeight: "bold",
                            width: "20px",
                            height: "20px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center"
                        }}
                    >
                        {noLeidas > 9 ? "9+" : noLeidas}
                    </span>
                )}
            </button>

            {abierto && (
                <div
                    style={{
                        position: "absolute",
                        top: "50px",
                        right: 0,
                        width: "300px",
                        maxHeight: "350px",
                        overflowY: "auto",
                        background: "#fff",
                        border: "1px solid #ddd",
                        borderRadius: "10px",
                        boxShadow: "0 4px 12px rgba(0,0,0,.15)",
                        zIndex: 100,
                        textAlign: "left"
                    }}
                >
                    <div style={{ padding: "10px 14px", borderBottom: "1px solid #eee", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <strong style={{ fontSize: "14px" }}>Notificaciones</strong>
                        {noLeidas > 0 && (
                            <button
                                onClick={marcarTodasLeidas}
                                style={{ background: "none", border: "none", color: "#0d6efd", fontSize: "12px", cursor: "pointer" }}
                            >
                                Marcar todas
                            </button>
                        )}
                    </div>

                    {notificaciones.length === 0 && (
                        <div style={{ padding: "16px", fontSize: "13px", color: "#888", textAlign: "center" }}>
                            No tienes notificaciones.
                        </div>
                    )}

                    {notificaciones.map((n) => (
                        <div
                            key={n.id}
                            onClick={() => !n.leida && marcarLeida(n.id)}
                            style={{
                                padding: "10px 14px",
                                borderBottom: "1px solid #f2f2f2",
                                cursor: n.leida ? "default" : "pointer",
                                background: n.leida ? "#fff" : "#eef5ff"
                            }}
                        >
                            <div style={{ fontWeight: "bold", fontSize: "13px" }}>{n.titulo}</div>
                            <div style={{ fontSize: "12px", color: "#555" }}>{n.mensaje}</div>
                        </div>
                    ))}
                </div>
            )}

        </div>
    );
}