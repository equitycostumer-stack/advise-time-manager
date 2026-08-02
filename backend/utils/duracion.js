// ======================================================
// EQUITY LINE
// Utilidades para cálculo de tiempos
// ======================================================

function calcularDuracion(inicio, fin = new Date()) {

    const fechaInicio = new Date(inicio);
    const fechaFin = new Date(fin);

    // Validar fechas
    if (
        isNaN(fechaInicio.getTime()) ||
        isNaN(fechaFin.getTime())
    ) {

        return {
            milisegundos: 0,
            segundos: 0,
            minutos: 0,
            horas: 0,
            texto: "00:00:00"
        };

    }

    let diferencia = fechaFin.getTime() - fechaInicio.getTime();

    // Evitar negativos
    if (diferencia < 0) {
        diferencia = 0;
    }

    const segundos = Math.floor(diferencia / 1000);
    const minutos = Math.floor(segundos / 60);
    const horas = Math.floor(minutos / 60);

    const hh = String(Math.floor(segundos / 3600)).padStart(2, "0");
    const mm = String(Math.floor((segundos % 3600) / 60)).padStart(2, "0");
    const ss = String(segundos % 60).padStart(2, "0");

    return {

        milisegundos: diferencia,

        segundos,

        minutos,

        horas,

        texto: `${hh}:${mm}:${ss}`

    };

}

module.exports = {

    calcularDuracion

};