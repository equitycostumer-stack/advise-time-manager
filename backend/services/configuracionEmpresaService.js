const repository = require("../repositories/configuracionEmpresaRepository");

class ConfiguracionEmpresaService {
    async obtener() {
        return repository.obtener();
    }

    async actualizar(datos, usuarioId) {
        const campos = ["nombre_empresa", "nombre_corto", "coach", "customer_service", "jefe", "mensaje_dia"];
        for (const campo of campos) {
            if (!String(datos[campo] || "").trim()) {
                throw new Error(`El campo ${campo} es obligatorio.`);
            }
        }
        return repository.actualizar({
            nombre_empresa: String(datos.nombre_empresa).trim(),
            nombre_corto: String(datos.nombre_corto).trim(),
            coach: String(datos.coach).trim(),
            customer_service: String(datos.customer_service).trim(),
            jefe: String(datos.jefe).trim(),
            mensaje_dia: String(datos.mensaje_dia).trim(),
            correo_contacto: datos.correo_contacto ? String(datos.correo_contacto).trim() : null,
            telefono_contacto: datos.telefono_contacto ? String(datos.telefono_contacto).trim() : null
        }, usuarioId);
    }
}

module.exports = new ConfiguracionEmpresaService();
