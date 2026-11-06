import { versiculosVentas } from "../data/versiculosVentas.js";

export function obtenerFechaHoyBogota(fecha = new Date()) {
    const partes = new Intl.DateTimeFormat("en-CA", {
        timeZone: "America/Bogota",
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
    }).formatToParts(fecha);
    const valores = Object.fromEntries(partes.map(({ type, value }) => [type, value]));
    return `${valores.year}-${valores.month}-${valores.day}`;
}

export function obtenerVersiculoDelDia(fechaISO, catalogo = versiculosVentas) {
    if (!Array.isArray(catalogo) || catalogo.length === 0) return null;
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
    const indice = ((diasDesdeEpoch % catalogo.length) + catalogo.length) % catalogo.length;
    return { versiculo: catalogo[indice], indice, total: catalogo.length };
}
