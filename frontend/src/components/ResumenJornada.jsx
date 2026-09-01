// ======================================================
// RESUMEN DE JORNADA
// ======================================================

import { useEffect, useState } from "react";
import api from "../services/api";

function formatearTiempo(ms = 0) {
    if (!ms || ms <= 0) return "00:00:00";

    const total = Math.floor(ms / 1000);
    const horas = String(Math.floor(total / 3600)).padStart(2, "0");
    const minutos = String(Math.floor((total % 3600) / 60)).padStart(2, "0");
    const segundos = String(total % 60).padStart(2, "0");

    return `${horas}:${minutos}:${segundos}`;
}

function formatearHora(fecha) {
    if (!fecha) return "--";

    return new Date(fecha).toLocaleTimeString("es-CO", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit"
    });
}

function fila(nombre, valor) {
    return (
        <div
            style={{
                display: "flex",
                justifyContent: "space-between",
                gap: "16px",
                padding: "10px 0",
                borderBottom: "1px solid #e5e7eb",
                color: "#6c757d"
            }}
        >
            <span style={{ color: "#6c757d" }}>{nombre}</span>
            <strong style={{ color: "#212529", textAlign: "right" }}>{valor}</strong>
        </div>
    );
}

export default function ResumenJornada({ resumen, asesor }) {
    const [ventasDelDia, setVentasDelDia] = useState([]);

    useEffect(() => {
        if (!asesor?.id) {
            setVentasDelDia([]);
            return;
        }

        let activo = true;
        async function cargarVentasDelDia() {
            try {
                const { data } = await api.get("/ventas/dia");
                const ventas = Array.isArray(data?.data) ? data.data : [];
                if (activo) {
                    setVentasDelDia(ventas.filter((venta) => (
                        Number(venta.asesor_id) === Number(asesor.id) && venta.estado !== "ANULADA"
                    )));
                }
            } catch (error) {
                console.error("Error cargando ventas del día en el resumen:", error);
                if (activo) setVentasDelDia([]);
            }
        }

        cargarVentasDelDia();
        window.addEventListener("venta-registrada", cargarVentasDelDia);

        return () => {
            activo = false;
            window.removeEventListener("venta-registrada", cargarVentasDelDia);
        };
    }, [asesor?.id]);

    if (!resumen) return null;

    function formatearMoneda(valor) {
        return (Number(valor) || 0).toLocaleString("es-CO", {
            style: "currency",
            currency: "COP",
            maximumFractionDigits: 0
        });
    }

    const totalVentas = ventasDelDia.reduce((total, venta) => total + (Number(venta.valor) || 0), 0);

    return (
        <div
            style={{
                marginTop: 20,
                padding: 22,
                borderRadius: 12,
                background: "#ffffff",
                border: "1px solid #d9e5dc",
                boxShadow: "0 8px 24px rgba(38,86,53,.12)",
                color: "#212529"
            }}
        >
            <h2
                style={{
                    textAlign: "center",
                    margin: "0 0 20px",
                    color: "#0d6efd"
                }}
            >
                📊 RESUMEN DE JORNADA
            </h2>

            {fila("👤 Asesor", asesor ? asesor.nombre : `ID ${resumen.asesor_id}`)}
            {fila("🟢 Hora entrada", formatearHora(resumen.hora_entrada))}
            {fila("🔴 Hora salida", resumen.hora_salida ? formatearHora(resumen.hora_salida) : "Jornada activa")}
            {fila("⏱ Tiempo trabajado", formatearTiempo(resumen.tiempo_trabajado))}
            {fila("☕ Break", formatearTiempo(resumen.tiempo_break))}
            {fila("🍽 Almuerzo", formatearTiempo(resumen.tiempo_almuerzo))}
            {fila("🚻 Baño", formatearTiempo(resumen.tiempo_bano))}
            {fila("📚 Capacitación", formatearTiempo(resumen.tiempo_capacitacion))}
            {fila("👥 Reunión", formatearTiempo(resumen.tiempo_reunion))}
            {fila("⏰ Llegó tarde", resumen.llego_tarde ? "Sí" : "No")}
            {fila("⌛ Minutos retraso", resumen.minutos_retraso ?? 0)}

            <div
                style={{
                    marginTop: 18,
                    paddingTop: 18,
                    borderTop: "2px solid #d9e5dc",
                    display: "flex",
                    justifyContent: "space-between",
                    gap: "16px",
                    fontWeight: "bold",
                    fontSize: 18,
                    color: "#0d6efd"
                }}
            >
                <span style={{ color: "#0d6efd" }}>💼 Tiempo productivo</span>
                <span style={{ color: "#212529" }}>
                    {formatearTiempo(resumen.tiempo_productivo)}
                </span>
            </div>

            <div style={{ marginTop: 20, paddingTop: 18, borderTop: "2px solid #d9e5dc" }}>
                <h3 style={{ margin: "0 0 12px", color: "#0d6efd", textAlign: "left" }}>💰 Ventas del día</h3>
                {fila("📈 Cantidad de ventas", ventasDelDia.length)}
                {fila("💵 Total vendido", formatearMoneda(totalVentas))}
                {ventasDelDia.length > 0 && (
                    <div style={{ marginTop: 10 }}>
                        {ventasDelDia.map((venta) => (
                            <div key={venta.id} style={{ padding: "9px 0", borderBottom: "1px solid #e5e7eb", color: "#6c757d", textAlign: "left", fontSize: 14 }}>
                                <strong style={{ color: "#198754" }}>{formatearMoneda(venta.valor)}</strong>
                                {venta.cliente_id ? ` — Cliente: ${venta.cliente_id}` : ""}
                                <span style={{ display: "block", color: "#6c757d", marginTop: 3 }}>{venta.observacion || "Sin observación"}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
