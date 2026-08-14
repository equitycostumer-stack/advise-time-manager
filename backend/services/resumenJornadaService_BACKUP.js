const movimientosRepository =
    require("../repositories/movimientosRepository");


// ======================================================
// EQUITY LINE PROFESSIONAL SERVICES
// RESUMEN DE JORNADA
// ======================================================

class ResumenJornadaService {

    // ==================================================
    // CONVERTIR FECHA MYSQL -> INSTANTE REAL COLOMBIA
    // ==================================================

    convertirFechaColombia(fecha) {

        if (!fecha) {
            return null;
        }

        // ----------------------------------------------
        // Si ya es Date, devolverlo directamente
        // ----------------------------------------------

        if (fecha instanceof Date) {

            return Number.isNaN(fecha.getTime())
                ? null
                : fecha;

        }

        const valor =
            String(fecha).trim();

        if (!valor) {
            return null;
        }

        // ----------------------------------------------
        // Si ya contiene zona horaria
        // ----------------------------------------------

        if (
            valor.endsWith("Z") ||
            /[+-]\d{2}:\d{2}$/.test(valor)
        ) {

            const fechaConvertida =
                new Date(valor);

            return Number.isNaN(
                fechaConvertida.getTime()
            )
                ? null
                : fechaConvertida;

        }

        // ----------------------------------------------
        // MYSQL DATETIME
        //
        // YYYY-MM-DD HH:mm:ss
        //
        // Se interpreta SIEMPRE como Colombia.
        // Colombia = UTC-05:00
        // ----------------------------------------------

        const fechaTexto =
            valor.replace(" ", "T") +
            "-05:00";

        const fechaConvertida =
            new Date(fechaTexto);

        return Number.isNaN(
            fechaConvertida.getTime()
        )
            ? null
            : fechaConvertida;

    }


    // ==================================================
    // ACTUALIZAR RESUMEN
    // ==================================================

