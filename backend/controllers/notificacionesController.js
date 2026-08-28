const notificacionesRepository = require("../repositories/notificacionesRepository");

const obtenerMisNotificaciones = async (req, res) => {

    try {

        const asesorId = req.usuario.asesor_id;

        if (!asesorId) {
            return res.status(200).json({ ok: true, notificaciones: [] });
        }

        const notificaciones = await notificacionesRepository.obtenerPorAsesor(asesorId);

        return res.status(200).json({ ok: true, notificaciones });

    } catch (error) {
        console.error("Error obteniendo notificaciones:", error);
        return res.status(500).json({ ok: false, mensaje: "Error obteniendo notificaciones." });
    }

};

const marcarLeida = async (req, res) => {

    try {

        const id = Number(req.params.id);
        const asesorId = req.usuario.asesor_id;

        await notificacionesRepository.marcarLeida(id, asesorId);

        return res.status(200).json({ ok: true, mensaje: "Notificación marcada como leída." });

    } catch (error) {
        console.error("Error marcando notificación:", error);
        return res.status(500).json({ ok: false, mensaje: "Error marcando notificación." });
    }

};

const marcarTodasLeidas = async (req, res) => {

    try {

        const asesorId = req.usuario.asesor_id;

        await notificacionesRepository.marcarTodasLeidas(asesorId);

        return res.status(200).json({ ok: true, mensaje: "Notificaciones marcadas como leídas." });

    } catch (error) {
        console.error("Error marcando notificaciones:", error);
        return res.status(500).json({ ok: false, mensaje: "Error marcando notificaciones." });
    }

};

module.exports = {
    obtenerMisNotificaciones,
    marcarLeida,
    marcarTodasLeidas
};