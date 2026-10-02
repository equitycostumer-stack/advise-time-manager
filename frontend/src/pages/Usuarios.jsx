import { useEffect, useMemo, useState } from "react";
import api from "../services/api";

const inicial = { usuario: "", email: "", telefono: "", rol: "ASESOR", asesor_id: "", password: "" };
const caja = { padding: 9, border: "1px solid #ccd8d0", borderRadius: 7, width: "100%", boxSizing: "border-box" };
const boton = { border: 0, borderRadius: 8, padding: "9px 12px", cursor: "pointer", fontWeight: 700 };

export default function Usuarios() {
    const [usuarios, setUsuarios] = useState([]);
    const [asesores, setAsesores] = useState([]);
    const [busqueda, setBusqueda] = useState("");
    const [formulario, setFormulario] = useState(inicial);
    const [editando, setEditando] = useState(null);
    const [abierto, setAbierto] = useState(false);
    const [cargando, setCargando] = useState(true);
    const [guardando, setGuardando] = useState(false);
    const [mensaje, setMensaje] = useState("");
    const [error, setError] = useState("");

    async function cargar() {
        setCargando(true); setError("");
        try {
            const [usuariosRes, asesoresRes] = await Promise.all([api.get("/usuarios"), api.get("/asesores")]);
            setUsuarios(Array.isArray(usuariosRes.data?.usuarios) ? usuariosRes.data.usuarios : []);
            const lista = Array.isArray(asesoresRes.data) ? asesoresRes.data : asesoresRes.data?.data;
            setAsesores(Array.isArray(lista) ? lista : []);
        } catch (e) { setError(e.response?.data?.mensaje || "No fue posible cargar los usuarios."); }
        finally { setCargando(false); }
    }
    useEffect(() => { cargar(); }, []);

    const filtrados = useMemo(() => {
        const texto = busqueda.trim().toLowerCase();
        return usuarios.filter((u) => !texto || [u.usuario, u.email, u.asesor, u.rol].some((v) => String(v || "").toLowerCase().includes(texto)));
    }, [usuarios, busqueda]);

    function abrirNuevo() { setEditando(null); setFormulario(inicial); setMensaje(""); setAbierto(true); }
    function abrirEdicion(usuario) {
        setEditando(usuario.id);
        setFormulario({ usuario: usuario.usuario || "", email: usuario.email || "", telefono: usuario.telefono || "", rol: usuario.rol || "ASESOR", asesor_id: usuario.asesor_id || "", password: "" });
        setMensaje(""); setAbierto(true);
    }
    function cambiar(campo, valor) { setFormulario((actual) => ({ ...actual, [campo]: valor })); }

    async function guardar(e) {
        e.preventDefault(); setGuardando(true); setMensaje("");
        try {
            if (editando) {
                await api.put(`/usuarios/${editando}`, { asesor_id: formulario.asesor_id ? Number(formulario.asesor_id) : null, email: formulario.email || null, telefono: formulario.telefono || null, rol: formulario.rol, activo: Boolean(usuarios.find((u) => u.id === editando)?.activo) });
                setMensaje("Usuario actualizado correctamente.");
            } else {
                await api.post("/usuarios", { ...formulario, asesor_id: formulario.asesor_id ? Number(formulario.asesor_id) : null });
                setMensaje("Usuario creado correctamente.");
            }
            setAbierto(false); await cargar();
        } catch (e) { setMensaje(e.response?.data?.mensaje || "No fue posible guardar el usuario."); }
        finally { setGuardando(false); }
    }

    async function alternar(usuario) {
        const activo = Number(usuario.activo) !== 1 && usuario.activo !== true;
        if (!window.confirm(`${activo ? "Activar" : "Desactivar"} a ${usuario.usuario}?`)) return;
        try { await api.put(`/usuarios/${usuario.id}`, { email: usuario.email || null, telefono: usuario.telefono || null, rol: usuario.rol, activo }); await cargar(); }
        catch (e) { setError(e.response?.data?.mensaje || "No fue posible cambiar el estado."); }
    }

    async function resetear(usuario) {
        if (!window.confirm(`¿Restablecer la contraseña de ${usuario.usuario}?`)) return;
        try {
            const { data } = await api.put(`/usuarios/${usuario.id}/reset-password`);
            window.alert(`${data.mensaje}\n\nContraseña temporal: ${data.passwordTemporal}`);
        } catch (e) { setError(e.response?.data?.mensaje || "No fue posible restablecer la contraseña."); }
    }

    async function eliminarAsesor(usuario) {
        const motivo = window.prompt(`Escribe el motivo para eliminar a ${usuario.asesor || usuario.usuario}:`);
        if (motivo === null) return;
        if (motivo.trim().length < 5) { setError("El motivo debe tener al menos 5 caracteres."); return; }
        if (!window.confirm(`Se desactivará el acceso de ${usuario.usuario} y el asesor quedará inactivo. Se conservarán ventas, jornadas y auditoría. ¿Continuar?`)) return;
        try {
            await api.delete(`/usuarios/${usuario.id}`, { data: { motivo: motivo.trim() } });
            setMensaje("Asesor eliminado mediante baja lógica; el historial fue conservado.");
            await cargar();
        } catch (e) { setError(e.response?.data?.mensaje || "No fue posible eliminar el asesor."); }
    }

    return <section style={{ marginTop: 24, background: "#fff", border: "1px solid #dcebe2", borderRadius: 12, padding: 18 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
            <div><h2 style={{ margin: 0, color: "#245b3a" }}>Administración de usuarios</h2><p style={{ color: "#66756b" }}>Crear, editar, activar y restablecer acceso.</p></div>
            <button type="button" onClick={abrirNuevo} style={{ ...boton, background: "#245b3a", color: "#fff" }}>+ Nuevo usuario</button>
        </div>
        <input aria-label="Buscar usuario" placeholder="Buscar por usuario, correo, asesor o rol..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)} style={{ ...caja, margin: "8px 0 16px" }} />
        {error && <p role="alert" style={{ color: "#b02a37", fontWeight: 700 }}>{error}</p>}
        {mensaje && <p role="status" style={{ color: "#198754", fontWeight: 700 }}>{mensaje}</p>}
        {cargando ? <p>Cargando usuarios...</p> : <div style={{ overflowX: "auto" }}><table style={{ width: "100%", borderCollapse: "collapse", minWidth: 880 }}><thead><tr>{["Usuario", "Asesor", "Correo", "Rol", "Estado", "Acciones"].map((h) => <th key={h} style={{ textAlign: "left", padding: 9, background: "#f7fbf8" }}>{h}</th>)}</tr></thead><tbody>{filtrados.length === 0 ? <tr><td colSpan="6" style={{ padding: 14 }}>No existen usuarios.</td></tr> : filtrados.map((u) => <tr key={u.id} style={{ borderBottom: "1px solid #eee" }}><td style={{ padding: 9, fontWeight: 700 }}>{u.usuario}</td><td style={{ padding: 9 }}>{u.asesor || "—"}</td><td style={{ padding: 9 }}>{u.email || "—"}</td><td style={{ padding: 9 }}>{u.rol}</td><td style={{ padding: 9 }}>{Number(u.activo) === 1 || u.activo === true ? "Activo" : "Inactivo"}</td><td style={{ padding: 9, whiteSpace: "nowrap" }}><button type="button" onClick={() => abrirEdicion(u)} style={{ ...boton, background: "#0d6efd", color: "#fff", marginRight: 5 }}>Editar</button><button type="button" onClick={() => alternar(u)} style={{ ...boton, background: Number(u.activo) === 1 || u.activo === true ? "#dc3545" : "#198754", color: "#fff", marginRight: 5 }}>{Number(u.activo) === 1 || u.activo === true ? "Desactivar" : "Activar"}</button>{u.rol === "ASESOR" && <button type="button" onClick={() => eliminarAsesor(u)} style={{ ...boton, background: "#7a1f2b", color: "#fff", marginRight: 5 }}>Eliminar asesor</button>}<button type="button" onClick={() => resetear(u)} style={{ ...boton, background: "#b8941f", color: "#fff" }}>Contraseña</button></td></tr>)}</tbody></table></div>}
        {abierto && <div role="dialog" aria-modal="true" style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.45)", display: "grid", placeItems: "center", padding: 18, zIndex: 20 }}><form onSubmit={guardar} style={{ background: "#fff", borderRadius: 12, padding: 22, width: "min(520px, 100%)", display: "grid", gap: 10 }}><h3 style={{ marginTop: 0 }}>{editando ? "Editar usuario" : "Nuevo usuario"}</h3>{!editando && <label>Usuario<input required minLength="3" maxLength="50" value={formulario.usuario} onChange={(e) => cambiar("usuario", e.target.value)} style={caja} /></label>}<label>Correo<input type="email" value={formulario.email} onChange={(e) => cambiar("email", e.target.value)} style={caja} /></label><label>Teléfono<input value={formulario.telefono} onChange={(e) => cambiar("telefono", e.target.value)} style={caja} /></label><label>Rol<select value={formulario.rol} onChange={(e) => cambiar("rol", e.target.value)} style={caja}><option value="ASESOR">ASESOR</option><option value="ADMINISTRADOR">ADMINISTRADOR</option></select></label>{!editando && <><label>Asesor vinculado<select required={formulario.rol === "ASESOR"} value={formulario.asesor_id} onChange={(e) => cambiar("asesor_id", e.target.value)} style={caja}><option value="">Seleccionar</option>{asesores.map((a) => <option key={a.id} value={a.id}>{a.nombre}</option>)}</select></label><label>Contraseña inicial<input required type="password" minLength="10" value={formulario.password} onChange={(e) => cambiar("password", e.target.value)} style={caja} /></label></>}<div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 8 }}><button type="button" onClick={() => setAbierto(false)} style={{ ...boton, background: "#e9ecef" }}>Cancelar</button><button type="submit" disabled={guardando} style={{ ...boton, background: "#245b3a", color: "#fff" }}>{guardando ? "Guardando..." : "Guardar"}</button></div></form></div>}
    </section>;
}
