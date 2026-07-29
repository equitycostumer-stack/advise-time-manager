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
    // Por ahora asumimos que es laboral.
    // Luego conectaremos el calendario.

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

    if (!inicioJornada) {

        return {

            llego_tarde: false,

            minutos_retraso: 0

        };

    }

    const entradaReal = new Date(inicioJornada);
    // Si la entrada no es de hoy, no calcular retraso

const hoy = new Date();

if (

    entradaReal.getFullYear() !== hoy.getFullYear() ||

    entradaReal.getMonth() !== hoy.getMonth() ||

    entradaReal.getDate() !== hoy.getDate()

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

    const entradaOficial = new Date(entradaReal);

    entradaOficial.setHours(

        horario.entradaHora,

        horario.entradaMinuto,

        0,

        0

    );

    const diferencia =

        Math.floor(

            (entradaReal - entradaOficial) / 60000

        );

    return {

        llego_tarde: diferencia > 0,

        minutos_retraso:

            diferencia > 0

                ? diferencia

                : 0

    };

}

module.exports = {

    obtenerHorarioHoy,

    calcularRetraso

};