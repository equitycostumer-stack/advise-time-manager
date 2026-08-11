const movimientosRepository = require("../repositories/movimientosRepository");

class ResumenJornadaService {

    // ===========================================
    // ACTUALIZAR RESUMEN
    // ===========================================

    async actualizar(asesorId) {

        // ===========================================
        // MOVIMIENTOS DEL DÍA
        // ===========================================

        const movimientos =
        await movimientosRepository.obtenerMovimientosDelDia(
        asesorId
     );

        if (!movimientos.length)
            return;
// ===========================================
// QUEDARSE CON LA ÚLTIMA JORNADA
// ===========================================

let ultimaEntrada = -1;

for (let i = movimientos.length - 1; i >= 0; i--) {

    if (movimientos[i].tipo === "ENTRADA") {

        ultimaEntrada = i;
        break;

    }

}

if (ultimaEntrada >= 0) {

    movimientos.splice(0, ultimaEntrada);

}
        // ===========================================
        // RESUMEN DEL DÍA
        // ===========================================

        let resumen =
            await movimientosRepository.obtenerResumenDia(
                asesorId
            );

        if (!resumen) {

            await movimientosRepository.crearResumenDia(
                asesorId
            );

            resumen =
                await movimientosRepository.obtenerResumenDia(
                    asesorId
                );

        }

        // ===========================================
        // ENTRADA Y SALIDA
        // ===========================================

        const {
            horaEntrada,
            horaSalida
        } = this.obtenerEntradaSalida(
            movimientos
        );

        console.log("=================================");
        console.log("ENTRADA:", horaEntrada);
        console.log("SALIDA :", horaSalida);
        console.log("=================================");

        // ===========================================
        // CALCULAR TIEMPOS
        // ===========================================

        const tiempos =
            this.calcularTiempos(
                movimientos
            );
const {

    llego_tarde,

    minutos_retraso

} = this.calcularRetraso(
    horaEntrada
);
        const {

            tiempoTrabajado,

            tiempoBreak,

            tiempoAlmuerzo,

            tiempoBano,

            tiempoCapacitacion,

            tiempoReunion,

            tiempoProductivo

        } = tiempos;

        // ===========================================
        // GUARDAR
        // ===========================================

        await movimientosRepository.actualizarResumenDia(
            resumen.id,
            {

                hora_entrada: horaEntrada,

                hora_salida: horaSalida,

                tiempo_trabajado: tiempoTrabajado,

                tiempo_break: tiempoBreak,

                tiempo_almuerzo: tiempoAlmuerzo,

                tiempo_bano: tiempoBano,

                tiempo_capacitacion: tiempoCapacitacion,

                tiempo_reunion: tiempoReunion,

                tiempo_productivo: tiempoProductivo,

                llego_tarde,

                minutos_retraso

            }
        );

    }

    // ===========================================
    // OBTENER ENTRADA Y SALIDA
    // ===========================================

    obtenerEntradaSalida(movimientos) {

        let horaEntrada = null;
        let horaSalida = null;

        for (const mov of movimientos) {

            if (
                mov.tipo === "ENTRADA" &&
                !horaEntrada
            ) {

                horaEntrada = mov.fecha_hora;

            }

            if (
                mov.tipo === "SALIDA"
            ) {

                horaSalida = mov.fecha_hora;

            }

        }

        return {

            horaEntrada,

            horaSalida

        };

    }
// ===========================================
// CALCULAR RETRASO
// ===========================================

calcularRetraso(horaEntrada) {

    if (!horaEntrada) {

        return {

            llego_tarde: 0,

            minutos_retraso: 0

        };

    }

    const entrada =
        new Date(horaEntrada);

    const horaOficial =
        new Date(horaEntrada);

    horaOficial.setHours(10);
    horaOficial.setMinutes(0);
    horaOficial.setSeconds(0);
    horaOficial.setMilliseconds(0);

    const diferencia =
        entrada - horaOficial;

    const minutos =
        Math.max(
            0,
            Math.floor(diferencia / 60000)
        );

    return {

        llego_tarde: minutos > 0 ? 1 : 0,

        minutos_retraso: minutos

    };

}
// ===========================================
// ACUMULAR TIEMPO SEGÚN EL ESTADO
// ===========================================

acumularTiempo(
    estado,
    diferencia,
    acciones
) {

    switch (estado) {

        case "ENTRADA":

            acciones.tiempoTrabajado(
                diferencia
            );

            break;

        case "BREAK_INICIO":

            acciones.tiempoBreak(
                diferencia
            );

            break;

        case "ALMUERZO_INICIO":

            acciones.tiempoAlmuerzo(
                diferencia
            );

            break;

        case "BANO_INICIO":

            acciones.tiempoBano(
                diferencia
            );

            break;

        case "CAPACITACION_INICIO":

            acciones.tiempoCapacitacion(
                diferencia
            );

            break;

        case "REUNION_INICIO":

            acciones.tiempoReunion(
                diferencia
            );

            break;

    }

}
    // ===========================================
    // CALCULAR TIEMPOS
    // ===========================================

