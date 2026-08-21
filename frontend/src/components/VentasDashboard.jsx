import { useEffect, useState } from "react";
import api from "../services/api";

export default function VentasDashboard() {

    const [resumenDia, setResumenDia] = useState({
        cantidad_ventas: 0,
        total_vendido: 0
    });

    const [porAsesor, setPorAsesor] = useState([]);

    // ======================================================
    // CARGAR DATOS
    // ======================================================

    async function cargarVentas() {

        try {

            const [resDia, resAsesores] = await Promise.all([
                api.get("/ventas/resumen/dia"),
                api.get("/ventas/resumen/asesores")
            ]);

            setResumenDia(
                resDia.data?.data || { cantidad_ventas: 0, total_vendido: 0 }
            );

            setPorAsesor(
                Array.isArray(resAsesores.data?.data)
                    ? resAsesores.data.data
                    : []
            );

        } catch (error) {

            console.error("Error cargando ventas:", error);

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

            <h2>💰 Ventas del día</h2>

            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))",
                    gap: "15px",
                    marginBottom: "25px",
                    marginTop: "20px"
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

        </div>

    );

}