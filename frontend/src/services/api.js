// ======================================================
// EQUITY LINE PROFESSIONAL SERVICES
// TIME MANAGER
// API SERVICE
// ======================================================

import axios from "axios";

const api = axios.create({

    baseURL: import.meta.env.VITE_API_URL,

    headers: {

        "Content-Type": "application/json"

    }

});

// ======================================================
// AGREGAR TOKEN JWT AUTOMÁTICAMENTE
// ======================================================

api.interceptors.request.use(

    (config) => {

        const token = localStorage.getItem("token");

        if (token) {

            config.headers.Authorization = `Bearer ${token}`;

        }

        return config;

    },

    (error) => {

        return Promise.reject(error);

    }

);

// ======================================================
// MANEJO GLOBAL DE ERRORES
// ======================================================

api.interceptors.response.use(

    (response) => response,

    (error) => {

        if (error.response?.status === 401) {

            localStorage.removeItem("token");

            localStorage.removeItem("usuario");

            // Forzar recarga para que App.jsx detecte que ya
            // no hay token y muestre la pantalla de Login
            // automáticamente, en vez de dejar la app
            // "congelada" con una sesión inválida.
            window.location.reload();

        }

        return Promise.reject(error);

    }

);

export default api;