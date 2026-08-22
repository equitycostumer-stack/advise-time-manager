import { useEffect, useState } from "react";
import api from "../services/api";

export default function VentasDashboard() {

    const [resumenDia, setResumenDia] = useState({
        cantidad_ventas: 0,
        total_vendido: 0
    });

    const [porAsesor, setPorAsesor] = useState([]);

    const [ventasDia, setVentasDia] = useState([]);

    const [anulando, setAnulando] = useState(null);

    const [desplegado, setDesplegado] = useState(false);

    // ======================================================
    // CARGAR DATOS
    // ======================================================

    async function cargarVentas() {

        try {

            const [resDia, resAsesores, resListado] = await Promise.all([
                api.get("/ventas/resumen/dia"),
                api.get("/ventas/resumen/asesores"),
                api.get("/ventas/dia")
            ]);

            setResumenDia(
                resDia.data?.data || { cantidad_ventas: 0, total_vendido: 0 }
            );

            setPorAsesor(
                Array.isArray(resAsesores.data?.data)
                    ? resAsesores.data.data
                    : []
            );

            setVentasDia(
                Array.isArray(resListado.data?.data)
                    ? resListado.data.data
                    : []
            );

        } catch (error) {

            console.error("Error cargando ventas:", error);

        }

    }

    // ======================================================
    // ANULAR VENTA
    // ======================================================

    async function anularVenta(id, clienteId) {

        const confirmar = window.confirm(
            `¿Anular esta venta${clienteId ? ` (cliente: ${clienteId})` : ""}? Esta acción no se puede deshacer.`
        );

        if (!confirmar) return;

        setAnulando(id);

        try {

            const { data } = await api.patch(`/ventas/${id}/anular`);

            if (!data?.ok) {
                throw new Error(data?.mensaje || "No fue posible anular la venta.");
            }

            await cargarVentas();

        } catch (error) {

            console.error("Error anulando venta:", error);

            alert(
                error.response?.data?.mensaje ||
                error.message ||
                "No fue posible anular la venta."
            );

        } finally {

            setAnulando(null);

        }

    }

    useEffect(() => {

        cargarVentas();

        const intervalo = setInterval(cargarVentas, 5000);

        return () => clearInterval(intervalo);

    }, []);

    // ======================================================
    // FORMATO DE MONEDA
    // ======================================================

    function formatearMoneda(valor) {

        const numero = Number(valor) || 0;

        return numero.toLocaleString("es-CO", {
            style: "currency",
            currency: "COP",
            maximumFractionDigits: 0
        });

    }

    // ======================================================
    // INTERFAZ
    // ======================================================

    return (

        <div
            style={{
                marginTop: 40,
                background: "#fff",
                borderRadius: 10,
                padding: 20
            }}
        >

            <button
                onClick={() => setDesplegado(!desplegado)}
                style={{
                    width: "100%",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    background: "#f8f9fa",
                    border: "1px solid #ddd",
                    borderRadius: "10px",
                    padding: "15px 20px",
                    cursor: "pointer",
                    fontSize: "20px",
                    fontWeight: "bold",
                    color: "#212529"
                }}
            >
                <span>💰 Ventas del día</span>
                <span>{desplegado ? "▲" : "▼"}</span>
            </button>

            {desplegado && (

            <div style={{ marginTop: "20px" }}>

            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))",
                    gap: "15px",
                    marginBottom: "25px"
                }}
            >

                <div
                    style={{
                        background: "#20c997",
                        color: "white",
                        padding: "15px",
                        borderRadius: "10px",
                        textAlign: "center"
                    }}
                >
                    <h2>{resumenDia.cantidad_ventas}</h2>
                    <small>💰 Ventas</small>
                </div>

                <div
                    style={{
                        background: "#0d6efd",
                        color: "white",
                        padding: "15px",
                        borderRadius: "10px",
                        textAlign: "center"
                    }}
                >
                    <h2>{formatearMoneda(resumenDia.total_vendido)}</h2>
                    <small>💵 Total vendido</small>
                </div>

            </div>

            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))",
                    gap: "20px"
                }}
            >

                {porAsesor.map((a) => (

                    <div
                        key={a.asesor_id}
                        style={{
                            background: "#ffffff",
                            borderRadius: "8px",
                            padding: "12px",
                            boxShadow: "0 3px 10px rgba(0,0,0,0.15)",
                            border: "1px solid #ddd",
                            borderLeft: "8px solid #20c997"
                        }}
                    >

                        <h3 style={{ marginBottom: "8px", fontSize: "16px" }}>
                            👤 {a.asesor_nombre}
                        </h3>

                        <p style={{ margin: "4px 0" }}>
                            💰 Ventas: <strong>{a.cantidad_ventas}</strong>
                        </p>

                        <p style={{ margin: "4px 0" }}>
                            💵 Total: <strong>{formatearMoneda(a.total_vendido)}</strong>
                        </p>

                    </div>

                ))}

            </div>

            {/* =====================================================
                LISTADO INDIVIDUAL DE VENTAS DEL DÍA
            ===================================================== */}

            <h3 style={{ marginTop: "30px" }}>
                📋 Detalle de ventas de hoy
            </h3>

            {ventasDia.length === 0 ? (

                <p style={{ color: "#666" }}>
                    No hay ventas registradas hoy.
                </p>

            ) : (

                <div style={{ marginTop: "10px" }}>

                    {ventasDia.map((v) => (

                        <div
                            key={v.id}
                            style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                padding: "12px",
                                borderBottom: "1px solid #e5e5e5",
                                opacity: v.estado === "ANULADA" ? 0.55 : 1
                            }}
                        >

                            <div>

                                <strong>{v.asesor_nombre}</strong>
                                {" — "}
                                {formatearMoneda(v.valor)}

                                {v.cliente_id && (
                                    <span style={{ color: "#666", fontSize: "13px" }}>
                                        {" "}(Cliente: {v.cliente_id})
                                    </span>
                                )}

                                <br />

                                <span style={{ color: "#666", fontSize: "13px" }}>
                                    {v.observacion || "Sin observación"}
                                    {" — "}
                                    {v.estado === "ANULADA" ? "🔴 ANULADA" : "🟢 ACTIVA"}
                                </span>

                            </div>

                            {v.estado === "ACTIVA" && (

                                <button
                                    onClick={() => anularVenta(v.id, v.cliente_id)}
                                    disabled={anulando === v.id}
                                    style={{
                                        background: anulando === v.id ? "#e39a9a" : "#dc3545",
                                        color: "#fff",
                                        border: "none",
                                        borderRadius: "6px",
                                        padding: "8px 14px",
                                        cursor: anulando === v.id ? "default" : "pointer",
                                        fontWeight: "bold",
                                        whiteSpace: "nowrap"
                                    }}
                                >
                                    {anulando === v.id ? "Anulando..." : "✕ Anular"}
                                </button>

                            )}

                        </div>

                    ))}

                </div>

            )}

            </div>

            )}

        </div>

    );

}