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

}

module.exports = new AsesoresController();