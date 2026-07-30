import axios from "axios";

const api = axios.create({
    baseURL: "https://advise-time-manager-production.up.railway.app",
});

export default api;