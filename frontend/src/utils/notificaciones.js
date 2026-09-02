// ==============================================
// CENTRO DE NOTIFICACIONES
// ==============================================

export function enviarNotificacion(incidencia) {

    console.log("");

    console.log("======================================");

    console.log("🚨 NUEVA INCIDENCIA");

    console.log("======================================");

    console.log("Asesor:", incidencia.nombre);

    console.log("Tipo:", incidencia.tipo);

    console.log("Nivel:", incidencia.nivel);

    console.log("Detalle:", incidencia.detalle);

    console.log("");

    console.log("📧 Coach notificado");

    console.log("📧 Customer Services notificado");

    console.log("📧 Jefa notificada");

    console.log("");

}


