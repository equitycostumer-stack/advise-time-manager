// ======================================================
// HORARIOS OFICIALES EQUITY LINE
// ======================================================

function obtenerHorarioHoy(fecha = new Date()) {

    const dia = fecha.getDay();

    // Domingo
    if (dia === 0) {

        return null;

    }

    // Lunes a Jueves
    if (dia >= 1 && dia <= 4) {

        return {

            nombre: "Lunes a Jueves",

            entradaHora: 10,
            entradaMinuto: 0,

            salidaHora: 19,
            salidaMinuto: 0

        };

    }

    // Viernes
    if (dia === 5) {

        return {

            nombre: "Viernes",

            entradaHora: 11,
            entradaMinuto: 0,

            salidaHora: 19,
            salidaMinuto: 0

        };

    }

    // Sábado
    return {

        nombre: "Sábado",

        entradaHora: 9,
        entradaMinuto: 0,

        salidaHora: 16,
        salidaMinuto: 0

    };

}

// ======================================================
// CALCULAR RETRASO
// ======================================================

function calcularRetraso(inicioJornada) {

    // No ha iniciado jornada
    if (!inicioJornada) {

        return {

            llego_tarde: false,
            minutos_retraso: 0

        };

    }

    const entradaReal = new Date(inicioJornada);

    // Fecha inválida
    if (isNaN(entradaReal.getTime())) {

        return {

            llego_tarde: false,
            minutos_retraso: 0

        };

    }

    // Fecha actual
    const ahora = new Date();

    // SOLO calcular si la jornada pertenece al día actual
    if (

        entradaReal.getFullYear() !== ahora.getFullYear() ||
        entradaReal.getMonth() !== ahora.getMonth() ||
        entradaReal.getDate() !== ahora.getDate()

    ) {

        return {

            llego_tarde: false,
            minutos_retraso: 0

        };

    }

    const horario = obtenerHorarioHoy(entradaReal);

    if (!horario) {

        return {

            llego_tarde: false,
            minutos_retraso: 0

        };

    }

    // Hora oficial del mismo día
    const entradaOficial = new Date(

        entradaReal.getFullYear(),
        entradaReal.getMonth(),
        entradaReal.getDate(),
        horario.entradaHora,
        horario.entradaMinuto,
        0,
        0

    );

    const diferenciaMinutos = Math.floor(

        (entradaReal.getTime() - entradaOficial.getTime()) / 60000

    );

    return {

        llego_tarde: diferenciaMinutos > 0,
        minutos_retraso: diferenciaMinutos > 0 ? diferenciaMinutos : 0

    };

}

module.exports = {

    obtenerHorarioHoy,
    calcularRetraso

};