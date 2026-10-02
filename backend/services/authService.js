// ======================================================
// TIME MANAGER - Servicio de autenticación JWT
// ======================================================
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const usuariosRepository = require("../repositories/usuariosRepository");

const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "24h";
const MAX_INTENTOS = 5;
const MINUTOS_BLOQUEO = 15;
const HASH_DUMMY = "$2b$12$LQv3c1yqBWQ8J7QmQwqQOe8yY3V3V4p0Yw0f8h5eG3D0F8yQh4v7K";

function exigirSecret() {
    if (!process.env.JWT_SECRET || String(process.env.JWT_SECRET).length < 32) {
        const error = new Error("Error interno de autenticación."); error.status = 500; throw error;
    }
}
function crearToken(usuario) {
    exigirSecret();
    return jwt.sign({ id: usuario.id, asesor_id: usuario.asesor_id, usuario: usuario.usuario, rol: usuario.rol }, process.env.JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}
function error(mensaje, status) { const resultado = new Error(mensaje); resultado.status = status; return resultado; }

class AuthService {
    async login(usuario, password) {
        if (!usuario || !String(usuario).trim() || !password) throw error("El usuario/correo y la contraseña son requeridos.", 400);
        const usuarioDB = await usuariosRepository.obtenerPorUsuario(String(usuario).trim());
        if (!usuarioDB) {
            await bcrypt.compare(String(password), HASH_DUMMY);
            throw error("Usuario o contraseña incorrectos.", 401);
        }
        if (usuarioDB.bloqueado_hasta && new Date(usuarioDB.bloqueado_hasta).getTime() > Date.now()) {
            throw error("La cuenta está temporalmente bloqueada. Intenta nuevamente más tarde.", 429);
        }
        if (!usuarioDB.activo) throw error("Usuario o contraseña incorrectos.", 401);
        const passwordCorrecto = await bcrypt.compare(String(password), usuarioDB.password);
        if (!passwordCorrecto) {
            const intentos = Number(usuarioDB.intentos_fallidos || 0) + 1;
            const bloqueadoHasta = intentos >= MAX_INTENTOS ? new Date(Date.now() + MINUTOS_BLOQUEO * 60000) : null;
            await usuariosRepository.registrarFalloLogin(usuarioDB.id, intentos >= MAX_INTENTOS ? 0 : intentos, bloqueadoHasta);
            throw error(intentos >= MAX_INTENTOS ? "Demasiados intentos fallidos. La cuenta fue bloqueada temporalmente." : "Usuario o contraseña incorrectos.", intentos >= MAX_INTENTOS ? 429 : 401);
        }
        await usuariosRepository.limpiarFallosLogin(usuarioDB.id);
        const token = crearToken(usuarioDB);
        try { await usuariosRepository.actualizarUltimoAcceso(usuarioDB.id); }
        catch (actualizacionError) { console.warn("No fue posible actualizar el último acceso:", actualizacionError.code || actualizacionError.message); }
        return {
            ok: true, mensaje: "Inicio de sesión correcto.", token,
            usuario: {
                id: usuarioDB.id, asesor_id: usuarioDB.asesor_id, usuario: usuarioDB.usuario, email: usuarioDB.email,
                telefono: usuarioDB.telefono, rol: usuarioDB.rol, activo: usuarioDB.activo,
                debe_cambiar_password: Boolean(usuarioDB.debe_cambiar_password)
            }
        };
    }

    renovarToken(payload) { return { ok: true, token: crearToken(payload) }; }

    async cambiarPassword(usuarioId, passwordActual, passwordNueva) {
        if (!passwordActual) throw error("Debe ingresar su contraseña actual.", 400);
        const nueva = String(passwordNueva || "");
        if (nueva.length < 10 || nueva.length > 128 || !/[A-Za-z]/.test(nueva) || !/[0-9]/.test(nueva)) {
            throw error("La nueva contraseña debe tener entre 10 y 128 caracteres e incluir letras y números.", 400);
        }
        const usuarioDB = await usuariosRepository.obtenerPorId(usuarioId);
        if (!usuarioDB) throw error("El usuario no existe.", 404);
        if (!await bcrypt.compare(String(passwordActual), usuarioDB.password)) throw error("La contraseña actual es incorrecta.", 401);
        if (await bcrypt.compare(nueva, usuarioDB.password)) throw error("La nueva contraseña debe ser diferente.", 400);
        await usuariosRepository.actualizarPasswordPropia(usuarioId, await bcrypt.hash(nueva, 12));
        return { ok: true, mensaje: "Contraseña actualizada correctamente." };
    }
}
module.exports = new AuthService();
