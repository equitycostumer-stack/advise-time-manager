// ======================================================
// EQUITY LINE PROFESSIONAL SERVICES
// TIME MANAGER
// Página de Usuarios
// ======================================================

import { useEffect, useMemo, useState } from "react";

import { listarUsuarios } from "../services/usuariosApi";

// ======================================================
// COMPONENTE
// ======================================================

function Usuarios() {

    // ==================================================
    // ESTADOS
    // ==================================================

    const [usuarios, setUsuarios] = useState([]);

    const [busqueda, setBusqueda] = useState("");

    const [cargando, setCargando] = useState(true);

    const [error, setError] = useState("");

    // ==================================================
    // CARGAR USUARIOS
    // ==================================================

    const cargarUsuarios = async () => {

        try {

            setCargando(true);

            setError("");

            const respuesta =
                await listarUsuarios();

            setUsuarios(
                respuesta.usuarios || []
            );

        } catch (err) {

            console.error(err);

            setError(
                "No fue posible cargar los usuarios."
            );

        } finally {

            setCargando(false);

        }

    };

    // ==================================================
    // PRIMERA CARGA
    // ==================================================

    useEffect(() => {

        cargarUsuarios();

    }, []);

    // ==================================================
    // FILTRAR USUARIOS
    // ==================================================

    const usuariosFiltrados = useMemo(() => {

        const texto =
            busqueda
                .trim()
                .toLowerCase();

        if (!texto) {

            return usuarios;

        }

        return usuarios.filter((usuario) => {

            return (

                String(usuario.usuario || "")
                    .toLowerCase()
                    .includes(texto)

                ||

                String(usuario.asesor || "")
                    .toLowerCase()
                    .includes(texto)

                ||

                String(usuario.email || "")
                    .toLowerCase()
                    .includes(texto)

                ||

                String(usuario.rol || "")
                    .toLowerCase()
                    .includes(texto)

            );

        });

    }, [usuarios, busqueda]);

    // ==================================================
    // VISTA
    // ==================================================

    return (

        <div className="usuarios-page">

            {/* CABECERA */}

            <div className="usuarios-header">

                <div>

                    <h1>

                        Administración de Usuarios

                    </h1>

                    <p>

                        Total de usuarios:

                        <strong>

                            {" "}

                            {usuarios.length}

                        </strong>

                    </p>

                </div>

                <button>

                    + Nuevo Usuario

                </button>

            </div>

            {/* BUSCADOR */}

            <input

                type="text"

                placeholder="Buscar usuario..."

                value={busqueda}

                onChange={(e) =>
                    setBusqueda(
                        e.target.value
                    )
                }

            />

            {/* CARGANDO */}

            {

                cargando && (

                    <p>

                        Cargando usuarios...

                    </p>

                )

            }

            {/* ERROR */}

            {

                error && (

                    <p>

                        {error}

                    </p>

                )

            }

            {/* TABLA */}

            {

                !cargando &&
                !error && (

                    <table>

                        <thead>

                            <tr>

                                <th>ID</th>

                                <th>Usuario</th>

                                <th>Asesor</th>

                                <th>Email</th>

                                <th>Rol</th>

                                <th>Estado</th>

                                <th>Acciones</th>

                            </tr>

                        </thead>

                        <tbody>

                            {

                                usuariosFiltrados.length === 0 ? (

                                    <tr>

                                        <td
                                            colSpan="7"
                                        >

                                            No existen usuarios.

                                        </td>

                                    </tr>

                                ) : (

                                    usuariosFiltrados.map((usuario) => (

                                        <tr
                                            key={usuario.id}
                                        >

                                            <td>

                                                {usuario.id}

                                            </td>

                                            <td>

                                                {usuario.usuario}

                                            </td>

                                            <td>

                                                {usuario.asesor || "-"}

                                            </td>

                                            <td>

                                                {usuario.email || "-"}

                                            </td>

                                            <td>

                                                {usuario.rol}

                                            </td>

                                            <td>

                                                {

                                                    Number(usuario.activo) === 1

                                                        ? "Activo"

                                                        : "Inactivo"

                                                }

                                            </td>

                                            <td>

                                                <button>

                                                    Editar

                                                </button>

                                                {" "}

                                                <button>

                                                    Contraseña

                                                </button>

                                            </td>

                                        </tr>

                                    ))

                                )

                            }

                        </tbody>

                    </table>

                )

            }

        </div>

    );

}

export default Usuarios;