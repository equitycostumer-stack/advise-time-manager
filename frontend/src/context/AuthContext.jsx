import { createContext, useContext, useState } from "react";
import api from "../services/api";

const AuthContext = createContext();

export function AuthProvider({ children }) {

    const [usuario, setUsuario] = useState(null);

    async function login(usuarioLogin, password) {

        const { data } = await api.post("/auth/login", {
            usuario: usuarioLogin,
            password
        });

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

    return (

        <AuthContext.Provider
            value={{
                usuario,
                login,
                logout
            }}
        >

            {children}

        </AuthContext.Provider>

    );

}

export function useAuth() {

    return useContext(AuthContext);

}