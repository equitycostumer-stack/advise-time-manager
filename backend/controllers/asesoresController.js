const repository = require("../repositories/asesoresRepository");

class AsesoresController {
    async obtenerAsesores(req, res) {
        try {
            const asesores = await repository.obtenerActivos();
            return res.status(200).json(asesores);
        } catch (error) {
            console.error("Error obteniendo asesores:", error.code || error.message);
            return res.status(500).json({ ok: false, mensaje: "Error obteniendo asesores." });
        }
    }

    async obtenerActivosParaAdministracion(req, res) {
        try {
            const asesores = await repository.obtenerActivosParaAdministracion();
            return res.status(200).json({ ok: true, data: asesores });
        } catch (error) {
            console.error("Error obteniendo configuración de asesores:", error.code || error.message);
            return res.status(500).json({ ok: false, mensaje: "No fue posible cargar la configuración de asesores." });
        }
    }

    async actualizarGenero(req, res) {
        const id = Number(req.params.id);
        if (!Number.isInteger(id) || id < 1) {
            return res.status(400).json({ ok: false, mensaje: "El identificador del asesor no es válido." });
        }

        const recibido = req.body?.genero;
        if (recibido === undefined) {
            return res.status(400).json({ ok: false, mensaje: "Selecciona masculino, femenino o sin definir." });
        }
        const genero = recibido === null || recibido === "" ? null : String(recibido).trim().toUpperCase();
        if (genero !== null && !["MASCULINO", "FEMENINO"].includes(genero)) {
            return res.status(400).json({ ok: false, mensaje: "El valor debe ser masculino, femenino o sin definir." });
        }

        try {
            const asesor = await repository.actualizarGenero(id, genero);
            if (!asesor) return res.status(404).json({ ok: false, mensaje: "No se encontró el asesor." });
            return res.status(200).json({ ok: true, data: asesor, mensaje: "Configuración de reconocimiento actualizada." });
        } catch (error) {
            console.error("Error guardando género del asesor:", error.code || error.message);
            return res.status(500).json({ ok: false, mensaje: "No fue posible guardar la configuración del reconocimiento." });
        }
    }
}

module.exports = new AsesoresController();
