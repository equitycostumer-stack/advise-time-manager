// ======================================================
// EQUITY LINE PROFESSIONAL SERVICES
// TIME MANAGER
// Usuarios API
// ======================================================

import api from "./api";

// ======================================================
// LISTAR USUARIOS
// ======================================================

export const listarUsuarios = async () => {

    const { data } = await api.get(
        "/usuarios"
    );

    return data;

};

// ======================================================
// CREAR USUARIO
// ======================================================

export const crearUsuario = async (
    usuario
) => {

    const { data } = await api.post(

        "/usuarios",

        usuario

    );

    return data;

};

// ======================================================
// ACTUALIZAR USUARIO
// ======================================================

export const actualizarUsuario = async (

    id,

    usuario

) => {

    const { data } = await api.put(

        `/usuarios/${id}`,

        usuario

    );

    return data;

};

// ======================================================
// RESTABLECER CONTRASEÑA
// ======================================================

export const resetearPassword = async (
    id
) => {

    const { data } = await api.put(

        `/usuarios/${id}/reset-password`

    );

    return data;

};