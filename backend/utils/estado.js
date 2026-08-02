const { TIPOS, ESTADOS } = require("../constants/movimientos");

// =====================================================
// CONVIERTE UN MOVIMIENTO EN SU ESTADO ACTUAL
// =====================================================

function obtenerEstadoFinal(tipo) {

    switch (tipo) {

        case TIPOS.ENTRADA:
            return ESTADOS.TRABAJANDO;

        case TIPOS.BREAK_INICIO:
            return ESTADOS.BREAK;

        case TIPOS.BREAK_FIN:
            return ESTADOS.TRABAJANDO;

        case TIPOS.ALMUERZO_INICIO:
            return ESTADOS.ALMUERZO;

        case TIPOS.ALMUERZO_FIN:
            return ESTADOS.TRABAJANDO;

        case TIPOS.BANO_INICIO:
            return ESTADOS.BANO;

        case TIPOS.BANO_FIN:
            return ESTADOS.TRABAJANDO;

        case TIPOS.CAPACITACION_INICIO:
            return ESTADOS.CAPACITACION;

        case TIPOS.CAPACITACION_FIN:
            return ESTADOS.TRABAJANDO;

        case TIPOS.REUNION_INICIO:
            return ESTADOS.REUNION;

        case TIPOS.REUNION_FIN:
            return ESTADOS.TRABAJANDO;

        case TIPOS.SALIDA:
            return ESTADOS.SALIDA;

        default:
            return null;

    }

}

module.exports = {
    obtenerEstadoFinal
};