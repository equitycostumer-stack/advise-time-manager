const repository = require("../repositories/asesoresRepository");

class AsesoresController {

    // ==========================================
    // OBTENER ASESORES ACTIVOS
    // ==========================================

    async obtenerAsesores(req, res) {

        try {

            const asesores =
                await repository.obtenerActivos();

            return res.status(200).json(asesores);

        } catch (error) {

            console.error("====================================");
            console.error("ERROR OBTENIENDO ASESORES");
            console.error(error);
            console.error("====================================");

            return res.status(500).json({

                ok: false,

                mensaje: "Error obteniendo asesores."

            });

        }

    }

    async actualizarNombre(req, res) {
        try {
            if (req.usuario?.rol !== "ADMINISTRADOR") {
                return res.status(403).json({ ok: false, mensaje: "Solo los administradores pueden cambiar nombres." });
            }
            const id = Number(req.params.id);
            const nombre = String(req.body?.nombre || "").trim();
            if (!id || nombre.length < 2 || nombre.length > 120) {
                return res.status(400).json({ ok: false, mensaje: "El nombre debe tener entre 2 y 120 caracteres." });
            }
            const asesor = await repository.actualizarNombre(id, nombre);
            if (!asesor) {
                return res.status(404).json({ ok: false, mensaje: "El asesor no existe." });
            }
            return res.status(200).json({ ok: true, asesor });
        } catch (error) {
            console.error("ERROR ACTUALIZANDO NOMBRE DE ASESOR", error);
            return res.status(500).json({ ok: false, mensaje: "Error actualizando el nombre del asesor." });
        }
    }

}

module.exports = new AsesoresController();
