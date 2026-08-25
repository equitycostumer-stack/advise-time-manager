import { useState } from "react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

export default function CambiarPassword() {

    const { usuario, actualizarUsuario, logout } = useAuth();

    const [passwordActual, setPasswordActual] = useState("");
    const [passwordNueva, setPasswordNueva] = useState("");
    const [passwordConfirmar, setPasswordConfirmar] = useState("");
    const [mensaje, setMensaje] = useState("");
    const [cargando, setCargando] = useState(false);

    async function guardar(e) {

        e.preventDefault();

        setMensaje("");

        if (passwordNueva !== passwordConfirmar) {
            setMensaje("Las contraseñas nuevas no coinciden.");
            return;
        }

        setCargando(true);

        try {

            await api.put("/auth/cambiar-password", {
                passwordActual,
                passwordNueva
            });

            actualizarUsuario({
                ...usuario,
                debe_cambiar_password: false
            });

            alert("✅ Contraseña actualizada correctamente.");

        } catch (error) {

            setMensaje(
                error.response?.data?.mensaje ||
                "No fue posible actualizar la contraseña."
            );

        } finally {

            setCargando(false);

        }

    }

    return (

        <div
            style={{
                width: "100%",
                minHeight: "100vh",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                background: "linear-gradient(135deg,#0b6b3a,#1d8c52,#28a745)",
                fontFamily: "Arial, Helvetica, sans-serif"
            }}
        >

            <form
                onSubmit={guardar}
                style={{
                    width: 420,
                    background: "#ffffff",
                    borderRadius: 16,
                    padding: 35,
                    boxShadow: "0 15px 40px rgba(0,0,0,.25)"
                }}
            >

                <h2 style={{ marginTop: 0, textAlign: "center", color: "#000" }}>
                    🔒 Debes cambiar tu contraseña
                </h2>

                <p style={{ textAlign: "center", color: "#555", marginBottom: 25 }}>
                    Por seguridad, define una nueva contraseña antes de continuar.
                </p>

                <label style={{ color: "#000", fontWeight: "bold" }}>
                    Contraseña actual
                </label>

                <input
                    type="password"
                    value={passwordActual}
                    onChange={(e) => setPasswordActual(e.target.value)}
                    autoComplete="current-password"
                    style={{
                        width: "100%", padding: 14, marginTop: 8, marginBottom: 18,
                        border: "1px solid #ccc", borderRadius: 8,
                        boxSizing: "border-box", fontSize: 16
                    }}
                />

                <label style={{ color: "#000", fontWeight: "bold" }}>
                    Nueva contraseña
                </label>

                <input
                    type="password"
                    value={passwordNueva}
                    onChange={(e) => setPasswordNueva(e.target.value)}
                    autoComplete="new-password"
                    style={{
                        width: "100%", padding: 14, marginTop: 8, marginBottom: 18,
                        border: "1px solid #ccc", borderRadius: 8,
                        boxSizing: "border-box", fontSize: 16
                    }}
                />

                <label style={{ color: "#000", fontWeight: "bold" }}>
                    Confirmar nueva contraseña
                </label>

                <input
                    type="password"
                    value={passwordConfirmar}
                    onChange={(e) => setPasswordConfirmar(e.target.value)}
                    autoComplete="new-password"
                    style={{
                        width: "100%", padding: 14, marginTop: 8,
                        border: "1px solid #ccc", borderRadius: 8,
                        boxSizing: "border-box", fontSize: 16
                    }}
                />

                <button
                    type="submit"
                    disabled={cargando}
                    style={{
                        width: "100%", marginTop: 25, padding: 14,
                        background: "#198754", color: "#fff", border: "none",
                        borderRadius: 8, cursor: "pointer", fontWeight: "bold", fontSize: 16
                    }}
                >
                    {cargando ? "Guardando..." : "Guardar y continuar"}
                </button>

                <button
                    type="button"
                    onClick={logout}
                    style={{
                        width: "100%", marginTop: 12, padding: 12,
                        background: "transparent", color: "#888", border: "none",
                        cursor: "pointer", fontSize: 14, textDecoration: "underline"
                    }}
                >
                    Cancelar y cerrar sesión
                </button>

                {mensaje && (
                    <div style={{
                        marginTop: 20, padding: 12, background: "#ffe5e5",
                        color: "#b00020", borderRadius: 8, textAlign: "center", fontWeight: "bold"
                    }}>
                        {mensaje}
                    </div>
                )}

            </form>

        </div>

    );

}