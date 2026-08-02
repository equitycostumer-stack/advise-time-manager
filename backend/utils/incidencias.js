// ==============================================
// REGLAS DE INCIDENCIAS
// ==============================================

const LIMITES = {
    BREAK: 15,
    ALMUERZO: 60,
    BANO: 10,
    CAPACITACION: 90,
    REUNION: 90
};

// ==============================================
// CALCULAR MINUTOS EN EL ESTADO ACTUAL
// ==============================================

function minutosEnEstado(inicioEstado) {

    if (!inicioEstado) {
        return 0;
    }

    return Math.floor(
        (Date.now() - new Date(inicioEstado).getTime()) / 60000
    );

}

// ==============================================
// EVALUAR SI HAY INCIDENCIA
// ==============================================

function evaluarIncidencia(asesor) {

    // Estados que nunca generan incidencias
    if (
        asesor.estado === "DISPONIBLE" ||
        asesor.estado === "TRABAJANDO" ||
        asesor.estado === "ENTRADA" ||
        asesor.estado === "SALIDA"
    ) {
        return null;
    }

    const limite = LIMITES[asesor.estado];

    if (!limite) {
        return null;
    }

    const minutos = minutosEnEstado(
        asesor.inicio_estado
    );

    if (minutos <= limite) {
        return null;
    }

    return {

        tipo: `${asesor.estado} EXCEDIDO`,

        nivel: "MEDIA",

        detalle: `${minutos} minutos en ${asesor.estado}`,

        minutos

    };

}

module.exports = {
    evaluarIncidencia
};