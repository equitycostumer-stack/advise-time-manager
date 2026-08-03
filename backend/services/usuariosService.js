// ======================================================
// EQUITY LINE PROFESSIONAL SERVICES
// TIME MANAGER
// Usuarios Service
// ======================================================

const bcrypt = require("bcryptjs");
const usuariosRepository = require("../repositories/usuariosRepository");

class UsuariosService {

    // ======================================================
    // LISTAR USUARIOS
    // ======================================================

    async listarUsuarios() {

        const usuarios =
            await usuariosRepository.listar();

        return {

            ok: true,

            total: usuarios.length,

            usuarios

        };

    }

    // ======================================================
    // CREAR USUARIO
    // ======================================================

    async crearUsuario(datos) {

        const {

            asesor_id = null,

            usuario,

            email = null,

            telefono = null,

            password,

            rol

        } = datos;


        // --------------------------------------------------
        // VALIDACIONES
        // --------------------------------------------------

        if (!usuario) {

            throw new Error(
                "Debe ingresar un usuario."
            );

        }

        if (!password) {

            throw new Error(
                "Debe ingresar una contraseña."
            );

        }

        if (!rol) {

            throw new Error(
                "Debe indicar el rol."
            );

        }


        // --------------------------------------------------
        // VALIDAR USUARIO EXISTENTE
        // --------------------------------------------------

        const existe =

            await usuariosRepository.existeUsuario(
                usuario
            );

        if (existe) {

            throw new Error(
                "El usuario ya existe."
            );

        }


        // --------------------------------------------------
        // ENCRIPTAR PASSWORD
        // --------------------------------------------------

        const passwordHash =

            await bcrypt.hash(
                password,
                10
            );


        // --------------------------------------------------
        // CREAR USUARIO
        // --------------------------------------------------

        const id =

            await usuariosRepository.crear({

                asesor_id,

                usuario,

                email,

                telefono,

                password: passwordHash,

                rol

            });


        return {

            ok: true,

            mensaje:
                "Usuario creado correctamente.",

            id

        };

    }

    // ======================================================
    // ACTUALIZAR USUARIO
    // ======================================================

    async actualizarUsuario(id, datos) {

        const usuario =

            await usuariosRepository.obtenerPorId(id);

        if (!usuario) {

            throw new Error(
                "El usuario no existe."
            );

        }


        const informacion = {

            email:
                datos.email ?? usuario.email,

            telefono:
                datos.telefono ?? usuario.telefono,

            rol:
                datos.rol ?? usuario.rol,

            activo:

                datos.activo !== undefined

                    ? datos.activo

                    : usuario.activo

        };


        await usuariosRepository.actualizar(

            id,

            informacion

        );


        return {

            ok: true,

            mensaje:
                "Usuario actualizado correctamente."

        };

    }

    // ======================================================
    // RESTABLECER CONTRASEÑA
    // ======================================================

    async resetearPassword(id) {

        const usuario =

            await usuariosRepository.obtenerPorId(id);

        if (!usuario) {

            throw new Error(
                "El usuario no existe."
            );

        }


        // --------------------------------------------------
        // CONTRASEÑA TEMPORAL
        // --------------------------------------------------

        const passwordTemporal =

            "Admin123*";


        // --------------------------------------------------
        // ENCRIPTAR
        // --------------------------------------------------

        const passwordHash =

            await bcrypt.hash(

                passwordTemporal,

                10

            );


        // --------------------------------------------------
        // ACTUALIZAR
        // --------------------------------------------------

        await usuariosRepository.actualizarPassword(

            id,

            passwordHash

        );


        return {

            ok: true,

            mensaje:
                "Contraseña restablecida correctamente.",

            passwordTemporal,

            debe_cambiar_password: true

        };

    }

}

module.exports = new UsuariosService();