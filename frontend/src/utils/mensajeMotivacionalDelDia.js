import { MENSAJES_MOTIVACIONALES } from "../data/mensajesMotivacionales.js";

export function obtenerMensajeMotivacionalDelDia(fechaISO, mensajes = MENSAJES_MOTIVACIONALES) {
    if (!Array.isArray(mensajes) || mensajes.length === 0) return null;
    const coincidencia = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(fechaISO || ""));
    if (!coincidencia) return null;

    const anio = Number(coincidencia[1]);
    const mes = Number(coincidencia[2]);
    const dia = Number(coincidencia[3]);
    const instante = Date.UTC(anio, mes - 1, dia);
    const comprobacion = new Date(instante);
    if (comprobacion.getUTCFullYear() !== anio || comprobacion.getUTCMonth() + 1 !== mes || comprobacion.getUTCDate() !== dia) {
        return null;
    }

    const diasDesdeEpoch = Math.floor(instante / 86400000);
    const indice = ((diasDesdeEpoch % mensajes.length) + mensajes.length) % mensajes.length;
    return mensajes[indice];
}
