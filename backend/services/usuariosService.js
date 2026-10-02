// ======================================================
// EQUITY LINE PROFESSIONAL SERVICES - USUARIOS SERVICE
// ======================================================
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const usuariosRepository = require("../repositories/usuariosRepository");

const ROLES = new Set(["ASESOR", "ADMINISTRADOR"]);
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USUARIO = /^[a-zA-Z0-9._-]{3,50}$/;

function error(mensaje, status = 400) {
    const resultado = new Error(mensaje); resultado.status = status; return resultado;
}

function normalizarEmail(valor) {
    const email = valor == null || String(valor).trim() === "" ? null : String(valor).trim().toLowerCase();
    if (email && (email.length > 160 || !EMAIL.test(email))) throw error("El correo electrónico no es válido.");
    return email;
}

function normalizarTelefono(valor) {
    const telefono = valor == null || String(valor).trim() === "" ? null : String(valor).trim();
    if (telefono && !/^[0-9+()\-\s]{7,30}$/.test(telefono)) throw error("El teléfono no es válido.");
    return telefono;
}

function validarPassword(password) {
    const valor = String(password || "");
    if (valor.length < 10 || valor.length > 128) throw error("La contraseña debe tener entre 10 y 128 caracteres.");
    if (!/[A-Za-z]/.test(valor) || !/[0-9]/.test(valor)) throw error("La contraseña debe incluir letras y números.");
    return valor;
}

function passwordTemporal() {
    return `Tmp-${crypto.randomBytes(9).toString("base64url")}-9a`;
}

class UsuariosService {
    async listarUsuarios() {
        const usuarios = await usuariosRepository.listar();
        return { ok: true, total: usuarios.length, usuarios };
    }

    validarRol(rol) {
        const normalizado = String(rol || "").trim().toUpperCase();
        if (!ROLES.has(normalizado)) throw error("El rol seleccionado no es válido.");
        return normalizado;
    }

    async crearUsuario(datos) {
        const usuario = String(datos.usuario || "").trim();
        if (!USUARIO.test(usuario)) throw error("El usuario debe tener entre 3 y 50 caracteres y solo puede usar letras, números, punto, guion o guion bajo.");
        const password = validarPassword(datos.password);
        const rol = this.validarRol(datos.rol);
        const asesorId = datos.asesor_id == null || datos.asesor_id === "" ? null : Number(datos.asesor_id);
        if (asesorId !== null && (!Number.isInteger(asesorId) || asesorId <= 0)) throw error("El asesor vinculado no es válido.");
        if (rol === "ASESOR" && !asesorId) throw error("Un usuario ASESOR debe tener un asesor vinculado.");
        const email = normalizarEmail(datos.email);
        const telefono = normalizarTelefono(datos.telefono);
        if (await usuariosRepository.existeUsuario(usuario, email)) throw error("El usuario o correo ya existe.", 409);
        const id = await usuariosRepository.crear({ asesor_id: asesorId, usuario, email, telefono, password: await bcrypt.hash(password, 12), rol });
        return { ok: true, mensaje: "Usuario creado correctamente.", id };
    }

    async actualizarUsuario(id, datos, actor = null) {
        if (!Number.isInteger(Number(id)) || Number(id) <= 0) throw error("El usuario indicado no es válido.");
        const usuario = await usuariosRepository.obtenerPorId(Number(id));
        if (!usuario) throw error("El usuario no existe.", 404);
        const rol = this.validarRol(datos.rol ?? usuario.rol);
        const asesorId = datos.asesor_id === undefined || datos.asesor_id === ""
            ? (usuario.asesor_id || null)
            : Number(datos.asesor_id);
        if (asesorId !== null && (!Number.isInteger(asesorId) || asesorId <= 0)) throw error("El asesor vinculado no es válido.");
        const activo = datos.activo !== undefined ? Boolean(datos.activo) : Boolean(usuario.activo);
        if (actor && Number(actor.id) === Number(id) && (!activo || rol !== "ADMINISTRADOR")) throw error("No puedes desactivar ni quitarte tus propios permisos de administrador.", 409);
        if (rol === "ASESOR" && !asesorId) throw error("Un usuario ASESOR debe tener un asesor vinculado.");
        const email = normalizarEmail(datos.email ?? usuario.email);
        const telefono = normalizarTelefono(datos.telefono ?? usuario.telefono);
        if (await usuariosRepository.existeUsuarioExcepto(usuario.usuario, email, Number(id))) throw error("El usuario o correo ya existe.", 409);
        await usuariosRepository.actualizar(Number(id), { asesor_id: asesorId, email, telefono, rol, activo });
        return { ok: true, mensaje: "Usuario actualizado correctamente." };
    }

    async resetearPassword(id) {
        if (!Number.isInteger(Number(id)) || Number(id) <= 0) throw error("El usuario indicado no es válido.");
        if (!await usuariosRepository.obtenerPorId(Number(id))) throw error("El usuario no existe.", 404);
        const temporal = passwordTemporal();
        await usuariosRepository.actualizarPassword(Number(id), await bcrypt.hash(temporal, 12));
        return { ok: true, mensaje: "Contraseña restablecida correctamente.", passwordTemporal: temporal, debe_cambiar_password: true };
    }
}
module.exports = new UsuariosService();
