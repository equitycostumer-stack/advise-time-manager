import { useState } from "react";
import { useAuth } from "../context/AuthContext";

export default function Login() {

    const { login } = useAuth();

    const [usuario, setUsuario] = useState("");
    const [password, setPassword] = useState("");
    const [mensaje, setMensaje] = useState("");
    const [cargando, setCargando] = useState(false);

    async function ingresar(e) {

        e.preventDefault();

        setMensaje("");
        setCargando(true);

        try {

            await login(usuario, password);

            window.location.reload();

        } catch (error) {

            setMensaje(

                error.response?.data?.mensaje ||

                "Usuario o contraseña incorrectos."

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
                background:
                    "linear-gradient(135deg,#0b6b3a,#1d8c52,#28a745)",
                fontFamily: "Arial, Helvetica, sans-serif"
            }}
        >

            <form
                onSubmit={ingresar}
                style={{
                    width: 420,
                    background: "#ffffff",
                    borderRadius: 16,
                    padding: 35,
                    boxShadow: "0 15px 40px rgba(0,0,0,.25)"
                }}
            >

                <div
                    style={{
                        textAlign: "center",
                        marginBottom: 25
                    }}
                >

                    <img
                        src="/logo.png"
                        alt="Equity Line"
                        style={{
                            width: 90,
                            marginBottom: 15
                        }}
                        onError={(e) => {
                            e.target.style.display = "none";
                        }}
                    />

                    <h1
                        style={{
                            margin: 0,
                            color: "#000",
                            fontSize: 28
                        }}
                    >
                        Equity Line
                    </h1>

                    <p
                        style={{
                            color: "#555",
                            marginTop: 8,
                            marginBottom: 0,
                            fontSize: 18
                        }}
                    >
                        Time Manager
                    </p>

                </div>

                <label
                    style={{
                        color: "#000",
                        fontWeight: "bold"
                    }}
                >
                    Usuario
                </label>

                <input
                    type="text"
                    placeholder="Ingrese su usuario"
                    value={usuario}
                    onChange={(e) => setUsuario(e.target.value)}
                    autoComplete="username"
                    style={{
                        width: "100%",
                        padding: 14,
                        marginTop: 8,
                        marginBottom: 18,
                        border: "1px solid #ccc",
                        borderRadius: 8,
                        background: "#fff",
                        color: "#000",
                        fontSize: 16,
                        boxSizing: "border-box"
                    }}
                />

                <label
                    style={{
                        color: "#000",
                        fontWeight: "bold"
                    }}
                >
                    Contraseña
                </label>

                <input
                    type="password"
                    placeholder="Ingrese su contraseña"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    style={{
                        width: "100%",
                        padding: 14,
                        marginTop: 8,
                        border: "1px solid #ccc",
                        borderRadius: 8,
                        background: "#fff",
                        color: "#000",
                        fontSize: 16,
                        boxSizing: "border-box"
                    }}
                />

                <button
                    type="submit"
                    disabled={cargando}
                    style={{
                        width: "100%",
                        marginTop: 25,
                        padding: 14,
                        background: "#198754",
                        color: "#fff",
                        border: "none",
                        borderRadius: 8,
                        cursor: "pointer",
                        fontWeight: "bold",
                        fontSize: 16
                    }}
                >
                    {
                        cargando
                            ? "Ingresando..."
                            : "Ingresar"
                    }
                </button>

                {
                    mensaje && (

                        <div
                            style={{
                                marginTop: 20,
                                padding: 12,
                                background: "#ffe5e5",
                                color: "#b00020",
                                borderRadius: 8,
                                textAlign: "center",
                                fontWeight: "bold"
                            }}
                        >
                            {mensaje}
                        </div>

                    )
                }

            </form>

        </div>

    );

}