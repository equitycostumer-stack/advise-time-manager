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
    const [usuarios, setUsuarios] = useState([]);
    const [cargandoUsuarios, setCargandoUsuarios] = useState(false);
    const [guardandoUsuario, setGuardandoUsuario] = useState(null);
    const [mensajeUsuarios, setMensajeUsuarios] = useState("");
    const [empresa, setEmpresa] = useState({ nombre_empresa: "", nombre_corto: "", coach: "", customer_service: "", jefe: "", mensaje_dia: "", correo_contacto: "", telefono_contacto: "" });
    const [cargandoEmpresa, setCargandoEmpresa] = useState(false);
    const [guardandoEmpresa, setGuardandoEmpresa] = useState(false);
    const [mensajeEmpresa, setMensajeEmpresa] = useState("");
    const [ventasConfig, setVentasConfig] = useState({ moneda: "USD", simbolo_moneda: "$", permitir_recaudo: true, permitir_recaudo_cero: true, recaudo_no_supera_venta: true, ranking_activo: true, ranking_visible_asesores: true, criterio_ranking: "RECAUDO" });
    const [cargandoVentas, setCargandoVentas] = useState(false);
    const [guardandoVentas, setGuardandoVentas] = useState(false);
    const [mensajeVentas, setMensajeVentas] = useState("");

    useEffect(() => {
        if (usuario?.rol !== "ADMINISTRADOR") return;

        api.get("/horarios")
            .then(({ data }) => {
                if (Array.isArray(data.horarios)) {
                    setHorarios(data.horarios);
                }
            })
            .catch((error) => {
                console.error("Error cargando horarios", error);
                setMensaje("No fue posible cargar la configuración.");
            })
            .finally(() => setCargando(false));
    }, [usuario]);

    async function cargarUsuarios() {
        setCargandoUsuarios(true);
        setMensajeUsuarios("");
        try {
            const { data } = await api.get("/usuarios");
            setUsuarios(Array.isArray(data?.usuarios) ? data.usuarios : []);
        } catch (error) {
            console.error("Error cargando usuarios", error);
            setMensajeUsuarios(error.response?.data?.mensaje || "No fue posible cargar los usuarios.");
        } finally {
            setCargandoUsuarios(false);
        }
    }

    async function guardarUsuario(item) {
        setGuardandoUsuario(item.id);
        setMensajeUsuarios("");
        try {
            const { data } = await api.put(`/usuarios/${item.id}`, {
                email: item.email || null,
                telefono: item.telefono || null,
                rol: item.rol,
                activo: Boolean(item.activo)
            });
            if (!data?.ok) throw new Error(data?.mensaje || "No fue posible actualizar el usuario.");
            setMensajeUsuarios("Usuario actualizado correctamente.");
        } catch (error) {
            setMensajeUsuarios(error.response?.data?.mensaje || error.message || "No fue posible actualizar el usuario.");
        } finally {
            setGuardandoUsuario(null);
        }
    }

    async function resetearPassword(id) {
        if (!window.confirm("¿Restablecer la contraseña de este usuario?")) return;
        try {
            const { data } = await api.put(`/usuarios/${id}/reset-password`);
            window.alert(`${data?.mensaje || "Contraseña restablecida."}\nContraseña temporal: ${data?.passwordTemporal || "Consulte al administrador."}`);
        } catch (error) {
            window.alert(error.response?.data?.mensaje || "No fue posible restablecer la contraseña.");
        }
    }


    async function cargarEmpresa() {
        setCargandoEmpresa(true);
        setMensajeEmpresa("");
        try {
            const { data } = await api.get("/configuracion-empresa");
            if (data?.data) setEmpresa((actual) => ({ ...actual, ...data.data }));
        } catch (error) {
            setMensajeEmpresa(error.response?.data?.mensaje || "No fue posible cargar la información de la empresa.");
        } finally { setCargandoEmpresa(false); }
    }

    async function guardarEmpresa() {
        setGuardandoEmpresa(true);
        setMensajeEmpresa("");
        try {
            const { data } = await api.put("/configuracion-empresa", empresa);
            if (!data?.ok) throw new Error(data?.mensaje || "No fue posible guardar la información.");
            setEmpresa((actual) => ({ ...actual, ...(data.data || {}) }));
            setMensajeEmpresa("Información de la empresa guardada correctamente.");
        } catch (error) {
            setMensajeEmpresa(error.response?.data?.mensaje || error.message || "No fue posible guardar la información.");
        } finally { setGuardandoEmpresa(false); }
    }

    function cambiarEmpresa(campo, valor) { setEmpresa((actual) => ({ ...actual, [campo]: valor })); }

    async function cargarVentasConfig() {
        setCargandoVentas(true); setMensajeVentas("");
        try { const { data } = await api.get("/configuracion-ventas"); if (data?.data) setVentasConfig((actual) => ({ ...actual, ...data.data })); }
        catch (error) { setMensajeVentas(error.response?.data?.mensaje || "No fue posible cargar la configuración de ventas."); }
        finally { setCargandoVentas(false); }
    }

    async function guardarVentasConfig() {
        setGuardandoVentas(true); setMensajeVentas("");
        try { const { data } = await api.put("/configuracion-ventas", ventasConfig); if (!data?.ok) throw new Error(data?.mensaje || "No fue posible guardar la configuración."); setVentasConfig((actual) => ({ ...actual, ...(data.data || {}) })); setMensajeVentas("Configuración de ventas guardada correctamente."); }
        catch (error) { setMensajeVentas(error.response?.data?.mensaje || error.message || "No fue posible guardar la configuración."); }
        finally { setGuardandoVentas(false); }
    }

    function cambiarVentas(campo, valor) { setVentasConfig((actual) => ({ ...actual, [campo]: valor })); }

    function cambiarUsuario(id, campo, valor) {
        setUsuarios((actuales) => actuales.map((item) => item.id === id ? { ...item, [campo]: valor } : item));
    }

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
                    <p style={{ color: "#4b5563", marginTop: 0 }}>
                        Solo administradores pueden modificar horarios, usuarios y parámetros operativos.
                    </p>

                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: "10px", marginBottom: "18px" }}>
                        <div style={{ padding: "12px 14px", borderRadius: "9px", background: "#f7fbf8", border: "1px solid #dcebe2", color: "#245b3a" }}>
                            <strong>🏢 Empresa</strong><br />
                            <span style={{ color: "#4b5563", fontSize: "14px" }}>Equity Line Professional Services</span>
                        </div>
                        <div style={{ padding: "12px 14px", borderRadius: "9px", background: "#fffaf0", border: "1px solid #eadca8", color: "#785b00" }}>
                            <strong>💰 Ventas y recaudos</strong><br />
                            <span style={{ color: "#4b5563", fontSize: "14px" }}>Recaudo y ranking quincenal activos</span>
                        </div>
                    </div>

                    <details open style={{ marginBottom: "16px" }}>
                        <summary style={{ cursor: "pointer", color: "#245b3a", fontWeight: "bold", padding: "8px 0" }}>🕒 Horarios operativos</summary>
                        <p style={{ color: "#4b5563", fontSize: "14px" }}>Los cambios se aplican a las nuevas entradas.</p>

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

                    <button type="button" onClick={guardar} disabled={cargando || guardando} style={{ marginTop: "18px", padding: "11px 18px", background: "#245b3a", color: "#fff", border: "none", borderRadius: "7px", fontWeight: "bold", cursor: "pointer" }}>
                        {guardando ? "Guardando..." : "Guardar horarios"}
                    </button>
                    {mensaje && <p style={{ color: mensaje.startsWith("Configuración") ? "#198754" : "#dc3545", fontWeight: "bold" }}>{mensaje}</p>}
                        </details>

                        <details style={{ marginTop: "14px" }} onToggle={(e) => { if (e.currentTarget.open && usuarios.length === 0) cargarUsuarios(); }}>
                            <summary style={{ cursor: "pointer", color: "#245b3a", fontWeight: "bold", padding: "8px 0" }}>👥 Usuarios y contraseñas</summary>
                            <p style={{ color: "#4b5563" }}>Edición protegida para administradores. Las contraseñas nunca se muestran; solo pueden restablecerse.</p>
                            {cargandoUsuarios ? <p>Cargando usuarios...</p> : usuarios.length === 0 ? <p>No hay usuarios disponibles.</p> : <div style={{ overflowX: "auto" }}><table style={{ width: "100%", minWidth: "760px", borderCollapse: "collapse", color: "#1f2937" }}><thead><tr>{["Usuario", "Email", "Teléfono", "Rol", "Activo", "Acción"].map((x) => <th key={x} style={{ textAlign: "left", padding: "8px", color: "#245b3a", background: "#f7fbf8" }}>{x}</th>)}</tr></thead><tbody>{usuarios.map((item) => <tr key={item.id} style={{ borderBottom: "1px solid #dcebe2" }}><td style={{ padding: "8px", fontWeight: "bold" }}>{item.usuario}</td><td style={{ padding: "8px" }}><input value={item.email || ""} onChange={(e) => cambiarUsuario(item.id, "email", e.target.value)} style={input} /></td><td style={{ padding: "8px" }}><input value={item.telefono || ""} onChange={(e) => cambiarUsuario(item.id, "telefono", e.target.value)} style={input} /></td><td style={{ padding: "8px" }}><select value={item.rol || "ASESOR"} onChange={(e) => cambiarUsuario(item.id, "rol", e.target.value)} style={input}><option value="ASESOR">ASESOR</option><option value="ADMINISTRADOR">ADMINISTRADOR</option></select></td><td style={{ padding: "8px" }}><input type="checkbox" checked={Boolean(item.activo)} onChange={(e) => cambiarUsuario(item.id, "activo", e.target.checked)} /></td><td style={{ padding: "8px", whiteSpace: "nowrap" }}><button type="button" onClick={() => guardarUsuario(item)} disabled={guardandoUsuario === item.id} style={{ marginRight: "6px", padding: "7px 10px", background: "#245b3a", color: "#fff", border: 0, borderRadius: "6px", fontWeight: "bold" }}>{guardandoUsuario === item.id ? "Guardando..." : "Guardar"}</button><button type="button" onClick={() => resetearPassword(item.id)} style={{ padding: "7px 10px", background: "#b8941f", color: "#fff", border: 0, borderRadius: "6px", fontWeight: "bold" }}>Restablecer contraseña</button></td></tr>)}</tbody></table></div>}
                            {mensajeUsuarios && <p style={{ color: mensajeUsuarios.includes("correctamente") ? "#198754" : "#c0392b", fontWeight: "bold" }}>{mensajeUsuarios}</p>}
                        </details>

                        <details style={{ marginTop: "8px" }} onToggle={(e) => { if (e.currentTarget.open && !empresa.nombre_empresa) cargarEmpresa(); }}>
                            <summary style={{ cursor: "pointer", color: "#245b3a", fontWeight: "bold", padding: "8px 0" }}>🏢 Información de la empresa</summary>
                            {cargandoEmpresa ? <p>Cargando información...</p> : <div style={{ display: "grid", gap: "10px" }}>
                                {[['nombre_empresa','Nombre de la empresa'],['nombre_corto','Nombre corto'],['coach','Coach'],['customer_service','Customer Services'],['jefe','Jefe o gerente'],['correo_contacto','Correo de contacto'],['telefono_contacto','Teléfono de contacto']].map(([campo, etiqueta]) => <label key={campo} style={{ color: "#245b3a", fontWeight: "bold" }}>{etiqueta}<input value={empresa[campo] || ""} onChange={(e) => cambiarEmpresa(campo, e.target.value)} style={input} /></label>)}
                                <label style={{ color: "#245b3a", fontWeight: "bold" }}>Mensaje del día<textarea value={empresa.mensaje_dia || ""} onChange={(e) => cambiarEmpresa("mensaje_dia", e.target.value)} rows="3" style={{ ...input, resize: "vertical" }} /></label>
                                <button type="button" onClick={guardarEmpresa} disabled={guardandoEmpresa} style={{ justifySelf: "start", padding: "10px 16px", background: "#245b3a", color: "#fff", border: 0, borderRadius: "7px", fontWeight: "bold" }}>{guardandoEmpresa ? "Guardando..." : "Guardar información"}</button>
                                {mensajeEmpresa && <p style={{ color: mensajeEmpresa.includes("correctamente") ? "#198754" : "#c0392b", fontWeight: "bold" }}>{mensajeEmpresa}</p>}
                            </div>}
                        </details>

                        <details style={{ marginTop: "8px" }} onToggle={(e) => { if (e.currentTarget.open && !mensajeVentas && !cargandoVentas) cargarVentasConfig(); }}>
                            <summary style={{ cursor: "pointer", color: "#245b3a", fontWeight: "bold", padding: "8px 0" }}>💰 Ventas y recaudos</summary>
                            {cargandoVentas ? <p>Cargando configuración...</p> : <div style={{ display: "grid", gap: "10px" }}>
                                <label style={{ color: "#245b3a", fontWeight: "bold" }}>Moneda<select value={ventasConfig.moneda} onChange={(e) => cambiarVentas("moneda", e.target.value)} style={input}><option value="USD">USD</option><option value="COP">COP</option><option value="EUR">EUR</option></select></label>
                                <label style={{ color: "#245b3a", fontWeight: "bold" }}>Símbolo de moneda<input value={ventasConfig.simbolo_moneda} onChange={(e) => cambiarVentas("simbolo_moneda", e.target.value)} maxLength="5" style={input} /></label>
                                {[['permitir_recaudo','Permitir registrar recaudo'],['permitir_recaudo_cero','Permitir recaudo en cero'],['recaudo_no_supera_venta','Impedir recaudo mayor al valor de venta'],['ranking_activo','Activar ranking quincenal'],['ranking_visible_asesores','Mostrar ranking a asesores']].map(([campo, etiqueta]) => <label key={campo} style={{ color: "#4b5563" }}><input type="checkbox" checked={Boolean(ventasConfig[campo])} onChange={(e) => cambiarVentas(campo, e.target.checked)} /> {etiqueta}</label>)}
                                <label style={{ color: "#245b3a", fontWeight: "bold" }}>Criterio del ranking<select value={ventasConfig.criterio_ranking} onChange={(e) => cambiarVentas("criterio_ranking", e.target.value)} style={input}><option value="RECAUDO">Mayor recaudo</option><option value="VALOR_VENDIDO">Mayor valor vendido</option><option value="CANTIDAD_VENTAS">Mayor cantidad de ventas</option></select></label>
                                <button type="button" onClick={guardarVentasConfig} disabled={guardandoVentas} style={{ justifySelf: "start", padding: "10px 16px", background: "#245b3a", color: "#fff", border: 0, borderRadius: "7px", fontWeight: "bold" }}>{guardandoVentas ? "Guardando..." : "Guardar ventas y recaudos"}</button>
                                {mensajeVentas && <p style={{ color: mensajeVentas.includes("correctamente") ? "#198754" : "#c0392b", fontWeight: "bold" }}>{mensajeVentas}</p>}
                            </div>}
                        </details>
                </div>
            )}
        </section>
    );
}
