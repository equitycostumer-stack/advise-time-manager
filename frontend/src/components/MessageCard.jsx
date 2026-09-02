import { useEffect, useState } from "react";
import api from "../services/api";

export default function MessageCard({ mensaje }) {
    const [mensajeEmpresa, setMensajeEmpresa] = useState("");
    useEffect(() => { api.get("/configuracion-empresa").then(({ data }) => setMensajeEmpresa(data?.data?.mensaje_dia || "")).catch(() => {}); }, []);
    return <div style={{ marginTop: "40px", background: "#f7f7f7", padding: "20px", borderRadius: "15px" }}>
        <h3 className="mensaje-dia-animado">💚 Mensaje del día</h3>
        <p style={{ fontSize: "18px", color: "#555" }}>{mensajeEmpresa || mensaje}</p>
    </div>;
}
