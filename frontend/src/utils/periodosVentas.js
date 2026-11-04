function rellenar(numero) {
    return String(numero).padStart(2, "0");
}

export function calcularPeriodoQuincenaAnterior({ year, month, day }) {
    if (![year, month, day].every(Number.isInteger) || month < 1 || month > 12 || day < 1 || day > 31) {
        throw new TypeError("La fecha para calcular la quincena debe ser válida.");
    }

    const fechaMes = new Date(Date.UTC(year, month - 1, 1));
    const correspondeSegundaQuincena = day <= 15;
    if (correspondeSegundaQuincena) fechaMes.setUTCMonth(fechaMes.getUTCMonth() - 1);

    const anioPeriodo = fechaMes.getUTCFullYear();
    const mesPeriodo = fechaMes.getUTCMonth() + 1;
    const prefijo = `${anioPeriodo}-${rellenar(mesPeriodo)}`;
    const numeroQuincena = correspondeSegundaQuincena ? "2" : "1";
    const ultimoDia = new Date(Date.UTC(anioPeriodo, mesPeriodo, 0)).getUTCDate();

    return {
        mes: prefijo,
        quincena: numeroQuincena,
        desde: `${prefijo}-${numeroQuincena === "1" ? "01" : "16"}`,
        hasta: `${prefijo}-${numeroQuincena === "1" ? "15" : rellenar(ultimoDia)}`
    };
}

export function etiquetarPeriodoQuincenal(periodo) {
    const mes = new Date(`${periodo.desde}T12:00:00Z`).toLocaleDateString("es-CO", {
        month: "long",
        year: "numeric",
        timeZone: "UTC"
    });
    return `Del ${Number(periodo.desde.slice(8, 10))} al ${Number(periodo.hasta.slice(8, 10))} de ${mes}`;
}

export function ordenarRankingQuincenal(asesores) {
    return [...asesores].sort((a, b) => {
        const ventas = Number(b.cantidad_ventas || 0) - Number(a.cantidad_ventas || 0);
        const recaudo = Number(b.total_recaudo || 0) - Number(a.total_recaudo || 0);
        const vendido = Number(b.total_vendido || 0) - Number(a.total_vendido || 0);
        return ventas || recaudo || vendido || String(a.asesor_nombre || "").localeCompare(String(b.asesor_nombre || ""), "es");
    });
}