    calcularTiempos(movimientos) {
console.table(
        movimientos.map(m => ({
            tipo: m.tipo,
            fecha: m.fecha_hora
        }))
    );
        let tiempoTrabajado = 0;

        let tiempoBreak = 0;
        let tiempoAlmuerzo = 0;
        let tiempoBano = 0;
        let tiempoCapacitacion = 0;
        let tiempoReunion = 0;
        const acciones = {

    tiempoTrabajado: (diferencia) =>
        tiempoTrabajado += diferencia,

    tiempoBreak: (diferencia) =>
        tiempoBreak += diferencia,

    tiempoAlmuerzo: (diferencia) =>
        tiempoAlmuerzo += diferencia,

    tiempoBano: (diferencia) =>
        tiempoBano += diferencia,

    tiempoCapacitacion: (diferencia) =>
        tiempoCapacitacion += diferencia,

    tiempoReunion: (diferencia) =>
        tiempoReunion += diferencia

};
        let ultimoEstado = null;
        let inicioEstado = null;

        for (const mov of movimientos) {

            if (!inicioEstado) {
               console.log("RAW FECHA:", mov.fecha_h);
               console.log("RAW LENGTH:", mov.fecha_hora.length);
               
                inicioEstado = new Date(
                    mov.fecha_hora.replace(" ", "T") + "-05:00"
                );

             console.log("DATE:",inicioEstado
             );
                ultimoEstado = mov.tipo;

                continue;

            }

            const fechaActual =
                   new Date(
                 mov.fecha_hora.replace(" ", "T") + "-05:00"
            );

            const diferencia =
                fechaActual - inicioEstado;
console.log(
    "Estado:",
    ultimoEstado,
    "Diferencia:",
    diferencia
);
            this.acumularTiempo(
                ultimoEstado,
                diferencia,
                acciones
            );

            ultimoEstado = mov.tipo;

            inicioEstado = fechaActual;

        }

   const ahora = new Date();
 
   console.log("================================");
   console.log("AHORA      :", ahora.toISOString());
   console.log("INICIO RAW :", movimientos[movimientos.length - 1].fecha_hora);
   console.log("INICIO DATE:", inicioEstado.toISOString());
   console.log("================================");

if (inicioEstado) {

    const diferencia =
        ahora - inicioEstado;
  console.log(
    "Estado:",
    ultimoEstado,
    "Diferencia:",
    diferencia
);
    this.acumularTiempo(
        ultimoEstado,
        diferencia,
        acciones
    );

}

        return {

            tiempoTrabajado,

            tiempoBreak,

            tiempoAlmuerzo,

            tiempoBano,

            tiempoCapacitacion,

            tiempoReunion,

            tiempoProductivo:
                tiempoTrabajado -
                tiempoBreak -
                tiempoAlmuerzo -
                tiempoBano -
                tiempoCapacitacion -
                tiempoReunion

        };

    }

    // ===========================================
    // GUARDAR RESUMEN
    // ===========================================

    async guardarResumen(
        resumenId,
        datos
    ) {

        await movimientosRepository.actualizarResumenDia(
            resumenId,
            datos
        );

    }

}

module.exports = new ResumenJornadaService();