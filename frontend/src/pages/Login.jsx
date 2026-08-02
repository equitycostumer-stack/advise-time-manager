import { useState } from "react";
import { useAuth } from "../context/AuthContext";

export default function Login() {

    const { login } = useAuth();

    const [usuario, setUsuario] = useState("");
    const [password, setPassword] = useState("");
    const [mensaje, setMensaje] = useState("");

    async function ingresar(e) {

        e.preventDefault();

        try {

            await login(usuario, password);

            window.location.reload();

        } catch (error) {

            setMensaje(

                error.response?.data?.mensaje ||

                "Error al iniciar sesión."

            );

        }

    }

    return (

        <div
            style={{
                width: "100%",
                height: "100vh",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                background: "#f4f6f9"
            }}
        >

            <form
                onSubmit={ingresar}
                style={{
                    width: 380,
                    padding: 30,
                    background: "#fff",
                    borderRadius: 10,
                    boxShadow: "0 10px 30px rgba(0,0,0,.15)"
                }}
            >

                <h2>Equity Line</h2>

                <p>Time Manager</p>

                <input
                    type="text"
                    placeholder="Usuario"
                    value={usuario}
                    onChange={(e) => setUsuario(e.target.value)}
                    style={{
                        width: "100%",
                        padding: 12,
                        marginTop: 15
                    }}
                />

                <input
                    type="password"
                    placeholder="Contraseña"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    style={{
                        width: "100%",
                        padding: 12,
                        marginTop: 10
                    }}
                />

                <button
                    style={{
                        width: "100%",
                        marginTop: 20,
                        padding: 12,
                        cursor: "pointer"
                    }}
                >
                    Ingresar
                </button>

                {

                    mensaje && (

                        <p
                            style={{
                                color: "red",
                                marginTop: 15
                            }}
                        >
                            {mensaje}
                        </p>

                    )

                }

            </form>

        </div>

    );

}