    async actualizar(asesorId) {

        // ----------------------------------------------
        // VALIDACIÓN
        // ----------------------------------------------

        if (!asesorId) {

            throw new Error(
                "El asesor es obligatorio."
            );

        }

        // ----------------------------------------------
        // OBTENER MOVIMIENTOS DEL DÍA
        // ----------------------------------------------

        const movimientos =
            await movimientosRepository
                .obtenerMovimientosDelDia(
                    asesorId
                );

        if (
            !Array.isArray(movimientos) ||
            !movimientos.length
        ) {

            return;

        }

        // ==============================================
        // QUEDARSE CON LA ÚLTIMA JORNADA
        // ==============================================

        let ultimaEntrada = -1;

        for (
            let i = movimientos.length - 1;
            i >= 0;
            i--
        ) {

            if (
                movimientos[i].tipo === "ENTRADA"
            ) {

                ultimaEntrada = i;

                break;

            }

        }

        // ----------------------------------------------
        // Si existe una entrada, eliminar todo
        // anterior a esa entrada.
        // ----------------------------------------------

        if (ultimaEntrada > 0) {

            movimientos.splice(
                0,
                ultimaEntrada
            );

        }

        // ==============================================
        // DEBUG DE MOVIMIENTOS
        // ==============================================

        console.log(
            "=========================================="
        );

        console.log(
            "📋 MOVIMIENTOS PARA RESUMEN"
        );

        console.table(
            movimientos.map(
                movimiento => ({

                    tipo:
                        movimiento.tipo,

                    fecha:
                        movimiento.fecha_hora

                })
            )
        );

        console.log(
            "=========================================="
        );

        // ==============================================
        // OBTENER / CREAR RESUMEN DEL DÍA
        // ==============================================

        let resumen =
            await movimientosRepository
                .obtenerResumenDia(
                    asesorId
                );

        if (!resumen) {

            await movimientosRepository
                .crearResumenDia(
                    asesorId
                );

            resumen =
                await movimientosRepository
                    .obtenerResumenDia(
                        asesorId
                    );

        }

        if (!resumen) {

            throw new Error(
                "No fue posible crear u obtener el resumen de jornada."
            );

        }

        // ==============================================
        // ENTRADA Y SALIDA
        // ==============================================

        const {
            horaEntrada,
            horaSalida
        } =
            this.obtenerEntradaSalida(
                movimientos
            );

        console.log(
            "=========================================="
        );

        console.log(
            "🟢 ENTRADA:",
            horaEntrada
        );

        console.log(
            "🔴 SALIDA :",
            horaSalida
        );

        console.log(
            "=========================================="
        );

        // ==============================================
        // CALCULAR TIEMPOS
        // ==============================================

        const tiempos =
            this.calcularTiempos(
                movimientos
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

        // ==============================================
        // CALCULAR RETRASO
        // ==============================================

        const {
            llego_tarde,
            minutos_retraso
        } =
            this.calcularRetraso(
                horaEntrada
            );

        // ==============================================
        // GUARDAR RESUMEN
        // ==============================================

        await movimientosRepository
            .actualizarResumenDia(
                resumen.id,
                {

                    hora_entrada:
                        horaEntrada,

                    hora_salida:
                        horaSalida,

                    tiempo_trabajado:
                        tiempoTrabajado,

                    tiempo_break:
                        tiempoBreak,

                    tiempo_almuerzo:
                        tiempoAlmuerzo,

                    tiempo_bano:
                        tiempoBano,

                    tiempo_capacitacion:
                        tiempoCapacitacion,

                    tiempo_reunion:
                        tiempoReunion,

                    tiempo_productivo:
                        tiempoProductivo,

                    llego_tarde,

                    minutos_retraso

                }
            );

        console.log(
            "=========================================="
        );

        console.log(
            "✅ RESUMEN ACTUALIZADO"
        );

        console.log(
            "Asesor:",
            asesorId
        );

        console.log(
            "Trabajado:",
            tiempoTrabajado
        );

        console.log(
            "Break:",
            tiempoBreak
        );

        console.log(
            "Almuerzo:",
            tiempoAlmuerzo
        );

        console.log(
            "Baño:",
            tiempoBano
        );

        console.log(
            "Capacitación:",
            tiempoCapacitacion
        );

        console.log(
            "Reunión:",
            tiempoReunion
        );

        console.log(
            "Productivo:",
            tiempoProductivo
        );

        console.log(
            "Llegó tarde:",
            llego_tarde
        );

        console.log(
            "Minutos retraso:",
            minutos_retraso
        );

        console.log(
            "=========================================="
        );

    }


    // ==================================================
    // OBTENER ENTRADA Y SALIDA
    // ==================================================

    obtenerEntradaSalida(movimientos) {

        let horaEntrada = null;
        let horaSalida = null;

        for (
            const movimiento
            of movimientos
        ) {

            // ------------------------------------------
            // PRIMERA ENTRADA
            // ------------------------------------------

            if (
                movimiento.tipo === "ENTRADA" &&
                !horaEntrada
            ) {

                horaEntrada =
                    movimiento.fecha_hora;

            }

            // ------------------------------------------
            // ÚLTIMA SALIDA
            // ------------------------------------------

            if (
                movimiento.tipo === "SALIDA"
            ) {

                horaSalida =
                    movimiento.fecha_hora;

            }

        }

        return {

            horaEntrada,
            horaSalida

        };

    }


    // ==================================================
    // CALCULAR RETRASO
    // ==================================================

    calcularRetraso(horaEntrada) {

        if (!horaEntrada) {

            return {

                llego_tarde: 0,

                minutos_retraso: 0

            };

        }

        const entrada =
            this.convertirFechaColombia(
                horaEntrada
            );

        if (!entrada) {

            console.error(
                "❌ No fue posible interpretar la hora de entrada:",
                horaEntrada
            );

            return {

                llego_tarde: 0,

                minutos_retraso: 0

            };

        }

        // ----------------------------------------------
        // Crear la hora oficial 10:00 AM
        // usando la misma fecha de la entrada.
        //
        // IMPORTANTE:
        // Se construye explícitamente en Colombia.
        // ----------------------------------------------

        const fechaEntradaColombia =
            new Intl.DateTimeFormat(
                "en-CA",
                {

                    timeZone:
                        "America/Bogota",

                    year: "numeric",

                    month: "2-digit",

                    day: "2-digit"

                }
            ).format(entrada);

        const horaOficial =
            new Date(
                `${fechaEntradaColombia}T10:00:00-05:00`
            );

        const diferencia =
            entrada.getTime() -
            horaOficial.getTime();

        const minutos =
            Math.max(
                0,
                Math.floor(
                    diferencia / 60000
                )
            );

        return {

            llego_tarde:
                minutos > 0
                    ? 1
                    : 0,

            minutos_retraso:
                minutos

        };

    }


    // ==================================================
    // ACUMULAR TIEMPO SEGÚN EL ESTADO
    // ==================================================

    acumularTiempo(
        estado,
        diferencia,
        acciones
    ) {

        // ----------------------------------------------
        // Nunca permitir tiempos negativos.
        // ----------------------------------------------

        if (
            !Number.isFinite(diferencia) ||
            diferencia <= 0
        ) {

            return;

        }

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


    // ==================================================
    // CALCULAR TIEMPOS
    // ==================================================

    calcularTiempos(movimientos) {

        let tiempoTrabajado = 0;

        let tiempoBreak = 0;

        let tiempoAlmuerzo = 0;

        let tiempoBano = 0;

        let tiempoCapacitacion = 0;

        let tiempoReunion = 0;


        // ==============================================
        // FUNCIONES DE ACUMULACIÓN
        // ==============================================

        const acciones = {

            tiempoTrabajado:
                diferencia =>
                    tiempoTrabajado += diferencia,

            tiempoBreak:
                diferencia =>
                    tiempoBreak += diferencia,

            tiempoAlmuerzo:
                diferencia =>
                    tiempoAlmuerzo += diferencia,

            tiempoBano:
                diferencia =>
                    tiempoBano += diferencia,

            tiempoCapacitacion:
                diferencia =>
                    tiempoCapacitacion += diferencia,

            tiempoReunion:
                diferencia =>
                    tiempoReunion += diferencia

        };


        let ultimoEstado = null;

        let inicioEstado = null;


        // ==============================================
        // RECORRER MOVIMIENTOS
        // ==============================================

        for (
            const movimiento
            of movimientos
        ) {

            const fechaActual =
                this.convertirFechaColombia(
                    movimiento.fecha_hora
                );

            // ------------------------------------------
            // FECHA INVÁLIDA
            // ------------------------------------------

            if (!fechaActual) {

                console.error(
                    "❌ Fecha inválida:",
                    movimiento.fecha_hora
                );

                continue;

            }


            // ==================================================
// ACUMULAR TIEMPO SEGÚN EL ESTADO
// ==================================================

acumularTiempo(
    estado,
    diferencia,
    acciones
) {

    // ----------------------------------------------
    // VALIDACIÓN
    // ----------------------------------------------

    if (
        !Number.isFinite(diferencia) ||
        diferencia <= 0
    ) {

        return;

    }

    // ----------------------------------------------
    // ACUMULAR SEGÚN ESTADO
    // ----------------------------------------------

    switch (estado) {

        // ==========================================
        // TIEMPO PRODUCTIVO / TRABAJADO
        // ==========================================

        case "ENTRADA":
        case "TRABAJANDO":
        case "BREAK_FIN":
        case "ALMUERZO_FIN":
        case "BANO_FIN":
        case "CAPACITACION_FIN":
        case "REUNION_FIN":

            acciones.tiempoTrabajado(
                diferencia
            );

            break;


        // ==========================================
        // BREAK
        // ==========================================

        case "BREAK_INICIO":

            acciones.tiempoBreak(
                diferencia
            );

            break;


        // ==========================================
        // ALMUERZO
        // ==========================================

        case "ALMUERZO_INICIO":

            acciones.tiempoAlmuerzo(
                diferencia
            );

            break;


        // ==========================================
        // BAÑO
        // ==========================================

        case "BANO_INICIO":

            acciones.tiempoBano(
                diferencia
            );

            break;


        // ==========================================
        // CAPACITACIÓN
        // ==========================================

        case "CAPACITACION_INICIO":

            acciones.tiempoCapacitacion(
                diferencia
            );

            break;


        // ==========================================
        // REUNIÓN
        // ==========================================

        case "REUNION_INICIO":

            acciones.tiempoReunion(
                diferencia
            );

            break;


        // ==========================================
        // SALIDA
        // ==========================================

        case "SALIDA":

            // Una jornada cerrada no acumula tiempo.
            break;


        // ==========================================
        // ESTADOS DESCONOCIDOS
        // ==========================================

        default:

            console.warn(
                "⚠️ Estado no reconocido:",
                estado
            );

            break;

    }

}


// ==================================================
// CALCULAR TIEMPOS
// ==================================================

calcularTiempos(movimientos) {

    let tiempoTrabajado = 0;

    let tiempoBreak = 0;

    let tiempoAlmuerzo = 0;

    let tiempoBano = 0;

    let tiempoCapacitacion = 0;

    let tiempoReunion = 0;


    // ==============================================
    // FUNCIONES DE ACUMULACIÓN
    // ==============================================

    const acciones = {

        tiempoTrabajado:
            diferencia => {

                tiempoTrabajado += diferencia;

            },


        tiempoBreak:
            diferencia => {

                tiempoBreak += diferencia;

            },


        tiempoAlmuerzo:
            diferencia => {

                tiempoAlmuerzo += diferencia;

            },


        tiempoBano:
            diferencia => {

                tiempoBano += diferencia;

            },


        tiempoCapacitacion:
            diferencia => {

                tiempoCapacitacion += diferencia;

            },


        tiempoReunion:
            diferencia => {

                tiempoReunion += diferencia;

            }

    };


    // ==============================================
    // VALIDAR MOVIMIENTOS
    // ==============================================

    if (
        !Array.isArray(movimientos) ||
        !movimientos.length
    ) {

        return {

            tiempoTrabajado: 0,

            tiempoBreak: 0,

            tiempoAlmuerzo: 0,

            tiempoBano: 0,

            tiempoCapacitacion: 0,

            tiempoReunion: 0,

            tiempoProductivo: 0

        };

    }


    // ==============================================
    // ESTADO ACTUAL
    // ==============================================

    let ultimoEstado = null;

    let inicioEstado = null;

    let jornadaCerrada = false;


    // ==============================================
    // RECORRER MOVIMIENTOS
    // ==============================================

    for (
        const movimiento
        of movimientos
    ) {

        // ------------------------------------------
        // IGNORAR MOVIMIENTOS INVÁLIDOS
        // ------------------------------------------

        if (
            !movimiento ||
            !movimiento.tipo ||
            !movimiento.fecha_hora
        ) {

            console.warn(
                "⚠️ Movimiento inválido:",
                movimiento
            );

            continue;

        }


        // ------------------------------------------
        // SI YA SALIÓ, NO PROCESAR MÁS
        // ------------------------------------------

        if (jornadaCerrada) {

            continue;

        }


        // ------------------------------------------
        // CONVERTIR FECHA
        // ------------------------------------------

        const fechaActual =
            this.convertirFechaColombia(
                movimiento.fecha_hora
            );


        // ------------------------------------------
        // FECHA INVÁLIDA
        // ------------------------------------------

        if (!fechaActual) {

            console.error(
                "❌ Fecha inválida:",
                movimiento.fecha_hora
            );

            continue;

        }


        // ==========================================
        // PRIMER MOVIMIENTO
        // ==========================================

        if (!inicioEstado) {

            inicioEstado =
                fechaActual;

            ultimoEstado =
                movimiento.tipo;


            console.log(
                "=========================================="
            );

            console.log(
                "RAW MYSQL:",
                movimiento.fecha_hora
            );

            console.log(
                "FECHA INTERPRETADA:",
                fechaActual.toISOString()
            );

            console.log(
                "LOCAL COLOMBIA:",
                fechaActual.toLocaleString(
                    "es-CO",
                    {
                        timeZone:
                            "America/Bogota",

                        dateStyle:
                            "short",

                        timeStyle:
                            "medium"
                    }
                )
            );

            console.log(
                "=========================================="
            );


            // --------------------------------------
            // SI LA JORNADA YA COMIENZA EN SALIDA
            // --------------------------------------

            if (
                movimiento.tipo === "SALIDA"
            ) {

                jornadaCerrada = true;

            }


            continue;

        }


        // ==========================================
        // DIFERENCIA ENTRE ESTADOS
        // ==========================================

        const diferencia =
            fechaActual.getTime() -
            inicioEstado.getTime();


        console.log(
            "Estado:",
            ultimoEstado,
            "Diferencia:",
            diferencia
        );


        // ==========================================
        // ACUMULAR ESTADO ANTERIOR
        // ==========================================

        this.acumularTiempo(
            ultimoEstado,
            diferencia,
            acciones
        );


        // ==========================================
        // NUEVO ESTADO
        // ==========================================

        ultimoEstado =
            movimiento.tipo;

        inicioEstado =
            fechaActual;


        // ==========================================
        // SALIDA CIERRA LA JORNADA
        // ==========================================

        if (
            movimiento.tipo === "SALIDA"
        ) {

            jornadaCerrada = true;

            console.log(
                "🔴 JORNADA CERRADA EN:",
                fechaActual.toISOString()
            );

            break;

        }

    }


    // ==============================================
    // CONTINUAR ÚLTIMO ESTADO HASTA AHORA
    // SOLO SI LA JORNADA SIGUE ACTIVA
    // ==============================================

    if (
        inicioEstado &&
        ultimoEstado &&
        !jornadaCerrada
    ) {

        const ahora =
            new Date();


        console.log(
            "=========================================="
        );

        console.log(
            "AHORA ISO:",
            ahora.toISOString()
        );

        console.log(
            "AHORA COLOMBIA:",
            ahora.toLocaleString(
                "es-CO",
                {
                    timeZone:
                        "America/Bogota",

                    dateStyle:
                        "short",

                    timeStyle:
                        "medium"
                }
            )
        );

        console.log(
            "ÚLTIMO ESTADO:",
            ultimoEstado
        );

        console.log(
            "INICIO ESTADO:",
            inicioEstado.toISOString()
        );

        console.log(
            "=========================================="
        );


        const diferenciaActual =
            ahora.getTime() -
            inicioEstado.getTime();


        console.log(
            "Estado actual:",
            ultimoEstado
        );

        console.log(
            "Diferencia actual:",
            diferenciaActual
        );


        this.acumularTiempo(
            ultimoEstado,
            diferenciaActual,
            acciones
        );

    }


    // ==============================================
    // TIEMPO PRODUCTIVO
    // ==============================================

    const tiempoProductivo =
        Math.max(
            0,
            tiempoTrabajado -
            tiempoBreak -
            tiempoAlmuerzo -
            tiempoBano -
            tiempoCapacitacion -
            tiempoReunion
        );


    // ==============================================
    // RESULTADO
    // ==============================================

    return {

        tiempoTrabajado,

        tiempoBreak,

        tiempoAlmuerzo,

        tiempoBano,

        tiempoCapacitacion,

        tiempoReunion,

        tiempoProductivo

    };

}


    // ==================================================
    // GUARDAR RESUMEN
    // ==================================================

    async guardarResumen(
        resumenId,
        datos
    ) {

        if (!resumenId) {

            throw new Error(
                "El ID del resumen es obligatorio."
            );

        }

        await movimientosRepository
            .actualizarResumenDia(
                resumenId,
                datos
            );

    }

}


// ======================================================
// EXPORTAR SERVICIO
// ======================================================

module.exports =
    new ResumenJornadaService();