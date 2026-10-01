import { createContext, useCallback, useContext, useEffect, useState } from "react";
import api from "../services/api";

const AuthContext = createContext();
const RENOVAR_CADA_MS = 15 * 60 * 1000;

function tokenExpiraPronto(token) {
    try {
        const payload = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
        return !payload.exp || payload.exp * 1000 - Date.now() < 2 * 60 * 60 * 1000;
    } catch {
        return true;
    }
}

export function AuthProvider({ children }) {
    const [usuario, setUsuario] = useState(() => {
        try {
            const guardado = localStorage.getItem("usuario");
            return guardado ? JSON.parse(guardado) : null;
        } catch {
            return null;
        }
    });

    const logout = useCallback(() => {
        localStorage.removeItem("token");
        localStorage.removeItem("usuario");
        setUsuario(null);
    }, []);

    const renovarSesion = useCallback(async () => {
        const token = localStorage.getItem("token");
        if (!token || !tokenExpiraPronto(token)) return;
        try {
            const { data } = await api.post("/auth/refresh");
            if (data.token) localStorage.setItem("token", data.token);
        } catch (error) {
            if (error.response?.status === 401) logout();
        }
    }, [logout]);

    useEffect(() => {
        if (!usuario) return undefined;
        renovarSesion();
        const id = window.setInterval(renovarSesion, RENOVAR_CADA_MS);
        const alVolver = () => renovarSesion();
        window.addEventListener("focus", alVolver);
        return () => {
            window.clearInterval(id);
            window.removeEventListener("focus", alVolver);
        };
    }, [usuario, renovarSesion]);

    async function login(usuarioLogin, password) {
        const { data } = await api.post("/auth/login", {
            usuario: usuarioLogin.trim(),
            password
        });
        localStorage.setItem("token", data.token);
        localStorage.setItem("usuario", JSON.stringify(data.usuario));
        setUsuario(data.usuario);
        return data.usuario;
    }

    function actualizarUsuario(nuevoUsuario) {
        localStorage.setItem("usuario", JSON.stringify(nuevoUsuario));
        setUsuario(nuevoUsuario);
    }

    return (
        <AuthContext.Provider value={{ usuario, login, logout, actualizarUsuario, renovarSesion }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}
