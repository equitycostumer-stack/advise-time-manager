// ======================================================
// HORARIOS OFICIALES EQUITY LINE
// ======================================================

function obtenerHorarioHoy(fecha = new Date()) {

    const dia = fecha.getDay();

    if (dia === 0) {

        return null;

    }

    if (dia >= 1 && dia <= 4) {

        return {

            nombre: "Lunes a Jueves",

            entradaHora: 10,
            entradaMinuto: 0,

            salidaHora: 19,
            salidaMinuto: 0

        };

    }

    if (dia === 5) {

        return {

            nombre: "Viernes",

            entradaHora: 11,
            entradaMinuto: 0,

            salidaHora: 19,
            salidaMinuto: 0

        };

    }

    return {

        nombre: "Sábado",

        entradaHora: 9,
        entradaMinuto: 0,

        salidaHora: 16,
        salidaMinuto: 0

    };

}

// ======================================================
// CONVERTIR A HORA DE COLOMBIA
// ======================================================

function convertirABogota(fecha) {

    return new Date(

        fecha.toLocaleString("en-US", {

            timeZone: "America/Bogota"

        })

    );

}

// ======================================================
// CALCULAR RETRASO
// ======================================================

function calcularRetraso(inicioJornada) {

    if (!inicioJornada) {

        return {

            llego_tarde: false,
            minutos_retraso: 0

        };

    }

    const entradaReal = convertirABogota(

        new Date(inicioJornada)

    );

    if (isNaN(entradaReal.getTime())) {

        return {

            llego_tarde: false,
            minutos_retraso: 0

        };

    }

    const ahora = convertirABogota(

        new Date()

    );

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

    const entradaOficial = new Date(

        entradaReal.getFullYear(),
        entradaReal.getMonth(),
        entradaReal.getDate(),
        horario.entradaHora,
        horario.entradaMinuto,
        0,
        0

    );

    const diferencia = Math.floor(

        (entradaReal.getTime() - entradaOficial.getTime()) / 60000

    );

    return {

        llego_tarde: diferencia > 0,

        minutos_retraso: diferencia > 0 ? diferencia : 0

    };

}

module.exports = {

    obtenerHorarioHoy,

    calcularRetraso

};