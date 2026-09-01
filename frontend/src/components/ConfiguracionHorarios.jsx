import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";

const diasIniciales = [
    { dia_semana: 0, nombre_dia: "Domingo" },
    { dia_semana: 1, nombre_dia: "Lunes" },
    { dia_semana: 2, nombre_dia: "Martes" },
    { dia_semana: 3, nombre_dia: "Miércoles" },
    { dia_semana: 4, nombre_dia: "Jueves" },
    { dia_semana: 5, nombre_dia: "Viernes" },
    { dia_semana: 6, nombre_dia: "Sábado" }
];

const valoresIniciales = diasIniciales.map((d) => ({
    ...d,
    activo: d.dia_semana !== 0,
    hora_entrada: d.dia_semana === 5 ? "11:00" : d.dia_semana === 6 ? "09:00" : d.dia_semana === 0 ? "" : "10:00",
    hora_salida: d.dia_semana === 6 ? "16:00" : d.dia_semana === 0 ? "" : "19:00",
    tolerancia_minutos: 0,
    break_max: 15,
    bano_max: 10,
    almuerzo_max: 60
}));

export default function ConfiguracionHorarios() {
    const { usuario } = useAuth();
    const [horarios, setHorarios] = useState(valoresIniciales);
    const [cargando, setCargando] = useState(true);
    const [guardando, setGuardando] = useState(false);
    const [mensaje, setMensaje] = useState("");
    const [abierto, setAbierto] = useState(false);
    const [asesores, setAsesores] = useState([]);
    const [guardandoAsesores, setGuardandoAsesores] = useState(false);
    const [mensajeAsesores, setMensajeAsesores] = useState("");

    useEffect(() => {
        if (usuario?.rol !== "ADMINISTRADOR") return;

        Promise.all([api.get("/horarios"), api.get("/asesores")])
            .then(([horariosRes, asesoresRes]) => {
                const data = horariosRes.data;
                setAsesores(Array.isArray(asesoresRes.data) ? asesoresRes.data : asesoresRes.data?.asesores || []);
                if (Array.isArray(data.horarios)) {
                    setHorarios(data.horarios);
                }
            })
            .catch((error) => {
                console.error("Error cargando horarios o asesores", error);
                setMensaje("No fue posible cargar la configuración.");
            })
            .finally(() => setCargando(false));
    }, [usuario]);

    if (usuario?.rol !== "ADMINISTRADOR") return null;

    function cambiar(dia, campo, valor) {
        setHorarios((actuales) => actuales.map((h) => (
            h.dia_semana === dia ? { ...h, [campo]: valor } : h
        )));
    }

    async function guardar() {
        setGuardando(true);
        setMensaje("");

        try {
            const { data } = await api.put("/horarios", { horarios });
            setHorarios(data.horarios || horarios);
            setMensaje("Configuración guardada. Se aplicará a las nuevas entradas inmediatamente.");
        } catch (error) {
            console.error("Error guardando horarios", error);
            setMensaje(error.response?.data?.mensaje || "No fue posible guardar la configuración.");
        } finally {
            setGuardando(false);
        }
    }

    function cambiarNombreAsesor(id, nombre) {
        setAsesores((actuales) => actuales.map((a) => a.id === id ? { ...a, nombre } : a));
    }

    async function guardarNombreAsesor(asesor) {
        const nombre = String(asesor.nombre || "").trim();
        if (nombre.length < 2) {
            setMensajeAsesores("El nombre debe tener al menos 2 caracteres.");
            return;
        }
        setGuardandoAsesores(true);
        setMensajeAsesores("");
        try {
            const { data } = await api.put(`/asesores/${asesor.id}/nombre`, { nombre });
            setAsesores((actuales) => actuales.map((a) => a.id === asesor.id ? { ...a, nombre: data.asesor?.nombre || nombre } : a));
            setMensajeAsesores("Nombre actualizado correctamente.");
            window.dispatchEvent(new Event("datos-actualizados"));
        } catch (error) {
            setMensajeAsesores(error.response?.data?.mensaje || "No fue posible actualizar el nombre.");
        } finally {
            setGuardandoAsesores(false);
        }
    }

    const input = {
        padding: "8px",
        border: "1px solid #ccc",
        borderRadius: "6px",
        width: "100%",
        boxSizing: "border-box"
    };

    return (
        <section style={{ marginTop: 24 }}>
            <button
                type="button"
                onClick={() => setAbierto((valor) => !valor)}
                aria-expanded={abierto}
                style={{
                    width: "100%",
                    padding: "14px 18px",
                    background: abierto ? "#0d6efd" : "#f8f9fa",
                    color: abierto ? "#fff" : "#0d6efd",
                    border: "1px solid #0d6efd",
                    borderRadius: abierto ? "10px 10px 0 0" : "10px",
                    fontWeight: "bold",
                    fontSize: "16px",
                    textAlign: "left",
                    cursor: "pointer"
                }}
            >
                ⚙️ Configuración
                <span style={{ float: "right" }}>{abierto ? "▲" : "▼"}</span>
            </button>

            {abierto && (
                <div style={{ background: "#fff", border: "1px solid #0d6efd", borderTop: "none", borderRadius: "0 0 10px 10px", padding: "20px" }}>
                    <p style={{ color: "#666", marginTop: 0 }}>
                        Solo administradores pueden modificar esta configuración. Los cambios afectan las nuevas entradas.
                    </p>

                    {cargando ? <p>Cargando horarios...</p> : (
                        <div style={{ overflowX: "auto" }}>
                            <table style={{ width: "100%", minWidth: "850px", borderCollapse: "collapse" }}>
                                <thead>
                                    <tr>{["Día", "Activo", "Entrada", "Salida", "Tolerancia", "Break", "Baño", "Almuerzo"].map((x) => <th key={x} style={{ textAlign: "left", padding: "9px", borderBottom: "2px solid #ddd" }}>{x}</th>)}</tr>
                                </thead>
                                <tbody>
                                    {horarios.map((h) => (
                                        <tr key={h.dia_semana} style={{ opacity: h.activo ? 1 : 0.55 }}>
                                            <td style={{ padding: "9px", fontWeight: "bold" }}>{h.nombre_dia}</td>
                                            <td style={{ padding: "9px" }}><input type="checkbox" checked={Boolean(h.activo)} onChange={(e) => cambiar(h.dia_semana, "activo", e.target.checked)} /></td>
                                            <td style={{ padding: "9px" }}><input type="time" disabled={!h.activo} value={h.hora_entrada || ""} onChange={(e) => cambiar(h.dia_semana, "hora_entrada", e.target.value)} style={input} /></td>
                                            <td style={{ padding: "9px" }}><input type="time" disabled={!h.activo} value={h.hora_salida || ""} onChange={(e) => cambiar(h.dia_semana, "hora_salida", e.target.value)} style={input} /></td>
                                            <td style={{ padding: "9px" }}><input type="number" min="0" value={h.tolerancia_minutos} onChange={(e) => cambiar(h.dia_semana, "tolerancia_minutos", Number(e.target.value))} style={input} /></td>
                                            <td style={{ padding: "9px" }}><input type="number" min="0" value={h.break_max} onChange={(e) => cambiar(h.dia_semana, "break_max", Number(e.target.value))} style={input} /></td>
                                            <td style={{ padding: "9px" }}><input type="number" min="0" value={h.bano_max} onChange={(e) => cambiar(h.dia_semana, "bano_max", Number(e.target.value))} style={input} /></td>
                                            <td style={{ padding: "9px" }}><input type="number" min="0" value={h.almuerzo_max} onChange={(e) => cambiar(h.dia_semana, "almuerzo_max", Number(e.target.value))} style={input} /></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    <div style={{ marginTop: "24px", paddingTop: "18px", borderTop: "1px solid #dcebe2" }}>
                        <h3 style={{ color: "#245b3a", margin: "0 0 6px" }}>👥 Administrar nombres de asesores</h3>
                        <p style={{ color: "#666", marginTop: 0 }}>Solo el administrador puede modificar estos nombres. El cambio se reflejará en el Dashboard, ventas e incidencias.</p>
                        <div style={{ display: "grid", gap: "10px" }}>
                            {asesores.map((asesor) => (
                                <div key={asesor.id} style={{ display: "grid", gridTemplateColumns: "minmax(150px, .7fr) minmax(180px, 1.4fr) auto", gap: "10px", alignItems: "center", padding: "10px", background: "#f7fbf8", border: "1px solid #dcebe2", borderRadius: "9px" }}>
                                    <strong style={{ color: "#245b3a" }}>ID {asesor.id}</strong>
                                    <input value={asesor.nombre || ""} onChange={(e) => cambiarNombreAsesor(asesor.id, e.target.value)} style={input} aria-label={`Nombre del asesor ${asesor.id}`} />
                                    <button type="button" onClick={() => guardarNombreAsesor(asesor)} disabled={guardandoAsesores} style={{ padding: "9px 13px", background: "#245b3a", color: "#fff", border: "none", borderRadius: "7px", fontWeight: "bold", cursor: "pointer" }}>Guardar</button>
                                </div>
                            ))}
                        </div>
                        {mensajeAsesores && <p style={{ color: mensajeAsesores.startsWith("Nombre") ? "#198754" : "#dc3545", fontWeight: "bold" }}>{mensajeAsesores}</p>}
                    </div>

                    <button type="button" onClick={guardar} disabled={cargando || guardando} style={{ marginTop: "18px", padding: "11px 18px", background: "#0d6efd", color: "#fff", border: "none", borderRadius: "7px", fontWeight: "bold", cursor: "pointer" }}>
                        {guardando ? "Guardando..." : "Guardar configuración"}
                    </button>
                    {mensaje && <p style={{ color: mensaje.startsWith("Configuración") ? "#198754" : "#dc3545", fontWeight: "bold" }}>{mensaje}</p>}
                </div>
            )}
        </section>
    );
}
