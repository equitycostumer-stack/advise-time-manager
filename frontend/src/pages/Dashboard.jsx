import { useEffect, useState } from "react";
import api from "../services/api";

export default function Dashboard() {

    const [asesores, setAsesores] = useState([]);
    const [, setAhora] = useState(Date.now());

    // ==========================================
    // ACTUALIZA EL RELOJ CADA SEGUNDO
    // ==========================================

    useEffect(() => {

        const reloj = setInterval(() => {

            setAhora(Date.now());

        }, 1000);

        return () => clearInterval(reloj);

    }, []);

    // ==========================================
    // CARGAR DASHBOARD
    // ==========================================

    async function cargarDashboard() {

        try {

            const res = await api.get("/dashboard");

            setAsesores(res.data.asesores);

        } catch (error) {

            console.error("Error cargando dashboard:", error);

        }

    }

    // ==========================================
    // ACTUALIZA DATOS CADA 5 SEGUNDOS
    // ==========================================

    useEffect(() => {

        cargarDashboard();

        const intervalo = setInterval(cargarDashboard, 5000);

        return () => clearInterval(intervalo);

    }, []);

    // ==========================================
    // CALCULAR TIEMPO EN ESTADO
    // ==========================================

    const calcularTiempo = (inicio, estado) => {

        if (!inicio) {

            return "--:--:--";

        }

        // Si ya salió, no seguir contando
        if (estado === "SALIDA") {

            return "✅ Finalizado";

        }

        const segundos = Math.floor(
            (Date.now() - new Date(inicio).getTime()) / 1000
        );

        const horas = Math.floor(segundos / 3600);
        const minutos = Math.floor((segundos % 3600) / 60);
        const seg = segundos % 60;

        return (
            String(horas).padStart(2, "0") +
            ":" +
            String(minutos).padStart(2, "0") +
            ":" +
            String(seg).padStart(2, "0")
        );

    };

    // ==========================================
    // COLOR SEGÚN ESTADO
    // ==========================================

    const obtenerColor = (estado) => {

        switch (estado) {

            case "TRABAJANDO":
            case "ENTRADA":
                return "#28a745";

            case "BREAK":
                return "#ffc107";

            case "ALMUERZO":
                return "#fd7e14";

            case "BANO":
                return "#17a2b8";

            case "CAPACITACION":
                return "#6f42c1";

            case "REUNION":
                return "#6c757d";

            case "SALIDA":
                return "#dc3545";

            default:
                return "#198754";

        }

    };

    // ==========================================
    // EMOJI SEGÚN ESTADO
    // ==========================================

    const obtenerEmoji = (estado) => {

        switch (estado) {

            case "TRABAJANDO":
            case "ENTRADA":
                return "🟢";

            case "BREAK":
                return "☕";

            case "ALMUERZO":
                return "🍽";

            case "BANO":
                return "🚻";

            case "CAPACITACION":
                return "📚";

            case "REUNION":
                return "👥";

            case "SALIDA":
                return "🔴";

            default:
                return "⚪";

        }

    };

    return (

        <div style={{ marginTop: 40 }}>

            <h2
                style={{
                    textAlign: "center",
                    marginBottom: 20
                }}
            >
                🏢 EQUITY LINE - Centro de Monitoreo
            </h2>

            {/* RESUMEN */}

            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))",
                    gap: 12,
                    marginBottom: 30
                }}
            >

                <div
    style={{
        background: "#198754",
        color: "#fff",
        padding: 15,
        borderRadius: 10,
        textAlign: "center"
    }}
>
    <h3>{asesores.length}</h3>
    <small>👥 Asesores</small>
</div>

<div
    style={{
        background: "#28a745",
        color: "#fff",
        padding: 15,
        borderRadius: 10,
        textAlign: "center"
    }}
>
    <h3>
        {
            asesores.filter(
                (a) =>
                    a.estado === "TRABAJANDO" ||
                    a.estado === "ENTRADA"
            ).length
        }
    </h3>
    <small>🟢 Trabajando</small>
</div>

<div
    style={{
        background: "#ffc107",
        padding: 15,
        borderRadius: 10,
        textAlign: "center"
    }}
>
    <h3>
        {
            asesores.filter(
                (a) => a.estado === "BREAK"
            ).length
        }
    </h3>
    <small>☕ Break</small>
</div>

<div
    style={{
        background: "#fd7e14",
        color: "#fff",
        padding: 15,
        borderRadius: 10,
        textAlign: "center"
    }}
>
    <h3>
        {
            asesores.filter(
                (a) => a.estado === "ALMUERZO"
            ).length
        }
    </h3>
    <small>🍽 Almuerzo</small>
</div>

<div
    style={{
        background: "#17a2b8",
        color: "#fff",
        padding: 15,
        borderRadius: 10,
        textAlign: "center"
    }}
>
    <h3>
        {
            asesores.filter(
                (a) => a.estado === "BANO"
            ).length
        }
    </h3>
    <small>🚻 Baño</small>
</div>

</div>

{/* TARJETAS */}

<div
    style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))",
        gap: 20
    }}
>

    {

        asesores.map((a) => (

            <div
                key={a.id}
                style={{
                    borderLeft: `8px solid ${obtenerColor(a.estado)}`,
                    background: "#fff",
                    borderRadius: 12,
                    padding: 18,
                    boxShadow: "0 3px 10px rgba(0,0,0,.15)"
                }}
            >

                <h3 style={{ marginBottom: 15 }}>
                    {a.nombre}
                </h3>

                <p>
                    <strong>Estado</strong>
                    <br />
                    {obtenerEmoji(a.estado)} {a.estado}
                </p>

                <p>
                    <strong>Inicio</strong>
                    <br />
                    {
                        a.inicio_estado
                            ? new Date(a.inicio_estado).toLocaleTimeString(
                                  [],
                                  {
                                      hour: "2-digit",
                                      minute: "2-digit"
                                  }
                              )
                            : "--:--"
                    }
                </p>

                <p>
                    <strong>⏱ Tiempo en estado</strong>
                    <br />
                    {
                        calcularTiempo(
                            a.inicio_estado,
                            a.estado
                        )
                    }
                </p>

            </div>

        ))

    }

</div>

</div>

);

}