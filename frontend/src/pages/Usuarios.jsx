import { useEffect, useMemo, useState } from "react";
import api from "../services/api";

const inicial = { usuario: "", email: "", telefono: "", rol: "ASESOR", asesor_id: "", password: "" };
const caja = { padding: 9, border: "1px solid #ccd8d0", borderRadius: 7, width: "100%", boxSizing: "border-box" };
const boton = { border: 0, borderRadius: 8, padding: "9px 12px", cursor: "pointer", fontWeight: 700 };
const TAMANO_MAXIMO_FOTO = 120 * 1024;

async function optimizarFoto(archivo) {
    if (!archivo || !["image/jpeg", "image/png", "image/webp"].includes(archivo.type)) throw new Error("Selecciona una imagen JPG, PNG o WebP.");
    if (archivo.size > 10 * 1024 * 1024) throw new Error("La imagen original no puede superar 10 MB.");

    const url = URL.createObjectURL(archivo);
    const imagen = new Image();
    try {
        await new Promise((resolve, reject) => {
            imagen.onload = resolve;
            imagen.onerror = () => reject(new Error("No se pudo leer la imagen seleccionada."));
            imagen.src = url;
        });

        for (const [ladoMaximo, calidad] of [[512, 0.78], [384, 0.62], [256, 0.5]]) {
            const escala = Math.min(1, ladoMaximo / Math.max(imagen.naturalWidth, imagen.naturalHeight));
            const canvas = document.createElement("canvas");
            canvas.width = Math.max(1, Math.round(imagen.naturalWidth * escala));
            canvas.height = Math.max(1, Math.round(imagen.naturalHeight * escala));
            const contexto = canvas.getContext("2d");
            if (!contexto) throw new Error("No se pudo procesar la imagen.");
            contexto.drawImage(imagen, 0, 0, canvas.width, canvas.height);

            const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", calidad));
            if (!blob || blob.size > TAMANO_MAXIMO_FOTO) continue;
            return await new Promise((resolve, reject) => {
                const lector = new FileReader();
                lector.onload = () => resolve(lector.result);
                lector.onerror = () => reject(new Error("No se pudo preparar la foto."));
                lector.readAsDataURL(blob);
            });
        }
        throw new Error("La foto sigue siendo demasiado grande. Prueba con otra imagen.");
    } finally {
        URL.revokeObjectURL(url);
    }
}

