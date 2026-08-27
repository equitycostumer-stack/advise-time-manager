const horariosRepository = require("../repositories/horariosRepository");
const movimientosRepository = require("../repositories/movimientosRepository");
const { registrarIncidencia } = require("../controllers/incidenciasController");

// ======================================================
// ADVISE SOLUTIONS SERVICES
// RESUMEN DE JORNADA SERVICE (PostgreSQL / Supabase)
// ======================================================

class ResumenJornadaService {

    /**
     * Convierte una fecha MySQL/PostgreSQL (o string ISO/Date) al instante de tiempo real en Colombia (UTC-5).
     */
    convertirFechaColombia(fecha) {
        if (!fecha) return null;

        if (fecha instanceof Date) {
            return Number.isNaN(fecha.getTime()) ? null : fecha;
        }

        const valor = String(fecha).trim();
        if (!valor) return null;

        // Si ya incluye offset o sufijo Z
        if (valor.endsWith("Z") || /[+-]\d{2}:\d{2}$/.test(valor)) {
            const fechaConvertida = new Date(valor);
            return Number.isNaN(fechaConvertida.getTime()) ? null : fechaConvertida;
        }

        // Formato DateTime (YYYY-MM-DD HH:mm:ss -> UTC-05:00)
        const fechaTexto = valor.replace(" ", "T") + "-05:00";
        const fechaConvertida = new Date(fechaTexto);

        return Number.isNaN(fechaConvertida.getTime()) ? null : fechaConvertida;
    }

    /**
     * Procesa y actualiza los tiempos del día para un determinado asesor.
     */
    async actualizar(asesorId) {
        if (!asesorId) {
            throw new Error("El asesor es obligatorio.");
        }

        const movimientos = await movimientosRepository.obtenerMovimientosDesdeUltimaEntrada(asesorId);

        if (!Array.isArray(movimientos) || movimientos.length === 0) {
            return;
        }

        // ----------------------------------------------
        // La fecha real de la jornada es la de su ENTRADA,
        // no la fecha de "hoy" (permite jornadas que cruzan
        // la medianoche, ej. entra a las 11pm y sale a la 1am)
        // ----------------------------------------------
        const fechaJornada = movimientos[0].fecha_hora;

        // ----------------------------------------------
        // Obtener o crear resumen de ESA jornada específica
        // ----------------------------------------------
        let resumen = await movimientosRepository.obtenerResumenPorFecha(asesorId, fechaJornada);

        if (!resumen) {
            await movimientosRepository.crearResumenDia(asesorId, fechaJornada);
            resumen = await movimientosRepository.obtenerResumenPorFecha(asesorId, fechaJornada);
        }

        if (!resumen) {
            throw new Error("No fue posible crear u obtener el resumen de jornada.");
        }

        // ----------------------------------------------
        // Cálculo de horas e incidencias
        // ----------------------------------------------
        const { horaEntrada, horaSalida } = this.obtenerEntradaSalida(movimientos);
        const tiempos = this.calcularTiempos(movimientos);
        const { llego_tarde, minutos_retraso } = await this.calcularRetraso(horaEntrada);

        // Registro asíncrono seguro de la incidencia por tardanza
        if (minutos_retraso > 0) {
            await registrarIncidencia(
                asesorId,
                "LLEGADA TARDE",
                "ALTA",
                `${minutos_retraso} minutos de retraso`
            );
        }

        // ----------------------------------------------
        // Persistir consolidado
        // ----------------------------------------------
        const datosActualizacion = {
            hora_entrada: horaEntrada,
            hora_salida: horaSalida,
            tiempo_trabajado: tiempos.tiempoTrabajado,
            tiempo_break: tiempos.tiempoBreak,
            tiempo_almuerzo: tiempos.tiempoAlmuerzo,
            tiempo_bano: tiempos.tiempoBano,
            tiempo_capacitacion: tiempos.tiempoCapacitacion,
            tiempo_reunion: tiempos.tiempoReunion,
            tiempo_productivo: tiempos.tiempoProductivo,
            llego_tarde,
            minutos_retraso
        };

        await movimientosRepository.actualizarResumenDia(resumen.id, datosActualizacion);
    }

    /**
     * Extrae el primer timestamp de ENTRADA y el último de SALIDA.
     */
    obtenerEntradaSalida(movimientos) {
        let horaEntrada = null;
        let horaSalida = null;

        for (const movimiento of movimientos) {
            if (movimiento.tipo === "ENTRADA" && !horaEntrada) {
                horaEntrada = movimiento.fecha_hora;
            }
            if (movimiento.tipo === "SALIDA") {
                horaSalida = movimiento.fecha_hora;
            }
        }

        return { horaEntrada, horaSalida };
    }

