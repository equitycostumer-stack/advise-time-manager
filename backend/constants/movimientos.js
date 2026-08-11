// ======================================================
// MOVIMIENTOS DEL SISTEMA
// ======================================================

const TIPOS = {

    // Jornada
    ENTRADA: "ENTRADA",
    SALIDA: "SALIDA",

    // Break
    BREAK_INICIO: "BREAK_INICIO",
    BREAK_FIN: "BREAK_FIN",

    // Almuerzo
    ALMUERZO_INICIO: "ALMUERZO_INICIO",
    ALMUERZO_FIN: "ALMUERZO_FIN",

    // Baño
    BANO_INICIO: "BANO_INICIO",
    BANO_FIN: "BANO_FIN",

    // Capacitación
    CAPACITACION_INICIO: "CAPACITACION_INICIO",
    CAPACITACION_FIN: "CAPACITACION_FIN",

    // Reunión
    REUNION_INICIO: "REUNION_INICIO",
    REUNION_FIN: "REUNION_FIN"

};

// ======================================================
// ESTADOS DEL ASESOR
// ======================================================

const ESTADOS = {

    SALIDA: "SALIDA",

    TRABAJANDO: "TRABAJANDO",

    BREAK: "BREAK",

    ALMUERZO: "ALMUERZO",

    BANO: "BANO",

    CAPACITACION: "CAPACITACION",

    REUNION: "REUNION"

};

// ======================================================
// MOVIMIENTOS QUE INICIAN UNA PAUSA
// ======================================================

const TIPOS_INICIO = [

    TIPOS.BREAK_INICIO,

    TIPOS.ALMUERZO_INICIO,

    TIPOS.BANO_INICIO,

    TIPOS.CAPACITACION_INICIO,

    TIPOS.REUNION_INICIO

];

// ======================================================
// MOVIMIENTOS QUE FINALIZAN UNA PAUSA
// ======================================================

const TIPOS_FIN = [

    TIPOS.BREAK_FIN,

    TIPOS.ALMUERZO_FIN,

    TIPOS.BANO_FIN,

    TIPOS.CAPACITACION_FIN,

    TIPOS.REUNION_FIN

];

// ======================================================
// RELACIÓN MOVIMIENTO -> ESTADO
// ======================================================

const ESTADO_POR_MOVIMIENTO = {

    ENTRADA: ESTADOS.TRABAJANDO,

    SALIDA: ESTADOS.SALIDA,

    BREAK_INICIO: ESTADOS.BREAK,
    BREAK_FIN: ESTADOS.TRABAJANDO,

    ALMUERZO_INICIO: ESTADOS.ALMUERZO,
    ALMUERZO_FIN: ESTADOS.TRABAJANDO,

    BANO_INICIO: ESTADOS.BANO,
    BANO_FIN: ESTADOS.TRABAJANDO,

    CAPACITACION_INICIO: ESTADOS.CAPACITACION,
    CAPACITACION_FIN: ESTADOS.TRABAJANDO,

    REUNION_INICIO: ESTADOS.REUNION,
    REUNION_FIN: ESTADOS.TRABAJANDO

};

module.exports = {

    TIPOS,

    ESTADOS,

    TIPOS_INICIO,

    TIPOS_FIN,

    ESTADO_POR_MOVIMIENTO

};