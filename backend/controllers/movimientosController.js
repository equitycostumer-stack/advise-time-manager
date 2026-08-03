// ======================================================
// EQUITY LINE PROFESSIONAL SERVICES
// TIME MANAGER
// MOVIMIENTOS CONTROLLER
// ======================================================

const movimientosService = require("../services/movimientosService");

const {
    TIPOS,
    ESTADOS
} = require("../constants/movimientos");


// ======================================================
// NORMALIZAR TIPO
// ======================================================

const normalizarTipo = (tipo) => {

    if (!tipo) return null;

    return String(tipo)
        .trim()
        .toUpperCase();

};


// ======================================================
// REGISTRAR MOVIMIENTO
// ======================================================

const registrarMovimiento = async (req, res) => {

    try {

        const datos = {

            asesor_id: req.body.asesor_id,

            tipo: normalizarTipo(req.body.tipo),

            observacion: req.body.observacion || ""

        };

        if (!datos.asesor_id) {

            return res.status(400).json({

                ok: false,

                mensaje: "Debe seleccionar un asesor."

            });

        }

        if (!datos.tipo) {

            return res.status(400).json({

                ok: false,

                mensaje: "Debe indicar el tipo de movimiento."

            });

        }

        const resultado =
            await movimientosService.registrarMovimiento(datos);

        return res.status(200).json(resultado);

    }

    catch (error) {

        console.error(error);

        return res.status(400).json({

            ok: false,

            mensaje: error.message

        });

    }

};
// ======================================================
// OBTENER ESTADO ACTUAL
// ======================================================

const obtenerEstadoActual = async (req, res) => {

    try {

        const asesor_id = Number(
    req.params.asesorId || req.query.asesor_id
);

        if (!asesor_id) {

            return res.status(400).json({

                ok: false,

                mensaje: "Debe indicar el asesor."

            });

        }

        const estado =
            await movimientosService.obtenerEstadoActual(asesor_id);

        return res.status(200).json({

            ok: true,

            data: estado

        });

    } catch (error) {

        console.error(error);

        return res.status(500).json({

            ok: false,

            mensaje: error.message

        });

    }

};


// ======================================================
// OBTENER HISTORIAL
// ======================================================

const obtenerHistorial = async (req, res) => {

    try {

        const asesor_id = Number(req.params.asesorId || req.query.asesor_id);

        if (!asesor_id) {

            return res.status(400).json({

                ok: false,

                mensaje: "Debe indicar el asesor."

            });

        }

        const historial =
            await movimientosService.obtenerHistorial(asesor_id);

        return res.status(200).json({

            ok: true,

            data: historial

        });

    } catch (error) {

        console.error(error);

        return res.status(500).json({

            ok: false,

            mensaje: error.message

        });

    }

};
// ======================================================
// OBTENER RESUMEN DE JORNADA
// ======================================================

const obtenerResumenJornada = async (req, res) => {

    try {

        const asesor_id = Number(req.params.asesorId || req.query.asesor_id);

        if (!asesor_id) {

            return res.status(400).json({

                ok: false,

                mensaje: "Debe indicar el asesor."

            });

        }

        const resumen =
            await movimientosService.obtenerResumenJornada(asesor_id);

        return res.status(200).json({

            ok: true,

            data: resumen

        });

    } catch (error) {

        console.error(error);

        return res.status(500).json({

            ok: false,

            mensaje: error.message

        });

    }

};


// ======================================================
// EXPORTACIONES
// ======================================================

module.exports = {

    registrarMovimiento,

    obtenerEstadoActual,

    obtenerHistorial,

    obtenerResumenJornada

};