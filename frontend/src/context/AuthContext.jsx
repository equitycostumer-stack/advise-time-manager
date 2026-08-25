import { createContext, useContext, useState } from "react";
import api from "../services/api";

const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [usuario, setUsuario] = useState(() => {
        try {
            const guardado = localStorage.getItem("usuario");
            return guardado ? JSON.parse(guardado) : null;
        } catch {
            return null;
        }
    });

    async function login(usuarioLogin, password) {
        // Enviar datos limpios de espacios
        const bodyData = {
            usuario: usuarioLogin.trim(), // Cambia 'usuario' por 'username' o 'email' si tu backend lo requiere
            password: password
        };

        const { data } = await api.post("/auth/login", bodyData);

        localStorage.setItem("token", data.token);
        localStorage.setItem("usuario", JSON.stringify(data.usuario));

        setUsuario(data.usuario);

        return data.usuario;
    }

    function logout() {
        localStorage.removeItem("token");
        localStorage.removeItem("usuario");
        setUsuario(null);
    }

    function actualizarUsuario(nuevoUsuario) {
        localStorage.setItem("usuario", JSON.stringify(nuevoUsuario));
        setUsuario(nuevoUsuario);
    }

    return (
        <AuthContext.Provider
            value={{
                usuario,
                login,
                logout,
                actualizarUsuario
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}