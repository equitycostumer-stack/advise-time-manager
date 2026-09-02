import { useEffect, useState } from "react";
import api from "../services/api";

export default function Footer() {
    const [empresa, setEmpresa] = useState(null);
    useEffect(() => { api.get("/configuracion-empresa").then(({ data }) => setEmpresa(data?.data || null)).catch(() => {}); }, []);
    return <div style={{ marginTop: "30px", color: "#777", lineHeight: "1.8" }}>
        <strong>Coach:</strong> {empresa?.coach || "pendiente"}<br />
        <strong>Customer Services:</strong> {empresa?.customer_service || "pendiente"}<br />
        <strong>Jefe:</strong> {empresa?.jefe || "pendiente"}
    </div>;
}
