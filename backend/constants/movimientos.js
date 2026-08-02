// ============================================
// TIPOS DE MOVIMIENTO
// ============================================

const TIPOS = {

    ENTRADA: "ENTRADA",

    BREAK_INICIO: "BREAK_INICIO",
    BREAK_FIN: "BREAK_FIN",

    ALMUERZO_INICIO: "ALMUERZO_INICIO",
    ALMUERZO_FIN: "ALMUERZO_FIN",

    BANO_INICIO: "BANO_INICIO",
    BANO_FIN: "BANO_FIN",

    CAPACITACION_INICIO: "CAPACITACION_INICIO",
    CAPACITACION_FIN: "CAPACITACION_FIN",

    REUNION_INICIO: "REUNION_INICIO",
    REUNION_FIN: "REUNION_FIN",

    SALIDA: "SALIDA"

};

// ============================================
// ESTADOS VISUALES
// ============================================

const ESTADOS = {

    TRABAJANDO: "TRABAJANDO",

    BREAK: "BREAK",

    ALMUERZO: "ALMUERZO",

    BANO: "BANO",

    CAPACITACION: "CAPACITACION",

    REUNION: "REUNION",

    SALIDA: "SALIDA"

};

// ============================================
// MOVIMIENTOS DE INICIO
// ============================================

const TIPOS_INICIO = [

    TIPOS.BREAK_INICIO,
    TIPOS.ALMUERZO_INICIO,
    TIPOS.BANO_INICIO,
    TIPOS.CAPACITACION_INICIO,
    TIPOS.REUNION_INICIO

];

// ============================================
// MOVIMIENTOS DE FIN
// ============================================

const TIPOS_FIN = [

    TIPOS.BREAK_FIN,
    TIPOS.ALMUERZO_FIN,
    TIPOS.BANO_FIN,
    TIPOS.CAPACITACION_FIN,
    TIPOS.REUNION_FIN

];

module.exports = {

    TIPOS,
    ESTADOS,
    TIPOS_INICIO,
    TIPOS_FIN

};