export default function Usuarios() {
    const [usuarios, setUsuarios] = useState([]);
    const [asesores, setAsesores] = useState([]);
    const [busqueda, setBusqueda] = useState("");
    const [formulario, setFormulario] = useState(inicial);
    const [editando, setEditando] = useState(null);
    const [abierto, setAbierto] = useState(false);
    const [cargando, setCargando] = useState(true);
    const [guardando, setGuardando] = useState(false);
    const [generoGuardando, setGeneroGuardando] = useState({});
    const [fotoGuardando, setFotoGuardando] = useState({});
    const [mensaje, setMensaje] = useState("");
    const [error, setError] = useState("");

    async function cargar() {
        setCargando(true); setError("");
        try {
            const [usuariosRes, asesoresRes] = await Promise.all([api.get("/usuarios"), api.get("/asesores/administracion")]);
            setUsuarios(Array.isArray(usuariosRes.data?.usuarios) ? usuariosRes.data.usuarios : []);
            const lista = Array.isArray(asesoresRes.data?.data) ? asesoresRes.data.data : asesoresRes.data;
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

    async function actualizarGeneroAsesor(asesor, valor) {
        const genero = valor || null;
        const generoAnterior = asesor.genero || "";
        setError(""); setMensaje("");
        setAsesores((actuales) => actuales.map((actual) => actual.id === asesor.id ? { ...actual, genero } : actual));
        setGeneroGuardando((actual) => ({ ...actual, [asesor.id]: true }));
        try {
            await api.put(`/asesores/${asesor.id}/genero`, { genero });
            setMensaje(`Forma del reconocimiento guardada para ${asesor.nombre}.`);
            window.dispatchEvent(new Event("genero-asesor-actualizado"));
        } catch (e) {
            setAsesores((actuales) => actuales.map((actual) => actual.id === asesor.id ? { ...actual, genero: generoAnterior || null } : actual));
            setError(e.response?.data?.mensaje || `No fue posible guardar la forma del reconocimiento para ${asesor.nombre}.`);
        } finally {
            setGeneroGuardando((actual) => ({ ...actual, [asesor.id]: false }));
        }
    }

    async function guardarFotoAsesor(asesor, archivo = null) {
        setError(""); setMensaje("");
        setFotoGuardando((actual) => ({ ...actual, [asesor.id]: true }));
        try {
            const foto_data = archivo ? await optimizarFoto(archivo) : null;
            const { data } = await api.put(`/asesores/${asesor.id}/foto`, { foto_data });
            const fotoGuardada = data?.data?.foto_data ?? null;
            setAsesores((actuales) => actuales.map((actual) => actual.id === asesor.id ? { ...actual, foto_data: fotoGuardada } : actual));
            setMensaje(fotoGuardada ? `Foto guardada para ${asesor.nombre}.` : `Foto retirada para ${asesor.nombre}.`);
            window.dispatchEvent(new Event("datos-actualizados"));
        } catch (e) {
            setError(e.response?.data?.mensaje || e.message || `No fue posible guardar la foto de ${asesor.nombre}.`);
        } finally {
            setFotoGuardando((actual) => ({ ...actual, [asesor.id]: false }));
        }
    }

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
        <div style={{ margin: "14px 0 22px", padding: 14, border: "1px solid #dcebe2", borderRadius: 10 }}>
            <h3 style={{ margin: "0 0 6px", color: "#245b3a" }}>Perfil de los asesores</h3>
            <p style={{ margin: "0 0 12px", color: "#66756b", fontSize: 14 }}>Configura el nombre del reconocimiento y adjunta una foto de perfil; aparecerá junto al nombre en la tarjeta de estado de jornada. Se aceptan imágenes JPG, PNG o WebP de hasta 10 MB; se optimizan automáticamente.</p>
            {cargando ? <p>Cargando asesores...</p> : asesores.length === 0 ? <p>No hay asesores activos para configurar.</p> : <div style={{ overflowX: "auto" }}><table style={{ width: "100%", borderCollapse: "collapse", minWidth: 720 }}><thead><tr>{["Asesor", "Estado", "Forma del reconocimiento", "Foto de perfil"].map((h) => <th key={h} style={{ textAlign: "left", padding: 9, background: "#f7fbf8" }}>{h}</th>)}</tr></thead><tbody>{asesores.map((a) => <tr key={a.id} style={{ borderBottom: "1px solid #eee" }}><td style={{ padding: 9, fontWeight: 700 }}>{a.nombre}</td><td style={{ padding: 9 }}>{Number(a.activo) === 1 || a.activo === true ? "Activo" : "Inactivo"}</td><td style={{ padding: 9 }}><select aria-label={`Forma del reconocimiento para ${a.nombre}`} value={a.genero || ""} disabled={Boolean(generoGuardando[a.id])} onChange={(e) => actualizarGeneroAsesor(a, e.target.value)} style={caja}><option value="">Sin definir</option><option value="FEMENINO">Femenino · Mejor asesora</option><option value="MASCULINO">Masculino · Mejor asesor</option></select>{generoGuardando[a.id] && <small role="status" style={{ display: "block", marginTop: 4 }}>Guardando...</small>}</td><td style={{ padding: 9, minWidth: 205 }}><div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>{a.foto_data ? <img src={a.foto_data} alt={`Foto de ${a.nombre}`} style={{ width: 38, height: 38, borderRadius: "50%", objectFit: "cover", border: "2px solid #dcebe2" }} /> : <svg viewBox="0 0 24 24" aria-hidden="true" style={{ width: 38, height: 38, padding: 8, boxSizing: "border-box", borderRadius: "50%", background: "#e8f7ee", color: "#198754" }}><circle cx="12" cy="8" r="4" fill="currentColor" /><path d="M4 21c.4-4.2 3.6-7 8-7s7.6 2.8 8 7H4Z" fill="currentColor" /></svg>}<label style={{ ...boton, display: "inline-block", position: "relative", overflow: "hidden", background: "#e8f2ec", color: "#245b3a", cursor: fotoGuardando[a.id] ? "wait" : "pointer", opacity: fotoGuardando[a.id] ? 0.65 : 1 }}>{fotoGuardando[a.id] ? "Guardando..." : a.foto_data ? "Cambiar" : "Adjuntar foto"}<input type="file" accept="image/jpeg,image/png,image/webp" aria-label={`${a.foto_data ? "Cambiar" : "Adjuntar"} foto de ${a.nombre}`} disabled={Boolean(fotoGuardando[a.id])} onChange={(e) => { const archivo = e.target.files?.[0]; if (archivo) guardarFotoAsesor(a, archivo); e.target.value = ""; }} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0, cursor: "pointer" }} /></label>{a.foto_data && <button type="button" disabled={Boolean(fotoGuardando[a.id])} onClick={() => guardarFotoAsesor(a)} style={{ ...boton, background: "#fff0f1", color: "#a52834" }}>Quitar</button>}</div></td></tr>)}</tbody></table></div>}
        </div>
        {cargando ? <p>Cargando usuarios...</p> : <div style={{ overflowX: "auto" }}><table style={{ width: "100%", borderCollapse: "collapse", minWidth: 880 }}><thead><tr>{["Usuario", "Asesor", "Correo", "Rol", "Estado", "Acciones"].map((h) => <th key={h} style={{ textAlign: "left", padding: 9, background: "#f7fbf8" }}>{h}</th>)}</tr></thead><tbody>{filtrados.length === 0 ? <tr><td colSpan="6" style={{ padding: 14 }}>No existen usuarios.</td></tr> : filtrados.map((u) => <tr key={u.id} style={{ borderBottom: "1px solid #eee" }}><td style={{ padding: 9, fontWeight: 700 }}>{u.usuario}</td><td style={{ padding: 9 }}>{u.asesor || "—"}</td><td style={{ padding: 9 }}>{u.email || "—"}</td><td style={{ padding: 9 }}>{u.rol}</td><td style={{ padding: 9 }}>{Number(u.activo) === 1 || u.activo === true ? "Activo" : "Inactivo"}</td><td style={{ padding: 9, whiteSpace: "nowrap" }}><button type="button" onClick={() => abrirEdicion(u)} style={{ ...boton, background: "#0d6efd", color: "#fff", marginRight: 5 }}>Editar</button><button type="button" onClick={() => alternar(u)} style={{ ...boton, background: Number(u.activo) === 1 || u.activo === true ? "#dc3545" : "#198754", color: "#fff", marginRight: 5 }}>{Number(u.activo) === 1 || u.activo === true ? "Desactivar" : "Activar"}</button>{u.rol === "ASESOR" && <button type="button" onClick={() => eliminarAsesor(u)} style={{ ...boton, background: "#7a1f2b", color: "#fff", marginRight: 5 }}>Eliminar asesor</button>}<button type="button" onClick={() => resetear(u)} style={{ ...boton, background: "#b8941f", color: "#fff" }}>Contraseña</button></td></tr>)}</tbody></table></div>}
        {abierto && <div role="dialog" aria-modal="true" style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.45)", display: "grid", placeItems: "center", padding: 18, zIndex: 20 }}><form onSubmit={guardar} style={{ background: "#fff", borderRadius: 12, padding: 22, width: "min(520px, 100%)", display: "grid", gap: 10 }}><h3 style={{ marginTop: 0 }}>{editando ? "Editar usuario" : "Nuevo usuario"}</h3>{!editando && <label>Usuario<input required minLength="3" maxLength="50" value={formulario.usuario} onChange={(e) => cambiar("usuario", e.target.value)} style={caja} /></label>}<label>Correo<input type="email" value={formulario.email} onChange={(e) => cambiar("email", e.target.value)} style={caja} /></label><label>Teléfono<input value={formulario.telefono} onChange={(e) => cambiar("telefono", e.target.value)} style={caja} /></label><label>Rol<select value={formulario.rol} onChange={(e) => cambiar("rol", e.target.value)} style={caja}><option value="ASESOR">ASESOR</option><option value="ADMINISTRADOR">ADMINISTRADOR</option></select></label>{!editando && <><label>Asesor vinculado<select required={formulario.rol === "ASESOR"} value={formulario.asesor_id} onChange={(e) => cambiar("asesor_id", e.target.value)} style={caja}><option value="">Seleccionar</option>{asesores.map((a) => <option key={a.id} value={a.id}>{a.nombre}</option>)}</select></label><label>Contraseña inicial<input required type="password" minLength="10" value={formulario.password} onChange={(e) => cambiar("password", e.target.value)} style={caja} /></label></>}<div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 8 }}><button type="button" onClick={() => setAbierto(false)} style={{ ...boton, background: "#e9ecef" }}>Cancelar</button><button type="submit" disabled={guardando} style={{ ...boton, background: "#245b3a", color: "#fff" }}>{guardando ? "Guardando..." : "Guardar"}</button></div></form></div>}
    </section>;
}
