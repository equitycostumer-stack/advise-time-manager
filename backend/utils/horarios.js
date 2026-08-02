// ======================================================
// EQUITY LINE PROFESSIONAL SERVICES
// Horarios oficiales
// ======================================================

const ZONA_HORARIA = "America/Bogota";

// ======================================================
// OBTENER FECHA ACTUAL EN BOGOTÁ
// ======================================================

function ahoraBogota() {

    return new Date(
        new Date().toLocaleString(
            "en-US",
            {
                timeZone: ZONA_HORARIA
            }
        )
    );

}

// ======================================================
// OBTENER HORARIO SEGÚN EL DÍA
// ======================================================

function obtenerHorario(fecha = ahoraBogota()) {

    const dia = fecha.getDay();

    switch (dia) {

        // Domingo
        case 0:

            return null;

        // Lunes a jueves
        case 1:
        case 2:
        case 3:
        case 4:

            return {

                nombre: "Lunes a Jueves",

                inicio: "10:00",

                fin: "19:00",

                horas: 9

            };

        // Viernes
        case 5:

            return {

                nombre: "Viernes",

                inicio: "11:00",

                fin: "19:00",

                horas: 8

            };

        // Sábado
        case 6:

            return {

                nombre: "Sábado",

                inicio: "09:00",

                fin: "16:00",

                horas: 7

            };

        default:

            return null;

    }

}

module.exports = {

    ZONA_HORARIA,

    ahoraBogota,

    obtenerHorario

};