    /**
     * Compara el marcado de entrada contra el horario de la empresa para calcular retrasos.
     */
    async calcularRetraso(horaEntrada) {
        if (!horaEntrada) {
            return { llego_tarde: 0, minutos_retraso: 0 };
        }

        const entrada = this.convertirFechaColombia(horaEntrada);
        if (!entrada) {
            console.error("❌ No fue posible interpretar la hora de entrada:", horaEntrada);
            return { llego_tarde: 0, minutos_retraso: 0 };
        }

        const nombreDia = new Intl.DateTimeFormat("en-US", {
            timeZone: "America/Bogota",
            weekday: "long"
        }).format(entrada);

        const diasSemana = {
            Sunday: "DOMINGO",
            Monday: "LUNES",
            Tuesday: "MARTES",
            Wednesday: "MIERCOLES",
            Thursday: "JUEVES",
            Friday: "VIERNES",
            Saturday: "SABADO"
        };

        const diaSemana = diasSemana[nombreDia];
        const horario = await horariosRepository.obtenerHorarioDia(diaSemana);

        if (!horario) {
            return { llego_tarde: 0, minutos_retraso: 0 };
        }

        const fechaEntradaColombia = new Intl.DateTimeFormat("en-CA", {
            timeZone: "America/Bogota",
            year: "numeric",
            month: "2-digit",
            day: "2-digit"
        }).format(entrada);

        const horaOficial = new Date(`${fechaEntradaColombia}T${horario.hora_entrada}-05:00`);
        const diferencia = entrada.getTime() - horaOficial.getTime();
        const minutos = Math.max(0, Math.floor(diferencia / 60000));

        return {
            llego_tarde: minutos > 0 ? 1 : 0,
            minutos_retraso: minutos
        };
    }

    /**
     * Distribuye la diferencia de tiempo según el estado del movimiento activo.
     */
    acumularTiempo(estado, diferencia, acciones) {
        if (!Number.isFinite(diferencia) || diferencia <= 0) return;

        switch (estado) {
            case "ENTRADA":
            case "TRABAJANDO":
            case "BREAK_FIN":
            case "ALMUERZO_FIN":
            case "BANO_FIN":
            case "CAPACITACION_FIN":
            case "REUNION_FIN":
                acciones.tiempoTrabajado(diferencia);
                break;
            case "BREAK_INICIO":
                acciones.tiempoTrabajado(diferencia);
                acciones.tiempoBreak(diferencia);
                break;
            case "ALMUERZO_INICIO":
                acciones.tiempoAlmuerzo(diferencia);
                break;
            case "BANO_INICIO":
                acciones.tiempoTrabajado(diferencia);
                acciones.tiempoBano(diferencia);
                break;
            case "CAPACITACION_INICIO":
                acciones.tiempoTrabajado(diferencia);
                acciones.tiempoCapacitacion(diferencia);
                break;
            case "REUNION_INICIO":
                acciones.tiempoTrabajado(diferencia);
                acciones.tiempoReunion(diferencia);
                break;
            case "SALIDA":
                break;
            default:
                console.warn("⚠️ Estado no reconocido:", estado);
                break;
        }
    }

    /**
     * Calcula los minutos y horas acumulados para el cálculo de productividad.
     */
    calcularTiempos(movimientos) {
        let tiempoTrabajado = 0;
        let tiempoBreak = 0;
        let tiempoAlmuerzo = 0;
        let tiempoBano = 0;
        let tiempoCapacitacion = 0;
        let tiempoReunion = 0;

        const acciones = {
            tiempoTrabajado: d => { tiempoTrabajado += d; },
            tiempoBreak: d => { tiempoBreak += d; },
            tiempoAlmuerzo: d => { tiempoAlmuerzo += d; },
            tiempoBano: d => { tiempoBano += d; },
            tiempoCapacitacion: d => { tiempoCapacitacion += d; },
            tiempoReunion: d => { tiempoReunion += d; }
        };

        if (!Array.isArray(movimientos) || movimientos.length === 0) {
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

        let ultimoEstado = null;
        let inicioEstado = null;
        let jornadaCerrada = false;

        for (const movimiento of movimientos) {
            if (!movimiento || !movimiento.tipo || !movimiento.fecha_hora) continue;
            if (jornadaCerrada) continue;

            const fechaActual = this.convertirFechaColombia(movimiento.fecha_hora);
            if (!fechaActual) continue;

            if (!inicioEstado) {
                inicioEstado = fechaActual;
                ultimoEstado = movimiento.tipo;
                if (movimiento.tipo === "SALIDA") jornadaCerrada = true;
                continue;
            }

            const diferencia = fechaActual.getTime() - inicioEstado.getTime();
            this.acumularTiempo(ultimoEstado, diferencia, acciones);

            ultimoEstado = movimiento.tipo;
            inicioEstado = fechaActual;

            if (movimiento.tipo === "SALIDA") {
                jornadaCerrada = true;
                break;
            }
        }

        // Acumular tiempo transcurrido desde el último estado hasta el momento actual si la jornada no ha cerrado
        if (inicioEstado && ultimoEstado && !jornadaCerrada) {
            const ahora = new Date();
            const diferenciaActual = ahora.getTime() - inicioEstado.getTime();
            this.acumularTiempo(ultimoEstado, diferenciaActual, acciones);
        }

        const tiempoProductivo = Math.max(
            0,
            tiempoTrabajado - tiempoBreak - tiempoBano - tiempoCapacitacion - tiempoReunion
        );

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

    async guardarResumen(resumenId, datos) {
        if (!resumenId) {
            throw new Error("El ID del resumen es obligatorio.");
        }
        await movimientosRepository.actualizarResumenDia(resumenId, datos);
    }
}

module.exports = new ResumenJornadaService();